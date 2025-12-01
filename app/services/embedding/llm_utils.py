import json
import logging
from typing import List, Dict, Any, Tuple
import litellm


from app.utils.config import Settings
from app.utils.secret_manager import InvalidAPIKeyError

# Initialize settings
settings = Settings()


def _create_posthog_properties(
    lecture_id: str | None, chat_id: str | None, texts_count: int
) -> dict:
    """Creates PostHog properties dictionary for tracking."""
    properties = {
        "service": "embedding",
        "texts_count": texts_count,
    }
    if lecture_id:
        properties["lecture_id"] = lecture_id
    if chat_id:
        properties["chat_id"] = chat_id
    return properties


def _extract_metadata(response) -> Dict[str, Any]:
    """Extracts metadata from embeddings response."""
    # Handle both dict and object responses from LiteLLM
    if isinstance(response, dict):
        model = response.get("model", "")
        usage = response.get("usage", {})
        if hasattr(usage, "model_dump"):
            usage = usage.model_dump()
    else:
        model = getattr(response, "model", "")
        usage_obj = getattr(response, "usage", None)
        usage = (
            usage_obj.model_dump()
            if usage_obj and hasattr(usage_obj, "model_dump")
            else {}
        )
    return {
        "model": model,
        "usage": usage,
    }


def _is_authentication_error(error: Exception) -> bool:
    """Checks if the error is related to authentication/invalid API key."""
    error_str = str(error).lower()
    auth_indicators = ["authentication", "unauthorized", "invalid api key", "401"]
    return any(indicator in error_str for indicator in auth_indicators)


async def generate_embeddings(
    texts: List[str],
    lecture_id: str | None = None,
    chat_id: str | None = None,
    *,
    user_id: str,
    user_api_key: str,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Generate embedding vectors for a batch of text chunks.

    Args:
        texts: List of text strings to generate embeddings for.
        lecture_id: Optional unique identifier for the lecture.
        chat_id: Optional unique identifier for the chat.
        user_id: Unique identifier for the user.
        user_api_key: User's API key for the LLM provider.

    Returns:
        A tuple containing a list of embedding results (with vector and metadata)
        and a common metadata dictionary.

    Raises:
        InvalidAPIKeyError: If the API key is invalid.
    """
    if not texts:
        return [], {}

    trace_id = lecture_id or chat_id
    span_name = "lecture_embedding" if lecture_id else "chat_embedding"

    posthog_properties = _create_posthog_properties(lecture_id, chat_id, len(texts))

    litellm.success_callback = ["posthog"]

    try:
        response = await litellm.aembedding(
            model=settings.embedding_model,
            input=texts,
            api_key=user_api_key,
            metadata={
                "user_id": user_id,
                "$ai_trace_id": trace_id,
                "$ai_span_name": span_name,
                **posthog_properties,
            },
        )

        common_metadata = _extract_metadata(response)
        results: List[Dict[str, Any]] = []
        # Handle both dict and object responses from LiteLLM
        if isinstance(response, dict):
            data_list = response.get("data", [])
        else:
            data_list = getattr(response, "data", [])

        for data_item in data_list:
            # Handle both dict and object access patterns
            if isinstance(data_item, dict):
                embedding = data_item.get("embedding", [])
            else:
                embedding = getattr(data_item, "embedding", [])
            vector_str = json.dumps(embedding)
            # Store an empty object for per-item metadata to avoid redundancy
            results.append({"vector": vector_str, "metadata": json.dumps({})})
        return results, common_metadata
    except Exception as e:
        if _is_authentication_error(e):
            logging.error(f"OpenAI authentication error (invalid API key): {e}")
            raise InvalidAPIKeyError(f"Invalid API key: {str(e)}") from e
        logging.error(
            f"An error occurred while calling the OpenAI API for embeddings: {e}",
            exc_info=True,
        )
        raise

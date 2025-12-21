import base64
import asyncio
import logging
import time
from io import BytesIO
from typing import Optional
from pydantic import ValidationError

from app.schemas.image_analysis import ImageAnalysisResult
from app.utils.config import Settings
from app.utils.secret_manager import InvalidAPIKeyError
from app.utils.posthog_client import get_openai_client, get_posthog_client

# Constants
INITIAL_REQUEST_TIMEOUT = 60.0
RETRY_REQUEST_TIMEOUT = 30.0
MAX_RETRIES = 2
PROMPT_FILE_PATH = "app/services/image_analysis/prompt.md"

# Initialize settings
settings = Settings()


def _load_system_prompt() -> str:
    """Loads the system prompt from the prompt file."""
    try:
        with open(PROMPT_FILE_PATH, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        logging.error("Image analysis prompt file not found.")
        raise


def _create_posthog_properties(
    lecture_id: str,
    slide_image_id: str,
    image_size_bytes: int,
    name: Optional[str],
    email: Optional[str],
    is_retry: bool = False,
) -> dict:
    """Creates PostHog properties dictionary for tracking."""
    properties = {
        "lecture_id": lecture_id,
        "slide_image_id": slide_image_id,
        "image_size_bytes": image_size_bytes,
        "customer_name": name,
        "customer_email": email,
    }
    if is_retry:
        properties["retry"] = True
    return properties


def _extract_metadata(response) -> dict:
    """Extracts metadata from LLM response."""
    usage = getattr(response, "usage", None)
    return {
        "model": getattr(response, "model", ""),
        "usage": usage.model_dump() if usage and hasattr(usage, "model_dump") else None,
        "response_id": getattr(response, "id", ""),
    }


def _create_fallback_response() -> ImageAnalysisResult:
    """Creates a fallback response when LLM fails to produce structured output."""
    return ImageAnalysisResult(type="content", ocr_text="", alt_text="")


def _is_authentication_error(error: Exception) -> bool:
    """Checks if the error is related to authentication/invalid API key."""
    error_str = str(error).lower()
    auth_indicators = ["authentication", "unauthorized", "invalid api key", "401"]
    return any(indicator in error_str for indicator in auth_indicators)


def _capture_posthog_event(
    customer_identifier: str,
    lecture_id: str,
    response,
    messages: list,
    latency: float,
    posthog_properties: dict,
) -> None:
    """Captures PostHog AI generation event."""
    posthog_client = get_posthog_client()
    if not posthog_client:
        return

    try:
        usage = getattr(response, "usage", None)
        input_tokens = getattr(usage, "prompt_tokens", None) if usage else None
        output_tokens = getattr(usage, "completion_tokens", None) if usage else None

        output_choices = []
        if hasattr(response, "choices") and response.choices:
            for choice in response.choices:
                choice_dict = {"role": "assistant"}
                if hasattr(choice, "message") and choice.message:
                    content = getattr(choice.message, "content", None)
                    if content:
                        choice_dict["content"] = [{"type": "text", "text": content}]
                output_choices.append(choice_dict)

        posthog_client.capture(
            distinct_id=customer_identifier,
            event="$ai_generation",
            properties={
                "$ai_trace_id": lecture_id,
                "$ai_span_name": "lecture_image_analysis",
                "$ai_model": getattr(response, "model", settings.image_analysis_model),
                "$ai_provider": "openai",
                "$ai_input": messages,
                "$ai_input_tokens": input_tokens,
                "$ai_output_choices": output_choices,
                "$ai_output_tokens": output_tokens,
                "$ai_latency": latency,
                **posthog_properties,
            },
        )
    except Exception as e:
        logging.warning(f"Failed to capture PostHog event: {e}")


async def analyze_image(
    image_bytes: bytes,
    lecture_id: str,
    slide_image_id: str,
    customer_identifier: str,
    user_api_key: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
) -> tuple[ImageAnalysisResult, dict]:
    """
    Analyzes an image using OpenAI Chat Completions API with JSON structured outputs.

    Args:
        image_bytes: The byte content of the image to analyze.
        lecture_id: Unique identifier for the lecture.
        slide_image_id: Unique identifier for the slide image.
        customer_identifier: Unique identifier for the customer.
        user_api_key: User's API key for the LLM provider.
        name: Optional customer name for tracking.
        email: Optional customer email for tracking.

    Returns:
        A tuple containing an ImageAnalysisResult object and a metadata dictionary.

    Raises:
        ValueError: If the request times out or response validation fails.
        InvalidAPIKeyError: If the API key is invalid.
        FileNotFoundError: If the prompt file is not found.
    """
    system_prompt = _load_system_prompt()

    from PIL import Image

    image = Image.open(BytesIO(image_bytes))
    image_mime_type = f"image/{image.format.lower() or 'png'}"

    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{image_mime_type};base64,{base64_image}"

    posthog_properties = _create_posthog_properties(
        lecture_id, slide_image_id, len(image_bytes), name, email
    )

    client = get_openai_client(user_api_key)

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": data_url}},
                {"type": "text", "text": "Analyze the image per the system prompt."},
            ],
        },
    ]

    for _ in range(MAX_RETRIES):
        try:
            start_time = time.time()
            response = await asyncio.wait_for(
                client.chat.completions.parse(
                    model=settings.image_analysis_model,
                    messages=messages,
                    response_format=ImageAnalysisResult,
                ),
                timeout=INITIAL_REQUEST_TIMEOUT,
            )
            latency = time.time() - start_time

            result = response.choices[0].message.parsed
            metadata = _extract_metadata(response)
            _capture_posthog_event(
                customer_identifier,
                lecture_id,
                response,
                messages,
                latency,
                posthog_properties,
            )
            return result, metadata

        except asyncio.TimeoutError:
            logging.error(
                "Timeout occurred while calling the AI model for image analysis"
            )
            raise ValueError("AI model request timed out")
        except ValidationError as e:
            logging.error(
                "Image analysis response did not match Pydantic model", exc_info=True
            )
            raise ValueError(
                "Image analysis response did not match the expected format."
            ) from e
        except Exception as e:
            if _is_authentication_error(e):
                logging.error(f"OpenAI authentication error (invalid API key): {e}")
                raise InvalidAPIKeyError(f"Invalid API key: {str(e)}") from e
            logging.error(
                "An unexpected error occurred during image analysis.", exc_info=True
            )
            raise

    # Both attempts failed - return fallback
    logging.error("Retry failed to produce structured output. Returning fallback.")
    fallback_metadata = {"is_fallback": True}
    return _create_fallback_response(), fallback_metadata

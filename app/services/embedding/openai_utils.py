import json
import logging
import random
from typing import List, Dict, Any, Tuple

from openai import AsyncOpenAI

from app.utils.config import Settings

settings = Settings()

client = AsyncOpenAI(
    api_key=settings.openai_api_key,
    base_url=settings.openai_api_base_url,
)


async def generate_embeddings(
    texts: List[str], lecture_id: str
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Generate embedding vectors for a batch of text chunks.
    """
    if not texts:
        return [], {}

    response = await client.embeddings.create(
        model=settings.embedding_model,
        input=texts,
        extra_body={
            "metadata": {
                "environment": settings.app_env,
                "service": "embedding",
                "lecture_id": lecture_id,
            }
        },
    )

    # Batch-level metadata
    common_metadata: Dict[str, Any] = {
        "model": response.model,
        "usage": response.usage.model_dump(),
    }
    results: List[Dict[str, Any]] = []
    for data in response.data:
        vector_str = json.dumps(data.embedding)
        # Store an empty object for per-item metadata to avoid redundancy
        results.append({"vector": vector_str, "metadata": json.dumps({})})
    return results, common_metadata


def mock_generate_embeddings(
    texts: List[str], lecture_id: str
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Mock embedding function for development.
    Returns a list of fake embedding vectors and metadata.
    """
    if not texts:
        return [], {}

    # Generate mock results and aggregate usage
    total_prompt = 0
    results: List[Dict[str, Any]] = []
    for text in texts:
        tokens = len(text.split())
        total_prompt += tokens
        fake_vector = [random.uniform(-1, 1) for _ in range(1536)]
        vector_str = json.dumps(fake_vector)
        # Per-item metadata for DB is an empty object
        results.append(
            {
                "vector": vector_str,
                "metadata": json.dumps({}),
            }
        )
    # Batch-level metadata
    common_metadata = {
        "model": "mock-embedding-model",
        "usage": {
            "prompt_tokens": total_prompt,
            "completion_tokens": 0,
            "total_tokens": total_prompt,
        },
        "mock": True,
    }
    logging.info(
        f"Mock embeddings generated for {len(texts)} texts (lecture_id={lecture_id})."
    )
    return results, common_metadata

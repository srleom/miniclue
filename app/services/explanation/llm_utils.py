import base64
import logging
import asyncio
import time
from typing import Optional
from pydantic import ValidationError

from app.schemas.explanation import ExplanationResult
from app.utils.config import Settings
from app.utils.secret_manager import InvalidAPIKeyError
from app.utils.posthog_client import get_openai_client, get_posthog_client


# Constants
INITIAL_REQUEST_TIMEOUT = 60.0
RETRY_REQUEST_TIMEOUT = 30.0
LLM_TEMPERATURE = 0.7
FALLBACK_ERROR_MESSAGE = (
    "Unable to generate explanation due to technical difficulties. Please try again."
)
MAX_RETRIES = 2

# Initialize settings
settings = Settings()


def _create_posthog_properties(
    lecture_id: str,
    slide_id: str,
    slide_number: int,
    total_slides: int,
    name: Optional[str],
    email: Optional[str],
    is_retry: bool = False,
) -> dict:
    """Creates PostHog properties dictionary for tracking."""
    properties = {
        "service": "explanation",
        "lecture_id": lecture_id,
        "slide_id": slide_id,
        "slide_number": slide_number,
        "total_slides": total_slides,
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


def _create_fallback_response() -> ExplanationResult:
    """Creates a fallback response when LLM fails to produce structured output."""
    return ExplanationResult(
        explanation=FALLBACK_ERROR_MESSAGE,
        slide_purpose="error",
    )


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
                "$ai_span_name": "lecture_explanation",
                "$ai_model": getattr(response, "model", settings.explanation_model),
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


async def generate_explanation(
    slide_image_bytes: bytes,
    slide_number: int,
    total_slides: int,
    lecture_id: str,
    slide_id: str,
    customer_identifier: str,
    user_api_key: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
) -> tuple[ExplanationResult, dict]:
    """
    Generates an explanation for a slide using a multi-modal LLM.

    Args:
        slide_image_bytes: The byte content of the slide image.
        slide_number: The number of the current slide.
        total_slides: The total number of slides in the lecture.
        lecture_id: Unique identifier for the lecture.
        slide_id: Unique identifier for the slide.
        customer_identifier: Unique identifier for the customer.
        user_api_key: User's API key for the LLM provider.
        name: Optional customer name for tracking.
        email: Optional customer email for tracking.

    Returns:
        A tuple containing an ExplanationResult object and a metadata dictionary.

    Raises:
        ValueError: If the request times out.
        InvalidAPIKeyError: If the API key is invalid.
        ValidationError: If the response cannot be validated.
    """
    base64_image = base64.b64encode(slide_image_bytes).decode("utf-8")
    image_url = f"data:image/png;base64,{base64_image}"

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text", "text": "Explain"},
            ],
        }
    ]

    posthog_properties = _create_posthog_properties(
        lecture_id, slide_id, slide_number, total_slides, name, email
    )

    client = get_openai_client(user_api_key)

    for _ in range(MAX_RETRIES):
        try:
            start_time = time.time()
            response = await asyncio.wait_for(
                client.chat.completions.parse(
                    model=settings.explanation_model,
                    messages=messages,
                    temperature=LLM_TEMPERATURE,
                    response_format=ExplanationResult,
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
            logging.error("Timeout occurred while calling the AI model")
            raise ValueError("AI model request timed out")
        except ValidationError as e:
            logging.error(f"Failed to validate AI response into Pydantic model: {e}")
            raise
        except Exception as e:
            if _is_authentication_error(e):
                logging.error(f"OpenAI authentication error (invalid API key): {e}")
                raise InvalidAPIKeyError(f"Invalid API key: {str(e)}") from e
            logging.error(f"An unexpected error occurred while calling OpenAI: {e}")
            raise

    # Both attempts failed - return fallback
    logging.error(
        "All retries failed to produce structured output. Returning fallback."
    )
    fallback_metadata = {"is_fallback": True}
    return _create_fallback_response(), fallback_metadata

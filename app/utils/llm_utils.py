"""Utility functions for working with OpenAI SDK APIs (Chat Completions API, Embeddings API, etc.)."""


def extract_text_from_response(response) -> str:
    """
    Extract text content from an OpenAI Chat Completions API response.

    The Chat Completions API structure is:
    {
        "choices": [{
            "message": {
                "content": "..."
            }
        }]
    }

    Args:
        response: The response object from OpenAI SDK chat.completions.create()

    Returns:
        The extracted text string, or empty string if not found
    """
    if (
        not hasattr(response, "choices")
        or not response.choices
        or len(response.choices) == 0
    ):
        return ""

    choice = response.choices[0]
    if not hasattr(choice, "message"):
        return ""

    message = choice.message
    if not hasattr(message, "content") or not message.content:
        return ""

    return message.content

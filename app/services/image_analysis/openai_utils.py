import base64
import json
import logging
from io import BytesIO
from PIL import Image

from openai import AsyncOpenAI
from pydantic import ValidationError

from app.schemas.image_analysis import ImageAnalysisResult
from app.utils.config import Settings

# Initialize settings and client at the module level
settings = Settings()
client = AsyncOpenAI(
    api_key=settings.gemini_api_key, base_url=settings.gemini_api_base_url
)

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:     %(message)s",
)


async def analyze_image(
    image_bytes: bytes,
) -> ImageAnalysisResult:
    """
    Analyzes an image using the Gemini API
    """
    try:
        with open("app/services/image_analysis/prompt.md", "r", encoding="utf-8") as f:
            system_prompt = f.read()
    except FileNotFoundError:
        logging.error("Image analysis prompt file not found for mock generation.")
        raise

    image = Image.open(BytesIO(image_bytes))
    image_mime_type = f"image/{image.format.lower() or 'png'}"

    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{image_mime_type};base64,{base64_image}"

    try:
        logging.info("Sending image to Gemini for analysis...")
        response = await client.chat.completions.create(
            model=settings.image_analysis_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": system_prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url},
                        },
                    ],
                }
            ],
            max_tokens=1024,
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        response_text = response.choices[0].message.content
        if not response_text:
            raise ValueError("Received empty response from Gemini.")

        logging.info("Received analysis from Gemini.")
        analysis_data = json.loads(response_text)
        return ImageAnalysisResult(**analysis_data)

    except json.JSONDecodeError as e:
        logging.error(
            f"Failed to decode JSON from Gemini response: {response_text}",
            exc_info=True,
        )
        raise ValueError("Gemini response was not valid JSON.") from e
    except ValidationError as e:
        logging.error(
            f"Gemini response did not match Pydantic model: {response_text}",
            exc_info=True,
        )
        raise ValueError("Gemini response did not match the expected format.") from e
    except Exception:
        logging.error(
            "An unexpected error occurred during Gemini image analysis.", exc_info=True
        )
        raise


def mock_analyze_image(image_bytes: bytes) -> ImageAnalysisResult:
    """
    Mock function for image analysis for development and testing.
    """
    logging.info(f"Mocking image analysis for image of size {len(image_bytes)} bytes.")
    return ImageAnalysisResult(
        type="content",
        ocr_text="This is mock OCR text from the image.",
        alt_text="This is a mock alt text describing the image.",
    )

from uuid import UUID
from pydantic import BaseModel, Field


class ImageAnalysisPayload(BaseModel):
    slide_image_id: UUID
    lecture_id: UUID
    image_hash: str


class ImageAnalysisResult(BaseModel):
    image_type: str = Field(
        ...,
        alias="type",
        description="The type of the image, e.g., 'content' or 'decorative'.",
    )
    ocr_text: str = Field(..., description="The extracted OCR text from the image.")
    alt_text: str = Field(..., description="A descriptive alt text for the image.")

    class Config:
        allow_population_by_field_name = True

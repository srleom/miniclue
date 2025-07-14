from uuid import UUID
from pydantic import BaseModel, Field


class ExplanationPayload(BaseModel):
    lecture_id: UUID
    slide_id: UUID
    slide_number: int
    total_slides: int
    slide_image_path: str


class ExplanationResult(BaseModel):
    explanation: str = Field(
        ..., description="Detailed explanation of the slide's content."
    )
    one_liner: str = Field(..., description="A one-sentence summary of the slide.")
    slide_purpose: str = Field(
        ..., description="The purpose of the slide in the context of the presentation."
    )

from pydantic import BaseModel
from uuid import UUID


class ExplainRequest(BaseModel):
    slide_id: UUID
    lecture_id: UUID
    slide_number: int

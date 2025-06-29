from pydantic import BaseModel
from uuid import UUID


class EmbedRequest(BaseModel):
    chunk_id: UUID
    slide_id: UUID
    lecture_id: UUID
    slide_number: int

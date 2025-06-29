from pydantic import BaseModel
from uuid import UUID


class SummarizeRequest(BaseModel):
    lecture_id: UUID

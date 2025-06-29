from pydantic import BaseModel
from uuid import UUID


class IngestRequest(BaseModel):
    lecture_id: UUID
    storage_path: str

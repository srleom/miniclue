from fastapi import APIRouter

from app.schemas.ingest import IngestRequest
from app.schemas.common import StandardResponse
from app.services.ingest import ingest as ingest_service

router = APIRouter()


@router.post("/ingest", response_model=StandardResponse)
async def ingest_endpoint(request: IngestRequest):
    """Enqueue ingestion job"""
    await ingest_service(request.lecture_id, request.storage_path)
    return StandardResponse(status="queued")

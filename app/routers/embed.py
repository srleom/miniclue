from fastapi import APIRouter

from app.schemas.embed import EmbedRequest
from app.schemas.common import StandardResponse
from app.services.embed import embed as embed_service

router = APIRouter()


@router.post("/embed", response_model=StandardResponse)
async def embed_endpoint(request: EmbedRequest):
    """Enqueue embedding job"""
    await embed_service(
        request.chunk_id, request.slide_id, request.lecture_id, request.slide_number
    )
    return StandardResponse(status="queued")

from fastapi import APIRouter

from app.schemas.summarize import SummarizeRequest
from app.schemas.common import StandardResponse
from app.services.summarize import summarize as summarize_service

router = APIRouter()


@router.post("/summarize", response_model=StandardResponse)
async def summarize_endpoint(request: SummarizeRequest):
    """Enqueue summarization job"""
    await summarize_service(request.lecture_id)
    return StandardResponse(status="queued")

from fastapi import APIRouter

from app.schemas.explain import ExplainRequest
from app.schemas.common import StandardResponse
from app.services.explain import explain as explain_service

router = APIRouter()


@router.post("/explain", response_model=StandardResponse)
async def explain_endpoint(request: ExplainRequest):
    """Enqueue explanation job"""
    await explain_service(request.slide_id, request.lecture_id, request.slide_number)
    return StandardResponse(status="queued")

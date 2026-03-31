from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.ai import (
    SmartReplyRequest, SmartReplyResponse,
    ToxicityRequest, ToxicityResponse,
    SummarizeRequest, SummarizeResponse,
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/ai", tags=["AI Features"])


@router.post("/smart-reply", response_model=SmartReplyResponse)
def smart_reply(
    data: SmartReplyRequest,
    current_user: User = Depends(get_current_user),
):
    suggestions = ai_service.get_smart_replies(data.messages)
    return SmartReplyResponse(suggestions=suggestions)


@router.post("/toxicity", response_model=ToxicityResponse)
def check_toxicity(
    data: ToxicityRequest,
    current_user: User = Depends(get_current_user),
):
    result = ai_service.check_toxicity(data.text)
    return ToxicityResponse(**result)


@router.post("/summarize", response_model=SummarizeResponse)
def summarize_chat(
    data: SummarizeRequest,
    current_user: User = Depends(get_current_user),
):
    summary = ai_service.summarize_chat(data.messages, data.num_sentences)
    return SummarizeResponse(summary=summary)

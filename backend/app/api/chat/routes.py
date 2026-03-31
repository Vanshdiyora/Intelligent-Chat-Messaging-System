from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.chat import ConversationCreate, MessageCreate
from app.services.chat_service import (
    create_conversation,
    get_user_conversations,
    get_conversation_messages,
    create_message,
)

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/conversations")
def create_new_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = create_conversation(db, current_user.id, data)
    return {"id": conversation.id, "name": conversation.name, "is_group": conversation.is_group}


@router.get("/conversations")
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_conversations(db, current_user.id)


@router.get("/conversations/{conversation_id}/messages")
def list_messages(
    conversation_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_conversation_messages(db, conversation_id, current_user.id, limit, offset)


@router.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.ai_service import ai_service

    # Check toxicity
    toxicity_result = ai_service.check_toxicity(data.content)
    message = create_message(
        db,
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=data.content,
        message_type=data.message_type,
        is_toxic=toxicity_result["is_toxic"],
        toxicity_score=toxicity_result["confidence"] if toxicity_result["is_toxic"] else None,
    )

    return {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "sender_username": current_user.username,
        "content": message.content,
        "message_type": message.message_type,
        "is_toxic": message.is_toxic,
        "toxicity_score": message.toxicity_score,
        "created_at": message.created_at.isoformat(),
    }

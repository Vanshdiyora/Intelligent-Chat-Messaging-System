from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.chat import Conversation, ConversationParticipant, Message
from app.models.user import User
from app.schemas.chat import ConversationCreate, MessageCreate
from fastapi import HTTPException, status
from datetime import datetime


def create_conversation(db: Session, user_id: int, data: ConversationCreate) -> Conversation:
    all_participant_ids = list(set([user_id] + data.participant_ids))

    # For 1-on-1 chats, check if conversation already exists
    if not data.is_group and len(all_participant_ids) == 2:
        existing = _find_direct_conversation(db, all_participant_ids[0], all_participant_ids[1])
        if existing:
            return existing

    conversation = Conversation(
        name=data.name,
        is_group=data.is_group or len(all_participant_ids) > 2,
    )
    db.add(conversation)
    db.flush()

    for pid in all_participant_ids:
        participant = ConversationParticipant(conversation_id=conversation.id, user_id=pid)
        db.add(participant)

    db.commit()
    db.refresh(conversation)
    return conversation


def _find_direct_conversation(db: Session, user1_id: int, user2_id: int) -> Conversation | None:
    convos_user1 = (
        db.query(ConversationParticipant.conversation_id)
        .filter(ConversationParticipant.user_id == user1_id)
        .subquery()
    )
    result = (
        db.query(Conversation)
        .join(ConversationParticipant)
        .filter(
            Conversation.is_group == False,
            ConversationParticipant.user_id == user2_id,
            ConversationParticipant.conversation_id.in_(convos_user1),
        )
        .first()
    )
    return result


def get_user_conversations(db: Session, user_id: int) -> list[dict]:
    participations = (
        db.query(ConversationParticipant)
        .filter(ConversationParticipant.user_id == user_id)
        .all()
    )
    conversation_ids = [p.conversation_id for p in participations]

    conversations = (
        db.query(Conversation)
        .filter(Conversation.id.in_(conversation_ids))
        .order_by(desc(Conversation.updated_at))
        .all()
    )

    result = []
    for conv in conversations:
        participants = [
            {"id": p.user.id, "username": p.user.username, "display_name": p.user.display_name,
             "is_online": p.user.is_online, "avatar_url": p.user.avatar_url}
            for p in conv.participants
        ]

        last_msg = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(desc(Message.created_at))
            .first()
        )

        last_message = None
        if last_msg:
            last_message = {
                "id": last_msg.id,
                "conversation_id": last_msg.conversation_id,
                "sender_id": last_msg.sender_id,
                "sender_username": last_msg.sender.username if last_msg.sender else None,
                "content": last_msg.content,
                "message_type": last_msg.message_type,
                "is_toxic": last_msg.is_toxic,
                "toxicity_score": last_msg.toxicity_score,
                "created_at": last_msg.created_at.isoformat(),
            }

        result.append({
            "id": conv.id,
            "name": conv.name,
            "is_group": conv.is_group,
            "created_at": conv.created_at.isoformat(),
            "updated_at": conv.updated_at.isoformat(),
            "participants": participants,
            "last_message": last_message,
        })

    return result


def get_conversation_messages(db: Session, conversation_id: int, user_id: int, limit: int = 50, offset: int = 0) -> list[dict]:
    # Verify user is participant
    participant = (
        db.query(ConversationParticipant)
        .filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
        .first()
    )
    if not participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this conversation")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(desc(Message.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "sender_username": m.sender.username if m.sender else None,
            "content": m.content,
            "message_type": m.message_type,
            "is_toxic": m.is_toxic,
            "toxicity_score": m.toxicity_score,
            "created_at": m.created_at.isoformat(),
        }
        for m in reversed(messages)
    ]


def create_message(
    db: Session,
    conversation_id: int,
    sender_id: int,
    content: str,
    message_type: str = "text",
    is_toxic: bool = False,
    toxicity_score: float | None = None,
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        message_type=message_type,
        is_toxic=is_toxic,
        toxicity_score=toxicity_score,
    )
    db.add(message)

    # Update conversation timestamp
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv:
        conv.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(message)
    return message

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from jose import JWTError, jwt
import json

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.chat import ConversationParticipant, Message
from app.models.user import User
from app.services.chat_service import create_message
from app.services.user_service import set_user_online
from app.services.ai_service import ai_service
from app.websockets.connection_manager import manager

router = APIRouter()


def get_user_from_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        return int(user_id) if user_id else None
    except (JWTError, ValueError):
        return None


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    user_id = get_user_from_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(websocket, user_id)
    db = SessionLocal()

    try:
        # Set user online
        set_user_online(db, user_id, True)

        # Notify contacts that user is online
        await _broadcast_status(db, user_id, True)

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            msg_type = message_data.get("type")

            if msg_type == "message":
                await _handle_message(db, user_id, message_data)
            elif msg_type == "typing":
                await _handle_typing(db, user_id, message_data)

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect(user_id)
        set_user_online(db, user_id, False)
        await _broadcast_status(db, user_id, False)
        db.close()


async def _handle_message(db, sender_id: int, data: dict):
    conversation_id = data.get("conversation_id")
    content = data.get("content", "")
    message_type = data.get("message_type", "text")

    if not conversation_id or not content:
        return

    # Check toxicity
    toxicity_result = ai_service.check_toxicity(content)

    # Save message
    message = create_message(
        db,
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        message_type=message_type,
        is_toxic=toxicity_result["is_toxic"],
        toxicity_score=toxicity_result["confidence"] if toxicity_result["is_toxic"] else None,
    )

    sender = db.query(User).filter(User.id == sender_id).first()

    # Get participant IDs
    participants = (
        db.query(ConversationParticipant)
        .filter(ConversationParticipant.conversation_id == conversation_id)
        .all()
    )
    participant_ids = [p.user_id for p in participants]

    # Broadcast to all participants
    ws_message = {
        "type": "new_message",
        "message": {
            "id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "sender_username": sender.username if sender else "Unknown",
            "content": message.content,
            "message_type": message.message_type,
            "is_toxic": message.is_toxic,
            "toxicity_score": message.toxicity_score,
            "created_at": message.created_at.isoformat(),
        },
    }

    await manager.broadcast_to_conversation(ws_message, participant_ids)


async def _handle_typing(db, user_id: int, data: dict):
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return

    participants = (
        db.query(ConversationParticipant)
        .filter(ConversationParticipant.conversation_id == conversation_id)
        .all()
    )
    participant_ids = [p.user_id for p in participants]

    sender = db.query(User).filter(User.id == user_id).first()

    await manager.broadcast_to_conversation(
        {
            "type": "typing",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "username": sender.username if sender else "Unknown",
        },
        participant_ids,
        exclude_id=user_id,
    )


async def _broadcast_status(db, user_id: int, is_online: bool):
    """Notify all conversation partners about user's online status."""
    participants = (
        db.query(ConversationParticipant)
        .filter(ConversationParticipant.user_id == user_id)
        .all()
    )

    notified_users = set()
    for p in participants:
        co_participants = (
            db.query(ConversationParticipant)
            .filter(
                ConversationParticipant.conversation_id == p.conversation_id,
                ConversationParticipant.user_id != user_id,
            )
            .all()
        )
        for cp in co_participants:
            if cp.user_id not in notified_users:
                notified_users.add(cp.user_id)
                await manager.send_personal_message(
                    {"type": "status", "user_id": user_id, "is_online": is_online},
                    cp.user_id,
                )

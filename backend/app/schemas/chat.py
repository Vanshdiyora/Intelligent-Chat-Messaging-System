from pydantic import BaseModel
from datetime import datetime


class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_username: str | None = None
    content: str
    message_type: str
    is_toxic: bool
    toxicity_score: float | None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    participant_ids: list[int]
    name: str | None = None
    is_group: bool = False


class ConversationResponse(BaseModel):
    id: int
    name: str | None
    is_group: bool
    created_at: datetime
    updated_at: datetime
    participants: list[dict] = []
    last_message: MessageResponse | None = None

    class Config:
        from_attributes = True


class WebSocketMessage(BaseModel):
    type: str  # "message", "typing", "read"
    conversation_id: int | None = None
    content: str | None = None
    message_type: str = "text"

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import json


class ConnectionManager:
    """Manages WebSocket connections for real-time messaging."""

    def __init__(self):
        # user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)

    def is_online(self, user_id: int) -> bool:
        return user_id in self.active_connections

    async def send_personal_message(self, message: dict, user_id: int):
        websocket = self.active_connections.get(user_id)
        if websocket:
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(user_id)

    async def broadcast_to_conversation(self, message: dict, participant_ids: list[int], exclude_id: int | None = None):
        for user_id in participant_ids:
            if user_id != exclude_id:
                await self.send_personal_message(message, user_id)


manager = ConnectionManager()

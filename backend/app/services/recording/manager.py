"""
Per-lecture WebSocket connection manager.

Holds the currently-active socket for each lecture id. A single module-level
`manager` singleton is imported by both the WebSocket route and any component
that needs to push messages to a client.
"""
from __future__ import annotations

import logging
from typing import Dict

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, lecture_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[lecture_id] = websocket
        logger.info("Client connected to lecture %s", lecture_id)

    def disconnect(self, lecture_id: str) -> None:
        if lecture_id in self.active_connections:
            del self.active_connections[lecture_id]
            logger.info("Client disconnected from lecture %s", lecture_id)

    async def send_message(self, lecture_id: str, message: dict) -> None:
        if lecture_id in self.active_connections:
            await self.active_connections[lecture_id].send_json(message)


manager = ConnectionManager()

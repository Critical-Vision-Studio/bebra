"""
WebSocket connection manager for real-time messaging.
Tracks active WebSocket connections per user and provides
broadcast/send helpers.
"""
import logging
import json
from typing import Dict, Set
from datetime import datetime
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections keyed by user ID."""

    def __init__(self):
        self._connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        if user_id not in self._connections:
            self._connections[user_id] = set()
        self._connections[user_id].add(ws)
        logger.info(f"WS connected: user {user_id} (total conns: {len(self._connections[user_id])})")

    def disconnect(self, user_id: int, ws: WebSocket):
        if user_id in self._connections:
            self._connections[user_id].discard(ws)
            if not self._connections[user_id]:
                del self._connections[user_id]
        logger.info(f"WS disconnected: user {user_id}")

    def is_online(self, user_id: int) -> bool:
        return user_id in self._connections and len(self._connections[user_id]) > 0

    async def send_to_user(self, user_id: int, data: dict):
        """Send JSON payload to all connections of a given user."""
        connections = self._connections.get(user_id, set()).copy()
        if not connections:
            logger.debug(f"WS send: user {user_id} has no active connections (known users: {list(self._connections.keys())})")
            return
        logger.info(f"WS send: pushing to user {user_id} ({len(connections)} conn(s))")
        dead = []
        for ws in connections:
            try:
                await ws.send_json(data)
            except Exception as e:
                logger.warning(f"WS send failed for user {user_id}: {e}")
                dead.append(ws)
        for ws in dead:
            self.disconnect(user_id, ws)


def _serialize_datetime(obj):
    """JSON serializer for datetime objects."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


# Singleton instance shared across the application
manager = ConnectionManager()

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active: WebSocket | None = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active = websocket

    def disconnect(self):
        self.active = None

    async def send(self, data: dict):
        if self.active:
            await self.active.send_json(data)

    @property
    def is_connected(self) -> bool:
        return self.active is not None


manager = ConnectionManager()

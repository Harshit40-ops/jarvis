from fastapi import APIRouter
from android_bridge.models.schemas import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])

_inbox: list[Notification] = []


@router.post("/")
async def receive_notification(notification: Notification):
    """Android app pushes a notification here."""
    _inbox.append(notification)
    return {"status": "received"}


@router.get("/")
async def get_notifications(limit: int = 20) -> list[Notification]:
    """JARVIS polls the latest notifications."""
    return _inbox[-limit:]


@router.delete("/")
async def clear_notifications():
    _inbox.clear()
    return {"status": "cleared"}

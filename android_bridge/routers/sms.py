from fastapi import APIRouter
from android_bridge.models.schemas import SmsMessage, SmsSendRequest, CommandResponse
from android_bridge.ws.manager import manager

router = APIRouter(prefix="/sms", tags=["sms"])

_inbox: list[SmsMessage] = []


@router.post("/incoming")
async def receive_sms(sms: SmsMessage):
    """Android app pushes incoming SMS here."""
    _inbox.append(sms)
    return {"status": "received"}


@router.get("/")
async def get_messages(limit: int = 20) -> list[SmsMessage]:
    """JARVIS reads recent SMS messages."""
    return _inbox[-limit:]


@router.post("/send", response_model=CommandResponse)
async def send_sms(request: SmsSendRequest):
    """JARVIS asks the Android app to send an SMS via WebSocket."""
    await manager.send({"action": "send_sms", "recipient": request.recipient, "message": request.message})
    return CommandResponse(status="queued", message=f"SMS to {request.recipient} queued.")

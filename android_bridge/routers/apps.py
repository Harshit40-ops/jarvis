from fastapi import APIRouter
from android_bridge.models.schemas import AppLaunchRequest, CommandResponse
from android_bridge.ws.manager import manager

router = APIRouter(prefix="/apps", tags=["apps"])

KNOWN_PACKAGES = {
    "whatsapp": "com.whatsapp",
    "youtube": "com.google.android.youtube",
    "camera": "com.android.camera2",
    "maps": "com.google.android.apps.maps",
    "spotify": "com.spotify.music",
    "chrome": "com.android.chrome",
    "settings": "com.android.settings",
    "phone": "com.android.dialer",
    "messages": "com.google.android.apps.messaging",
}


@router.post("/launch", response_model=CommandResponse)
async def launch_app(request: AppLaunchRequest):
    """JARVIS asks the Android app to open an app via WebSocket."""
    await manager.send({"action": "launch_app", "package": request.package_name})
    return CommandResponse(status="queued", message=f"Launch {request.package_name} queued.")


@router.get("/packages")
async def list_known_packages() -> dict[str, str]:
    return KNOWN_PACKAGES

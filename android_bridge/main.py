import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from android_bridge.routers import notifications, sms, apps
from android_bridge.ws.manager import manager

app = FastAPI(title="JARVIS Android Bridge", version="1.0.0")

app.include_router(notifications.router)
app.include_router(sms.router)
app.include_router(apps.router)


@app.get("/health")
async def health():
    return {"status": "ok", "android_connected": manager.is_connected}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Persistent WebSocket connection from the Android companion app."""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Android → JARVIS events (e.g. notification, sms) are routed here
            print(f"[WS]: {data}")
    except WebSocketDisconnect:
        manager.disconnect()


if __name__ == "__main__":
    uvicorn.run("android_bridge.main:app", host="0.0.0.0", port=8765, reload=True)

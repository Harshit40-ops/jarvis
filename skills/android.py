import requests

BRIDGE_URL = "http://192.168.29.53:8765"

KNOWN_APPS = {
    "whatsapp":  "com.whatsapp",
    "youtube":   "com.google.android.youtube",
    "camera":    "com.android.camera2",
    "maps":      "com.google.android.apps.maps",
    "spotify":   "com.spotify.music",
    "chrome":    "com.android.chrome",
    "settings":  "com.android.settings",
    "phone":     "com.android.dialer",
    "messages":  "com.google.android.apps.messaging",
    "instagram": "com.instagram.android",
    "facebook":  "com.facebook.katana",
    "gmail":     "com.google.android.gm",
    "calculator":"com.android.calculator2",
    "contacts":  "com.android.contacts",
    "gallery":   "com.google.android.apps.photos",
}


class AndroidBridge:
    def __init__(self, speaker):
        self.speaker = speaker

    def is_online(self) -> bool:
        try:
            return requests.get(f"{BRIDGE_URL}/health", timeout=2).ok
        except Exception:
            return False

    # ── apps ──────────────────────────────────────────────────────────────

    def launch_app(self, app_name: str) -> bool:
        name = app_name.strip().lower()
        package = KNOWN_APPS.get(name)
        if not package:
            self.speaker.speak(f"I don't know how to open {app_name} on your phone.")
            return False
        try:
            resp = requests.post(
                f"{BRIDGE_URL}/apps/launch",
                json={"package_name": package},
                timeout=5,
            )
            if resp.ok:
                self.speaker.speak(f"Opening {app_name} on your phone.")
                return True
        except Exception:
            pass
        self.speaker.speak("I couldn't reach your phone. Is the companion app running?")
        return False

    # ── sms ───────────────────────────────────────────────────────────────

    def send_sms(self, recipient: str, message: str) -> bool:
        try:
            resp = requests.post(
                f"{BRIDGE_URL}/sms/send",
                json={"recipient": recipient, "message": message},
                timeout=5,
            )
            if resp.ok:
                self.speaker.speak(f"Message sent to {recipient}.")
                return True
        except Exception:
            pass
        self.speaker.speak("Failed to send the message. Check your phone connection.")
        return False

    def read_sms(self) -> list[dict]:
        try:
            resp = requests.get(f"{BRIDGE_URL}/sms", timeout=5)
            return resp.json() if resp.ok else []
        except Exception:
            return []

    # ── notifications ─────────────────────────────────────────────────────

    def read_notifications(self) -> list[dict]:
        try:
            resp = requests.get(f"{BRIDGE_URL}/notifications", timeout=5)
            return resp.json() if resp.ok else []
        except Exception:
            return []

    def clear_notifications(self):
        try:
            requests.delete(f"{BRIDGE_URL}/notifications", timeout=5)
        except Exception:
            pass

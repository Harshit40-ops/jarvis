import os
import threading
import cv2
import numpy as np
from google import genai
from google.genai import types
from config.settings import GEMINI_MODEL


class Vision:
    _FACE_CASCADE = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    def __init__(self):
        self._cap: cv2.VideoCapture | None = None
        self._live_thread: threading.Thread | None = None
        self._stop_event = threading.Event()

        api_key = os.environ.get("GEMINI_API_KEY")
        self._client = genai.Client(api_key=api_key) if api_key else None

    # ── webcam ─────────────────────────────────────────────────────────────

    def open_camera(self, index: int = 0) -> bool:
        self._cap = cv2.VideoCapture(index)
        return self._cap.isOpened()

    def close_camera(self):
        self._stop_event.set()
        if self._live_thread:
            self._live_thread.join(timeout=2)
        if self._cap:
            self._cap.release()
            self._cap = None
        cv2.destroyAllWindows()

    def capture_frame(self) -> np.ndarray | None:
        opened_here = False
        if not self._cap or not self._cap.isOpened():
            if not self.open_camera():
                return None
            opened_here = True

        ret, frame = self._cap.read()

        if opened_here:
            self._cap.release()
            self._cap = None

        return frame if ret else None

    # ── face detection ─────────────────────────────────────────────────────

    def detect_faces(self, frame: np.ndarray | None = None) -> list[dict]:
        if frame is None:
            frame = self.capture_frame()
        if frame is None:
            return []
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        detections = self._FACE_CASCADE.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )
        if not len(detections):
            return []
        return [
            {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
            for x, y, w, h in detections
        ]

    # ── object detection (Gemini Vision) ───────────────────────────────────

    def describe_scene(self, frame: np.ndarray | None = None) -> str:
        if frame is None:
            frame = self.capture_frame()
        if frame is None:
            return "I can't access the camera."
        if not self._client:
            return "Gemini API is not configured for vision."

        _, buf = cv2.imencode(".jpg", frame)
        try:
            response = self._client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[
                    types.Content(parts=[
                        types.Part(
                            inline_data=types.Blob(
                                mime_type="image/jpeg",
                                data=buf.tobytes(),
                            )
                        ),
                        types.Part(
                            text=(
                                "Describe what you see in this image concisely. "
                                "Focus on people, objects, and the setting. "
                                "Keep it conversational — it will be spoken aloud."
                            )
                        ),
                    ])
                ],
            )
            return response.text
        except Exception as e:
            print(f"[ERROR]: Vision/Gemini — {e}")
            return "I had trouble analysing the image."

    def detect_objects(self, frame: np.ndarray | None = None) -> str:
        if frame is None:
            frame = self.capture_frame()
        if frame is None:
            return "I can't access the camera."
        if not self._client:
            return "Gemini API is not configured for object detection."

        _, buf = cv2.imencode(".jpg", frame)
        try:
            response = self._client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[
                    types.Content(parts=[
                        types.Part(
                            inline_data=types.Blob(
                                mime_type="image/jpeg",
                                data=buf.tobytes(),
                            )
                        ),
                        types.Part(
                            text=(
                                "List the distinct objects you detect in this image. "
                                "Keep the list short and say it naturally for voice output."
                            )
                        ),
                    ])
                ],
            )
            return response.text
        except Exception as e:
            print(f"[ERROR]: Vision/Gemini — {e}")
            return "I had trouble detecting objects."

    # ── live feed ──────────────────────────────────────────────────────────

    def start_live_feed(self) -> bool:
        if self._live_thread and self._live_thread.is_alive():
            return True
        self._stop_event.clear()
        self._live_thread = threading.Thread(target=self._feed_loop, daemon=True)
        self._live_thread.start()
        return True

    def stop_live_feed(self):
        self._stop_event.set()
        if self._live_thread:
            self._live_thread.join(timeout=2)
        cv2.destroyAllWindows()

    def _feed_loop(self):
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("[ERROR]: Cannot open camera for live feed.")
            return

        while not self._stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                break

            self._draw_faces(frame)
            cv2.imshow("JARVIS Vision", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

        cap.release()
        cv2.destroyAllWindows()

    def _draw_faces(self, frame: np.ndarray):
        for face in self.detect_faces(frame):
            x, y, w, h = face["x"], face["y"], face["w"], face["h"]
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(
                frame, "Face", (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2,
            )

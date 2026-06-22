import subprocess
import os
from config.settings import APP_PATHS


class AppLauncher:
    def __init__(self, speaker):
        self.speaker = speaker

    def open_app(self, app_name: str):
        app_name = app_name.lower().strip()

        # Check known app map first
        for key, path in APP_PATHS.items():
            if key in app_name:
                self._launch(key, path)
                return

        # Fallback: try launching directly by name
        self.speaker.speak(f"Trying to open {app_name}.")
        try:
            subprocess.Popen([app_name], shell=True)
        except Exception as e:
            self.speaker.speak(f"Sorry, I could not open {app_name}.")
            print(f"[ERROR]: {e}")

    def _launch(self, label: str, path: str):
        self.speaker.speak(f"Opening {label}.")
        try:
            if os.path.isabs(path) and not os.path.exists(path):
                # Absolute path not found — fall back to shell launch
                subprocess.Popen(path, shell=True)
            else:
                subprocess.Popen(path, shell=True)
        except Exception as e:
            self.speaker.speak(f"Failed to open {label}.")
            print(f"[ERROR]: {e}")

import os
import subprocess


class DesktopCommands:
    # Each entry is a list of paths tried in order; first one that exists wins.
    # Bare executable names (no path separator) are resolved via PATH / shell.
    _APP_PATHS: dict[str, list[str]] = {
        "chrome": [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            "chrome",
        ],
        "vs code": [
            os.path.join(os.environ.get("LOCALAPPDATA", ""), r"Programs\Microsoft VS Code\Code.exe"),
            r"C:\Program Files\Microsoft VS Code\Code.exe",
            "code",
        ],
        "visual studio code": None,  # alias — resolved below
        "code": None,
        "calculator": ["calc.exe"],
        "notepad": ["notepad.exe"],
    }

    # Aliases that share another entry's path list
    _ALIASES = {
        "visual studio code": "vs code",
        "code": "vs code",
        "vscode": "vs code",
    }

    def __init__(self, speaker):
        self.speaker = speaker

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def can_handle(self, app_name: str) -> bool:
        key = self._normalise(app_name)
        return key in self._APP_PATHS or key in self._ALIASES

    def open(self, app_name: str):
        key = self._normalise(app_name)
        key = self._ALIASES.get(key, key)

        paths = self._APP_PATHS.get(key)
        if not paths:
            self.speaker.speak(f"I don't have a command configured for {app_name}.")
            return

        label = key.title()
        for path in paths:
            if self._try_launch(path):
                self.speaker.speak(f"Opening {label}.")
                return

        self.speaker.speak(f"Could not find {label} on this computer.")

    def shutdown(self):
        self.speaker.speak("Shutting down the computer. Goodbye!")
        subprocess.run(["shutdown", "/s", "/t", "5"], shell=True)

    def restart(self):
        self.speaker.speak("Restarting the computer. Be right back!")
        subprocess.run(["shutdown", "/r", "/t", "5"], shell=True)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _normalise(self, name: str) -> str:
        return name.strip().lower()

    def _try_launch(self, path: str) -> bool:
        is_absolute = os.sep in path or "/" in path
        if is_absolute and not os.path.exists(path):
            return False
        try:
            subprocess.Popen(path, shell=True)
            return True
        except Exception as e:
            print(f"[ERROR]: {e}")
            return False

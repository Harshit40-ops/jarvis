"""
JARVIS Unified Server — serves both the React UI and the AI backend API.
Run:  python jarvis_api.py
Then: Electron opens automatically at http://localhost:8000
"""
import sys
import os
# Force UTF-8 output so Unicode banner prints on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import re
import asyncio
import subprocess
import threading
import webbrowser
import urllib.parse
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn

from skills.assistant import ClaudeAssistant
from skills.memory import Memory
import pyttsx3

# Lazy-init voice input — avoids crash if mic is unavailable at startup
_voice_input = None
_voice_init_lock = threading.Lock()

def _get_voice_input():
    global _voice_input
    if _voice_input is None:
        with _voice_init_lock:
            if _voice_input is None:
                try:
                    from core.voice_input import VoiceInput
                    _voice_input = VoiceInput()
                except Exception as e:
                    print(f"[MIC] init failed: {e}")
    return _voice_input

# ── app setup ─────────────────────────────────────────────────────────────────

app = FastAPI(title="JARVIS", version="2.0", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── backend services ───────────────────────────────────────────────────────────

memory    = Memory()
assistant = ClaudeAssistant(memory)
_recent_cmds: list[dict] = []
_speak_lock = threading.Lock()


def _speak_windows(text: str):
    """Speak using pyttsx3 Windows SAPI — deep male voice."""
    def _run():
        with _speak_lock:
            try:
                engine = pyttsx3.init()
                voices = engine.getProperty('voices')
                # Find deep male voice — prefer David or Mark
                chosen = None
                for v in voices:
                    if any(n in v.name.lower() for n in ['david', 'mark', 'zac', 'george']):
                        chosen = v.id
                        break
                if not chosen and voices:
                    chosen = voices[0].id
                if chosen:
                    engine.setProperty('voice', chosen)
                engine.setProperty('rate', 155)
                engine.setProperty('volume', 1.0)
                engine.say(text)
                engine.runAndWait()
                engine.stop()
            except Exception as e:
                print(f"[TTS] error: {e}")
    threading.Thread(target=_run, daemon=True).start()


CHROME_PATHS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
]

def _open_in_chrome(url: str):
    for path in CHROME_PATHS:
        if os.path.exists(path):
            subprocess.Popen([path, url])
            return
    webbrowser.open(url)

def _get_first_youtube_url(song: str) -> str | None:
    """Scrape YouTube search and return the first video URL."""
    import requests as req
    query = urllib.parse.quote_plus(song)
    try:
        r = req.get(
            f"https://www.youtube.com/results?search_query={query}",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"},
            timeout=6,
        )
        # YouTube embeds video IDs as "videoId":"XXXXXXXXXXX" in the page JS
        ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', r.text)
        # First unique ID is the first search result
        seen = []
        for vid in ids:
            if vid not in seen:
                seen.append(vid)
            if len(seen) == 1:
                return f"https://www.youtube.com/watch?v={seen[0]}"
    except Exception as e:
        print(f"[YT] fetch error: {e}")
    return None


def _open_youtube(song: str) -> str:
    url = _get_first_youtube_url(song)
    if url:
        _open_in_chrome(url)
        return f"Playing '{song}' on YouTube."
    # Fallback to search page if scraping fails
    query = urllib.parse.quote_plus(song)
    _open_in_chrome(f"https://www.youtube.com/results?search_query={query}")
    return f"Searching YouTube for '{song}'."


# YouTube command patterns
_YT_PATTERNS = [
    r"play (.+?) (?:on|in|from) youtube",
    r"play (.+?) (?:on|in|from) yt",
    r"(?:open|launch) youtube (?:and )?(?:play|search|open) (.+)",
    r"(?:open|launch) (.+?) (?:on|in) youtube",
    r"youtube (?:play|search|open) (.+)",
    r"youtube (.+)",
    r"search youtube (?:for )?(.+)",
    r"play (.+?) song",
    r"play (.+)",
]


class CommandRequest(BaseModel):
    command: str


def _route_command(command: str) -> str:
    cmd = command.strip().lower()

    if any(cmd.startswith(k) for k in ["exit", "quit", "shutdown computer", "restart computer"]):
        return "Shutdown commands are disabled in UI mode."

    # ── YouTube / music ───────────────────────────────────────────────────────
    # "open youtube" with no song → just open YouTube homepage
    if cmd in ("open youtube", "launch youtube", "start youtube", "youtube"):
        _open_in_chrome("https://www.youtube.com")
        return "Opening YouTube."

    # "play X on youtube" / "youtube X" / "play X" etc.
    for pattern in _YT_PATTERNS:
        m = re.search(pattern, cmd)
        if m:
            song = m.group(1).strip().rstrip(".")
            # Avoid triggering on generic "play" without a song name
            if len(song) > 1:
                return _open_youtube(song)

    # ── Open app ──────────────────────────────────────────────────────────────
    if cmd.startswith(("open ", "launch ", "start ")):
        app_name = cmd.split(" ", 1)[1].strip()
        APPS = {
            "chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            "vs code": r"C:\Users\intel\AppData\Local\Programs\Microsoft VS Code\Code.exe",
            "vscode": r"C:\Users\intel\AppData\Local\Programs\Microsoft VS Code\Code.exe",
            "notepad": "notepad.exe",
            "calculator": "calc.exe",
            "file explorer": "explorer.exe",
            "explorer": "explorer.exe",
            "task manager": "taskmgr.exe",
            "paint": "mspaint.exe",
            "edge": "msedge.exe",
            "cmd": "cmd.exe",
        }
        for key, path in APPS.items():
            if key in app_name:
                try:
                    subprocess.Popen(path, shell=True)
                    return f"Opening {key.title()}."
                except Exception as e:
                    return f"Couldn't open {key}: {e}"
        return f"I don't know how to open '{app_name}'."

    # Web search
    if cmd.startswith(("search for ", "google ", "search ")):
        query = cmd.split(" ", 1)[1].replace("for ", "", 1).strip()
        _open_in_chrome(f"https://www.google.com/search?q={urllib.parse.quote_plus(query)}")
        return f"Searching Google for: {query}"

    # Memory
    if cmd.startswith("my name is "):
        name = cmd[len("my name is "):].strip().title()
        memory.set_user_name(name)
        return f"Got it! I'll remember your name is {name}."

    if cmd.startswith("remember ") and " is " in cmd:
        rest = cmd[len("remember "):]
        key, _, val = rest.partition(" is ")
        memory.set_preference(key.strip(), val.strip())
        return f"Remembered: {key.strip()} is {val.strip()}."

    if any(cmd.startswith(k) for k in ["what is my name", "what's my name", "who am i"]):
        name = memory.get_user_name()
        return f"Your name is {name}." if name else "I don't know your name yet."

    if any(cmd.startswith(k) for k in ["clear memory", "forget everything", "reset memory"]):
        memory.clear_conversations()
        return "Done. Conversation history cleared."

    # Gemini AI fallback
    return assistant.ask(command)


# ── API routes ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "jarvis": "online"}


class SpeakRequest(BaseModel):
    text: str


@app.post("/speak")
async def speak(req: SpeakRequest):
    _speak_windows(req.text)
    return {"status": "speaking"}


@app.post("/listen")
async def listen_voice():
    """Record mic via VAD — stops automatically when you stop speaking."""
    def _do_listen():
        vi = _get_voice_input()
        if vi is None:
            return None
        return vi.listen(max_duration=8)

    loop = asyncio.get_event_loop()
    text = await loop.run_in_executor(None, _do_listen)
    if text:
        return {"transcript": text, "status": "ok"}
    return {"transcript": None, "status": "no_speech"}


@app.post("/command")
async def handle_command(req: CommandRequest):
    print(f"[JARVIS] ▶ {req.command}")
    response = _route_command(req.command)
    _recent_cmds.append({
        "command": req.command,
        "response": response,
        "time": datetime.now().strftime("%H:%M:%S"),
    })
    if len(_recent_cmds) > 50:
        _recent_cmds.pop(0)
    print(f"[JARVIS] ◀ {response[:80]}")
    # Speak via Windows SAPI automatically
    _speak_windows(response)
    return {"response": response}


@app.get("/memory")
async def get_memory():
    name = memory.get_user_name()
    prefs = memory.get_all_preferences()
    items = []
    if name:
        items.append({"key": "name", "value": name, "category": "profile", "time": "stored"})
    for k, v in prefs.items():
        items.append({"key": k, "value": v, "category": "preference", "time": "stored"})
    return items


@app.get("/history")
async def get_history():
    return memory.get_recent_conversations(limit=20)


@app.get("/commands")
async def get_commands():
    return _recent_cmds[-10:]


@app.delete("/memory/conversations")
async def clear_conversations():
    memory.clear_conversations()
    return {"status": "cleared"}


# ── serve React UI ─────────────────────────────────────────────────────────────

_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "jarvis-ui", "dist")

if os.path.exists(_DIST):
    # Serve JS/CSS/image assets
    app.mount("/assets", StaticFiles(directory=os.path.join(_DIST, "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(_DIST, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_DIST, "index.html"))
else:
    @app.get("/")
    async def no_build():
        return {"error": "React build not found. Run: cd jarvis-ui && npm run build"}


# ── launch Electron after server starts ───────────────────────────────────────

def _launch_electron():
    import time
    time.sleep(2)
    electron_exe = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "jarvis-ui", "node_modules", "electron", "dist", "electron.exe"
    )
    main_js = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "jarvis-ui", "electron", "main.cjs"
    )
    if os.path.exists(electron_exe):
        env = os.environ.copy()
        env["NODE_ENV"] = "production"
        env["JARVIS_SERVER"] = "http://localhost:8000"
        subprocess.Popen([electron_exe, main_js], env=env)
        print("[JARVIS] Electron launched.")
    else:
        print("[JARVIS] Electron not found. Open http://localhost:8000 in your browser.")


if __name__ == "__main__":
    print("\n" + "═" * 52)
    print("  ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗")
    print("  ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝")
    print("  ██║███████║██████╔╝██║   ██║██║███████╗")
    print("  ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║")
    print("  ██║██║  ██║██║  ██║ ╚████╔╝ ██║███████║")
    print("  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝")
    print("═" * 52)
    print("  AI Backend  →  http://localhost:8000/health")
    print("  React UI    →  http://localhost:8000")
    print("═" * 52 + "\n")

    threading.Thread(target=_launch_electron, daemon=True).start()
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")

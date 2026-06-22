import os

JARVIS_NAME = "Jarvis"
WAKE_WORD = "jarvis"

# Speech recognition settings
MIC_TIMEOUT = 5
MIC_PHRASE_LIMIT = 10
RECOGNITION_LANGUAGE = "en-US"

# TTS settings
TTS_RATE = 170
TTS_VOLUME = 1.0
TTS_VOICE_INDEX = 0  # 0 = first available voice (usually male on Windows)

# Windows application paths
APP_PATHS = {
    "notepad": "notepad.exe",
    "calculator": "calc.exe",
    "paint": "mspaint.exe",
    "word": r"C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE",
    "excel": r"C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE",
    "chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "edge": r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "explorer": "explorer.exe",
    "cmd": "cmd.exe",
    "task manager": "taskmgr.exe",
    "control panel": "control.exe",
}

# Default folder for file/folder creation
DEFAULT_WORKSPACE = os.path.join(os.path.expanduser("~"), "Desktop")

# Google search URL
GOOGLE_SEARCH_URL = "https://www.google.com/search?q="

# Gemini API settings
GEMINI_MODEL = "models/gemini-2.5-flash-lite"

# LLM backend: "ollama" = local & free (no quota), "gemini" = cloud.
# Ollama is the default; it falls back to Gemini if the local server is down.
LLM_BACKEND = os.environ.get("LLM_BACKEND", "ollama").lower()
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2:3b")
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
# Cap tokens so spoken replies stay short and fast on CPU.
OLLAMA_NUM_PREDICT = int(os.environ.get("OLLAMA_NUM_PREDICT", "80"))

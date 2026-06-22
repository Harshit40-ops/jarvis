import pyttsx3
from config.settings import TTS_RATE, TTS_VOLUME, TTS_VOICE_INDEX


class VoiceOutput:
    def speak(self, text: str):
        print(f"[JARVIS]: {text}")
        engine = pyttsx3.init()
        engine.setProperty("rate", TTS_RATE)
        engine.setProperty("volume", TTS_VOLUME)
        voices = engine.getProperty("voices")
        if voices and TTS_VOICE_INDEX < len(voices):
            engine.setProperty("voice", voices[TTS_VOICE_INDEX].id)
        engine.say(text)
        engine.runAndWait()
        engine.stop()

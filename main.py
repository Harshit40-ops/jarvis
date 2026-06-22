import sys
import os
import threading
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

# Ensure project root is on the path so all imports resolve correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.voice_input import VoiceInput
from core.voice_output import VoiceOutput
from core.command_processor import CommandProcessor
from config.settings import JARVIS_NAME, WAKE_WORD


def main():
    speaker = VoiceOutput()
    listener = VoiceInput()
    processor = CommandProcessor(speaker)

    speaker.speak(f"Hello! I am {JARVIS_NAME}. How can I help you?")

    running = True
    while running:
        command = listener.listen()

        if command is None:
            continue

        # Optional wake-word gate — strip it if present, then process
        if WAKE_WORD in command:
            command = command.replace(WAKE_WORD, "").strip()

        if not command:
            continue

        running = processor.process(command)


if __name__ == "__main__":
    main()

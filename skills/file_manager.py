import os
from config.settings import DEFAULT_WORKSPACE
from utils.helpers import sanitize_name


class FileManager:
    def __init__(self, speaker):
        self.speaker = speaker

    def create_file(self, filename: str):
        if not filename:
            self.speaker.speak("Please tell me the file name.")
            return

        filename = sanitize_name(filename)
        if "." not in filename:
            filename += ".txt"

        path = os.path.join(DEFAULT_WORKSPACE, filename)
        try:
            with open(path, "w") as f:
                f.write("")
            self.speaker.speak(f"File {filename} created on your Desktop.")
            print(f"[FILE]: Created → {path}")
        except Exception as e:
            self.speaker.speak(f"Could not create file {filename}.")
            print(f"[ERROR]: {e}")

    def create_folder(self, folder_name: str):
        if not folder_name:
            self.speaker.speak("Please tell me the folder name.")
            return

        folder_name = sanitize_name(folder_name)
        path = os.path.join(DEFAULT_WORKSPACE, folder_name)
        try:
            os.makedirs(path, exist_ok=True)
            self.speaker.speak(f"Folder {folder_name} created on your Desktop.")
            print(f"[FOLDER]: Created → {path}")
        except Exception as e:
            self.speaker.speak(f"Could not create folder {folder_name}.")
            print(f"[ERROR]: {e}")

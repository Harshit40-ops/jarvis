from skills.app_launcher import AppLauncher
from skills.web_search import WebSearch
from skills.file_manager import FileManager
from skills.commands import DesktopCommands
from skills.memory import Memory
from skills.assistant import ClaudeAssistant
from skills.vision import Vision
from skills.android import AndroidBridge


class CommandProcessor:
    def __init__(self, speaker):
        self.speaker = speaker
        self.memory = Memory()
        self.app_launcher = AppLauncher(speaker)
        self.web_search = WebSearch(speaker)
        self.file_manager = FileManager(speaker)
        self.desktop = DesktopCommands(speaker)
        self.assistant = ClaudeAssistant(self.memory)
        self.vision = Vision()
        self.android = AndroidBridge(speaker)

        self._routes = [
            (["open on phone ", "open on my phone ", "phone open "], self._handle_phone_open),
            (["send message to ", "send sms to ", "text "], self._handle_send_sms),
            (["read notifications", "check notifications", "any notifications"], self._handle_read_notifications),
            (["read messages", "read sms", "check messages"], self._handle_read_sms),
            (["is my phone connected", "phone status", "check phone"], self._handle_phone_status),
            (["what do you see", "look around", "describe what you see"], self._handle_describe_scene),
            (["detect objects", "what objects"], self._handle_detect_objects),
            (["how many faces", "detect faces", "count faces"], self._handle_detect_faces),
            (["show camera", "open camera", "start camera"], self._handle_start_camera),
            (["close camera", "stop camera", "hide camera"], self._handle_stop_camera),
            (["my name is "], self._handle_set_name),
            (["remember "], self._handle_remember),
            (["what is my name", "what's my name", "who am i"], self._handle_get_name),
            (["forget everything", "clear memory", "reset memory"], self._handle_clear_memory),
            (["open ", "launch ", "start "], self._handle_open),
            (["search for ", "search ", "google "], self._handle_search),
            (["create file ", "make file ", "new file "], self._handle_create_file),
            (["create folder ", "make folder ", "new folder "], self._handle_create_folder),
            (["shutdown computer", "shut down computer", "turn off computer"], self._handle_shutdown),
            (["restart computer", "reboot computer", "reboot"], self._handle_restart),
            (["exit", "quit", "goodbye", "bye"], self._handle_exit),
        ]

    def process(self, command: str) -> bool:
        command = command.strip().lower()

        for triggers, handler in self._routes:
            for trigger in triggers:
                if command.startswith(trigger):
                    argument = command[len(trigger):].strip()
                    return handler(argument)

        response = self.assistant.ask(command)
        self.speaker.speak(response)
        return True

    # --- memory handlers ---

    def _handle_set_name(self, argument: str) -> bool:
        name = argument.strip().title()
        self.memory.set_user_name(name)
        self.speaker.speak(f"Got it! I'll remember your name is {name}.")
        return True

    def _handle_get_name(self, _argument: str) -> bool:
        name = self.memory.get_user_name()
        if name:
            self.speaker.speak(f"Your name is {name}.")
        else:
            self.speaker.speak("I don't know your name yet. You can tell me by saying 'my name is'.")
        return True

    def _handle_remember(self, argument: str) -> bool:
        if " is " in argument:
            key, _, value = argument.partition(" is ")
            self.memory.set_preference(key.strip(), value.strip())
            self.speaker.speak(f"Got it! I'll remember that {key.strip()} is {value.strip()}.")
        else:
            self.memory.set_preference(argument, "true")
            self.speaker.speak(f"Got it! I'll remember that.")
        return True

    def _handle_clear_memory(self, _argument: str) -> bool:
        self.memory.clear_conversations()
        self.speaker.speak("Done. I've cleared our conversation history.")
        return True

    # --- vision handlers ---

    def _handle_describe_scene(self, _argument: str) -> bool:
        self.speaker.speak("Let me take a look.")
        description = self.vision.describe_scene()
        self.speaker.speak(description)
        return True

    def _handle_detect_objects(self, _argument: str) -> bool:
        self.speaker.speak("Scanning for objects.")
        result = self.vision.detect_objects()
        self.speaker.speak(result)
        return True

    def _handle_detect_faces(self, _argument: str) -> bool:
        faces = self.vision.detect_faces()
        count = len(faces)
        if count == 0:
            self.speaker.speak("I don't see any faces.")
        elif count == 1:
            self.speaker.speak("I can see one face.")
        else:
            self.speaker.speak(f"I can see {count} faces.")
        return True

    def _handle_start_camera(self, _argument: str) -> bool:
        self.vision.start_live_feed()
        self.speaker.speak("Camera is on. Press Q in the window to close it.")
        return True

    def _handle_stop_camera(self, _argument: str) -> bool:
        self.vision.stop_live_feed()
        self.speaker.speak("Camera closed.")
        return True

    # --- phone handlers ---

    def _handle_phone_open(self, argument: str) -> bool:
        self.android.launch_app(argument)
        return True

    def _handle_send_sms(self, argument: str) -> bool:
        # "send message to Rahul saying hello"
        if " saying " in argument:
            recipient, _, message = argument.partition(" saying ")
        elif " message " in argument:
            recipient, _, message = argument.partition(" message ")
        else:
            self.speaker.speak("Please say who to send to and what message. For example: send message to Rahul saying hello.")
            return True
        self.android.send_sms(recipient.strip(), message.strip())
        return True

    def _handle_read_notifications(self, _argument: str) -> bool:
        notifs = self.android.read_notifications()
        if not notifs:
            self.speaker.speak("No notifications found, or your phone is not connected.")
            return True
        self.speaker.speak(f"You have {len(notifs)} notification{'s' if len(notifs) > 1 else ''}.")
        for n in notifs[-3:]:
            self.speaker.speak(f"{n.get('app', 'App')}: {n.get('title', '')} — {n.get('text', '')}")
        return True

    def _handle_read_sms(self, _argument: str) -> bool:
        messages = self.android.read_sms()
        if not messages:
            self.speaker.speak("No messages found, or your phone is not connected.")
            return True
        self.speaker.speak(f"You have {len(messages)} recent message{'s' if len(messages) > 1 else ''}.")
        for m in messages[-3:]:
            self.speaker.speak(f"From {m.get('sender', 'unknown')}: {m.get('body', '')}")
        return True

    def _handle_phone_status(self, _argument: str) -> bool:
        if self.android.is_online():
            self.speaker.speak("Your phone is connected to JARVIS.")
        else:
            self.speaker.speak("Your phone is not connected. Open the JARVIS companion app on your phone.")
        return True

    # --- app handlers ---

    def _handle_open(self, argument: str) -> bool:
        # "open X on my phone" / "open X on phone" → phone handler
        for suffix in (" on my phone", " on phone", " on the phone"):
            if argument.endswith(suffix):
                app = argument[: -len(suffix)].strip()
                return self._handle_phone_open(app)

        if self.desktop.can_handle(argument):
            self.desktop.open(argument)
        else:
            self.app_launcher.open_app(argument)
        return True

    def _handle_search(self, argument: str) -> bool:
        self.web_search.search(argument)
        return True

    def _handle_create_file(self, argument: str) -> bool:
        self.file_manager.create_file(argument)
        return True

    def _handle_create_folder(self, argument: str) -> bool:
        self.file_manager.create_folder(argument)
        return True

    def _handle_shutdown(self, _argument: str) -> bool:
        self.desktop.shutdown()
        return False

    def _handle_restart(self, _argument: str) -> bool:
        self.desktop.restart()
        return False

    def _handle_exit(self, _argument: str) -> bool:
        self.speaker.speak("Goodbye! Shutting down Jarvis.")
        return False

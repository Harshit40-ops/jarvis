import webbrowser
import urllib.parse
from config.settings import GOOGLE_SEARCH_URL


class WebSearch:
    def __init__(self, speaker):
        self.speaker = speaker

    def search(self, query: str):
        if not query:
            self.speaker.speak("What would you like me to search for?")
            return

        self.speaker.speak(f"Searching Google for {query}.")
        encoded_query = urllib.parse.quote_plus(query)
        url = GOOGLE_SEARCH_URL + encoded_query
        webbrowser.open(url)

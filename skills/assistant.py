import os
import re
import time
from config.settings import (
    GEMINI_MODEL,
    JARVIS_NAME,
    LLM_BACKEND,
    OLLAMA_HOST,
    OLLAMA_MODEL,
    OLLAMA_NUM_PREDICT,
)
from skills.memory import Memory


class ClaudeAssistant:
    _BASE_PROMPT = (
        f"You are {JARVIS_NAME}, a voice assistant. Reply in 1-2 short sentences max. "
        "No markdown, no lists. Spoken aloud, so be natural and brief."
    )

    def __init__(self, memory: Memory):
        self._memory = memory
        self._backend = LLM_BACKEND
        self._ollama = None
        self._gemini = None

        if self._backend == "ollama":
            self._ollama = self._init_ollama()
            if self._ollama is None:
                print("[LLM] Ollama unavailable — falling back to Gemini.")
                self._backend = "gemini"

        if self._backend == "gemini":
            self._gemini = self._init_gemini()
            if self._gemini is None:
                raise EnvironmentError(
                    "No LLM available: Ollama is not running and GEMINI_API_KEY is not set."
                )

    # ── backend setup ───────────────────────────────────────────────────────────

    def _init_ollama(self):
        try:
            import ollama
            client = ollama.Client(host=OLLAMA_HOST)
            # Verify the server is reachable and the model is present.
            models = [m.get("model", "") for m in client.list().get("models", [])]
            if not any(OLLAMA_MODEL in m for m in models):
                print(f"[LLM] model '{OLLAMA_MODEL}' not found. Run: ollama pull {OLLAMA_MODEL}")
                return None
            print(f"[LLM] using local Ollama — {OLLAMA_MODEL} @ {OLLAMA_HOST}")
            return client
        except Exception as e:
            print(f"[LLM] Ollama init failed: {str(e)[:120]}")
            return None

    def _init_gemini(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return None
        try:
            from google import genai
            print(f"[LLM] using cloud Gemini — {GEMINI_MODEL}")
            return genai.Client(api_key=api_key)
        except Exception as e:
            print(f"[LLM] Gemini init failed: {str(e)[:120]}")
            return None

    # ── public API ──────────────────────────────────────────────────────────────

    def ask(self, text: str) -> str:
        system_prompt = self._build_system_prompt()

        if self._ollama is not None:
            answer = self._ask_ollama(system_prompt, text)
            if answer is not None:
                self._memory.add_conversation(text, answer)
                return answer
            # Local model errored — try cloud if available before giving up.
            if self._gemini is None:
                self._gemini = self._init_gemini()
            if self._gemini is None:
                return "My local assistant isn't responding right now."

        return self._ask_gemini(system_prompt, text)

    # ── Ollama ────────────────────────────────────────────────────────────────────

    def _ask_ollama(self, system_prompt: str, text: str) -> str | None:
        messages = [{"role": "system", "content": system_prompt}]
        for turn in self._memory.get_recent_conversations(limit=4):
            messages.append({"role": "user", "content": turn["user"]})
            messages.append({"role": "assistant", "content": turn["assistant"]})
        messages.append({"role": "user", "content": text})

        try:
            response = self._ollama.chat(
                model=OLLAMA_MODEL,
                messages=messages,
                options={"num_predict": OLLAMA_NUM_PREDICT, "temperature": 0.6},
            )
            return response["message"]["content"].strip()
        except Exception as e:
            print(f"[LLM] Ollama error: {str(e)[:120]}")
            return None

    # ── Gemini (cloud fallback) ───────────────────────────────────────────────────

    def _ask_gemini(self, system_prompt: str, text: str) -> str:
        from google.genai import types

        contents = []
        for turn in self._memory.get_recent_conversations(limit=4):
            contents.append(types.Content(role="user", parts=[types.Part(text=turn["user"])]))
            contents.append(types.Content(role="model", parts=[types.Part(text=turn["assistant"])]))
        contents.append(types.Content(role="user", parts=[types.Part(text=text)]))

        # One quick retry only for transient (non-rate-limit) errors.
        for attempt in range(2):
            try:
                response = self._gemini.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=contents,
                    config={"system_instruction": system_prompt},
                )
                answer = response.text
                self._memory.add_conversation(text, answer)
                return answer

            except Exception as e:
                msg = str(e)
                print(f"[Gemini] attempt {attempt + 1} error: {msg[:120]}")

                is_rate_limit = (
                    "quota" in msg.lower()
                    or "429" in msg
                    or "ResourceExhausted" in msg
                    or "RESOURCE_EXHAUSTED" in msg
                )

                # Rate limit: fail fast — short retries never beat the server's
                # reset window, they only add dead time before the error.
                if is_rate_limit:
                    return self._rate_limit_message(msg)

                if "API_KEY_INVALID" in msg or "API key not valid" in msg:
                    return "My API key is invalid. Please check your Gemini API key in the .env file."
                if "ConnectionError" in msg or "network" in msg.lower() or "timeout" in msg.lower():
                    if attempt == 0:
                        continue  # one quick retry for a flaky connection
                    return "I'm having trouble connecting to the internet right now."
                return "I ran into an error. Please try again."

        return "I ran into an error. Please try again."

    @staticmethod
    def _rate_limit_message(msg: str) -> str:
        """Surface the server's suggested wait time instead of a vague apology."""
        match = re.search(r"retry in ([\d.]+)s", msg, re.IGNORECASE)
        if match:
            secs = int(float(match.group(1))) + 1
            return f"I've hit my Gemini free-tier limit. Please try again in about {secs} seconds."
        return "I've hit my Gemini usage quota. Please wait a moment, or upgrade the API plan."

    # ── helpers ───────────────────────────────────────────────────────────────

    def _build_system_prompt(self) -> str:
        prompt = self._BASE_PROMPT
        user_name = self._memory.get_user_name()
        if user_name:
            prompt += f" The user's name is {user_name}."
        prefs = self._memory.get_all_preferences()
        if prefs:
            pref_str = ", ".join(f"{k}: {v}" for k, v in prefs.items())
            prompt += f" User preferences — {pref_str}."
        return prompt

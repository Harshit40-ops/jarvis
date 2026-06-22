import sqlite3
import os
from datetime import datetime

_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "jarvis.db")


class Memory:
    def __init__(self):
        os.makedirs(os.path.dirname(_DB_PATH), exist_ok=True)
        self._conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
        self._init_db()

    def _init_db(self):
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS user_profile (
                key   TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS conversations (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                user_text      TEXT NOT NULL,
                assistant_text TEXT NOT NULL,
                timestamp      TEXT NOT NULL
            );
        """)
        self._conn.commit()

    # ── user name ──────────────────────────────────────────────────────────

    def get_user_name(self) -> str | None:
        return self._get("name")

    def set_user_name(self, name: str):
        self._set("name", name)

    # ── preferences ────────────────────────────────────────────────────────

    def get_preference(self, key: str) -> str | None:
        return self._get(f"pref:{key}")

    def set_preference(self, key: str, value: str):
        self._set(f"pref:{key}", value)

    def get_all_preferences(self) -> dict[str, str]:
        cursor = self._conn.execute(
            "SELECT key, value FROM user_profile WHERE key LIKE 'pref:%'"
        )
        return {row[0][5:]: row[1] for row in cursor.fetchall()}

    # ── conversations ──────────────────────────────────────────────────────

    def add_conversation(self, user_text: str, assistant_text: str):
        self._conn.execute(
            "INSERT INTO conversations (user_text, assistant_text, timestamp) VALUES (?, ?, ?)",
            (user_text, assistant_text, datetime.now().isoformat()),
        )
        self._conn.commit()

    def get_recent_conversations(self, limit: int = 10) -> list[dict]:
        cursor = self._conn.execute(
            "SELECT user_text, assistant_text FROM conversations ORDER BY id DESC LIMIT ?",
            (limit,),
        )
        rows = cursor.fetchall()
        rows.reverse()
        return [{"user": r[0], "assistant": r[1]} for r in rows]

    def clear_conversations(self):
        self._conn.execute("DELETE FROM conversations")
        self._conn.commit()

    # ── internals ─────────────────────────────────────────────────────────

    def _get(self, key: str) -> str | None:
        row = self._conn.execute(
            "SELECT value FROM user_profile WHERE key = ?", (key,)
        ).fetchone()
        return row[0] if row else None

    def _set(self, key: str, value: str):
        self._conn.execute(
            "INSERT OR REPLACE INTO user_profile (key, value) VALUES (?, ?)",
            (key, value),
        )
        self._conn.commit()

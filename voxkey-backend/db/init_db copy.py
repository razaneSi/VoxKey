"""Initialisation de la base SQLite VoxKey."""

from pathlib import Path
import sys

from sqlalchemy import text, create_engine

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from config import Config


CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT,
    password_hash TEXT,
    voice_embeddings TEXT, -- Store as JSON string (Resemblyzer + SpeechBrain)
    voice_fft TEXT,        -- Store as JSON string
    keyboard_baseline TEXT, -- Store as JSON string (timing stats)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_VOICE_LOGS_TABLE = """
CREATE TABLE IF NOT EXISTS voice_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    resemblyzer_score FLOAT,
    speechbrain_score FLOAT,
    ffmpeg_score FLOAT,
    final_score FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
"""

CREATE_KEYBOARD_LOGS_TABLE = """
CREATE TABLE IF NOT EXISTS keyboard_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    avg_delay FLOAT,
    score FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
"""

CREATE_AUTH_ATTEMPTS_TABLE = """
CREATE TABLE IF NOT EXISTS auth_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    voice_score FLOAT,
    keyboard_score FLOAT,
    final_score FLOAT,
    status TEXT, -- 'success', 'failed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
"""


def create_tables() -> None:
    """Cree les tables principales de VoxKey."""
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)

    with engine.begin() as connection:
        connection.execute(text(CREATE_USERS_TABLE))
        connection.execute(text(CREATE_VOICE_LOGS_TABLE))
        connection.execute(text(CREATE_KEYBOARD_LOGS_TABLE))
        connection.execute(text(CREATE_AUTH_ATTEMPTS_TABLE))


if __name__ == "__main__":
    create_tables()
    print(f"SQLite database '{Config.DB_PATH}' and required tables are ready.")

"""Initialisation de la base PostgreSQL VoxKey."""

from pathlib import Path
import sys

import psycopg2
from psycopg2 import sql
from sqlalchemy import text

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from config import Config
from db.database import build_database_url
from sqlalchemy import create_engine


CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(100),
    password_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_VOICE_LOGS_TABLE = """
CREATE TABLE IF NOT EXISTS voice_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    mfcc JSON,
    energy FLOAT,
    pitch FLOAT,
    score FLOAT,
    created_at TIMESTAMP
);
"""

CREATE_KEYBOARD_LOGS_TABLE = """
CREATE TABLE IF NOT EXISTS keyboard_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    avg_delay FLOAT,
    avg_duration FLOAT,
    rhythm JSON,
    score FLOAT,
    created_at TIMESTAMP
);
"""


def create_database() -> None:
    """Cree la base voxkey si elle n'existe pas."""
    connection = psycopg2.connect(
        dbname=Config.POSTGRES_ADMIN_DB,
        user=Config.POSTGRES_USER,
        password=Config.POSTGRES_PASSWORD,
        host=Config.POSTGRES_HOST,
        port=Config.POSTGRES_PORT,
    )
    connection.autocommit = True

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (Config.POSTGRES_DB,))
            exists = cursor.fetchone()

            if not exists:
                cursor.execute(
                    sql.SQL("CREATE DATABASE {}").format(sql.Identifier(Config.POSTGRES_DB))
                )
    finally:
        connection.close()


def create_tables() -> None:
    """Cree les tables principales de VoxKey."""
    engine = create_engine(build_database_url(Config.POSTGRES_DB), future=True)

    with engine.begin() as connection:
        connection.execute(text(CREATE_USERS_TABLE))
        connection.execute(text(CREATE_VOICE_LOGS_TABLE))
        connection.execute(text(CREATE_KEYBOARD_LOGS_TABLE))


if __name__ == "__main__":
    create_database()
    create_tables()
    print("Database 'voxkey' and required tables are ready.")

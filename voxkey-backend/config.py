"""Configuration centrale du backend VoxKey."""

import os

from dotenv import load_dotenv


load_dotenv()


class Config:
    """Parametres applicatifs pour Flask et SQLite."""

    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "voxkey-dev-secret")

    # SQLite Configuration
    DB_PATH = os.path.join(os.path.dirname(__file__), "voxkey.db")
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DB_PATH}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

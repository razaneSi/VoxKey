"""Configuration centrale du backend VoxKey."""

import os

from dotenv import load_dotenv


load_dotenv()


class Config:
    """Parametres applicatifs pour Flask et PostgreSQL."""

    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "voxkey-dev-secret")

    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "voxkey")
    POSTGRES_ADMIN_DB = os.getenv("POSTGRES_ADMIN_DB", "postgres")

    SQLALCHEMY_DATABASE_URI = (
        f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
        f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )

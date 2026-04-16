"""Connexion et helpers de base de donnees PostgreSQL."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import Config


Base = declarative_base()


def build_database_url(database_name: str) -> str:
    """Construit l'URL SQLAlchemy pour la base cible."""
    return (
        f"postgresql+psycopg2://{Config.POSTGRES_USER}:{Config.POSTGRES_PASSWORD}"
        f"@{Config.POSTGRES_HOST}:{Config.POSTGRES_PORT}/{database_name}"
    )


engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

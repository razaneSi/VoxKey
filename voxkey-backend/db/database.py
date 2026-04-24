"""Connexion et helpers de base de donnees SQLite."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import Config


Base = declarative_base()


engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, connect_args={"check_same_thread": False}, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

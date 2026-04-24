"""Modele SQLAlchemy de la table users."""

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class User(Base):
    """Representation ORM des utilisateurs."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str | None] = mapped_column(String(100), unique=True)
    email: Mapped[str | None] = mapped_column(String(100))
    password_hash: Mapped[str | None] = mapped_column(Text)
    
    # Biometric profiles (stored as JSON strings)
    voice_embeddings: Mapped[str | None] = mapped_column(Text) # Resemblyzer + SpeechBrain
    voice_fft: Mapped[str | None] = mapped_column(Text)
    keyboard_baseline: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.current_timestamp())

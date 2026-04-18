"""Modele SQLAlchemy de la table users."""

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class User(Base):
    """Representation ORM des utilisateurs."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str | None] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(100))
    password_hash: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.current_timestamp())

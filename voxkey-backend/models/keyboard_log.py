"""Modele SQLAlchemy de la table keyboard_logs."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class KeyboardLog(Base):
    """Representation ORM des patterns de frappe."""

    __tablename__ = "keyboard_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    avg_delay: Mapped[float | None] = mapped_column(Float)
    avg_duration: Mapped[float | None] = mapped_column(Float)
    rhythm: Mapped[list | dict | None] = mapped_column(JSON)
    score: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime | None] = mapped_column(DateTime)

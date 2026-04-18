"""Modele SQLAlchemy de la table voice_logs."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class VoiceLog(Base):
    """Representation ORM des empreintes vocales."""

    __tablename__ = "voice_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    mfcc: Mapped[list | dict | None] = mapped_column(JSON)
    energy: Mapped[float | None] = mapped_column(Float)
    pitch: Mapped[float | None] = mapped_column(Float)
    score: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime | None] = mapped_column(DateTime)

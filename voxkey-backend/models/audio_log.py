"""Modele SQLAlchemy de la table voice_logs."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class VoiceLog(Base):
    """Representation ORM des empreintes vocales."""

    __tablename__ = "voice_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    resemblyzer_score: Mapped[float | None] = mapped_column(Float)
    speechbrain_score: Mapped[float | None] = mapped_column(Float)
    fft_score: Mapped[float | None] = mapped_column(Float)
    final_score: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, default=datetime.utcnow)

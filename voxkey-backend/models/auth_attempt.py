from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from db.database import Base

class AuthAttempt(Base):
    """Representation ORM des tentatives d'authentification."""

    __tablename__ = "auth_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    voice_score: Mapped[float | None] = mapped_column(Float)
    keyboard_score: Mapped[float | None] = mapped_column(Float)
    final_score: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str | None] = mapped_column(String(50)) # 'success', 'failed'
    created_at: Mapped[datetime | None] = mapped_column(DateTime, default=datetime.utcnow)

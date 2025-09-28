from sqlalchemy import String, Integer, Float, DateTime, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from typing import Optional
from datetime import datetime

class Base(DeclarativeBase):
    pass

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_address: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    accuracy_score: Mapped[float] = mapped_column(Float, nullable=False)
    total_predictions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_error: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_address: Mapped[str] = mapped_column(String(42), nullable=False, unique=True, index=True)
    nickname: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    __table_args__ = (
        UniqueConstraint('user_address', name='uq_users_user_address'),
    )


class Bet(Base):
    __tablename__ = "bets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    market_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    side: Mapped[str] = mapped_column(String(3), nullable=False)  # 'YES' or 'NO'
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    user_address: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(12), default="pending")  # pending|won|lost|refunded
    payout_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)


class Market(Base):
    __tablename__ = "markets"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    deadline: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(12), default="open")  # open|closed|resolved
    outcome: Mapped[Optional[str]] = mapped_column(String(3), nullable=True)  # 'YES'|'NO' or null
    base_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

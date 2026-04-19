from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    login: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(512))
    telegram_user_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True)
    telegram_username: Mapped[str | None] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )


class Ticket(Base):
    __tablename__ = "tickets"
    __table_args__ = (
        UniqueConstraint("source_system", "source_ticket_id", name="uq_tickets_source_ticket"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_system: Mapped[str] = mapped_column(String(32), default="backend", nullable=False)
    source_ticket_id: Mapped[str | None] = mapped_column(String(128), index=True)
    employee_login: Mapped[str] = mapped_column(String(128), index=True)
    requester_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), index=True)
    channel: Mapped[str] = mapped_column(String(32), default="web", nullable=False, index=True)
    scope: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(8), nullable=False)
    category: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    csat: Mapped[float | None] = mapped_column(Float)
    assistant_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rating_request_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    taken_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    messages: Mapped[list["Message"]] = relationship(
        back_populates="ticket",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by=lambda: (Message.created_at.asc(), Message.id.asc()),
    )


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        UniqueConstraint("source_system", "source_message_id", name="uq_messages_source_message"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    ticket_id: Mapped[str] = mapped_column(ForeignKey("tickets.id"), index=True)
    source_system: Mapped[str] = mapped_column(String(32), default="backend", nullable=False)
    source_message_id: Mapped[str | None] = mapped_column(String(128), index=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    author_login: Mapped[str | None] = mapped_column(String(128))
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    processed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    ticket: Mapped[Ticket] = relationship(back_populates="messages")


class Metric(Base):
    __tablename__ = "metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64), index=True)
    source: Mapped[str] = mapped_column(String(64), default="backend", nullable=False)
    is_healthy: Mapped[bool] = mapped_column(Boolean, nullable=False)
    details: Mapped[str | None] = mapped_column(Text)
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        UniqueConstraint(
            "source_system",
            "source_document_id",
            name="uq_documents_source_document",
        ),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_system: Mapped[str] = mapped_column(String(32), default="backend", nullable=False)
    source_document_id: Mapped[str | None] = mapped_column(String(128), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    source: Mapped[str] = mapped_column(String(128), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rating: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AssistantSettings(Base):
    __tablename__ = "assistant_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tone_of_voice: Mapped[str] = mapped_column(String(128), nullable=False)
    confidence_threshold: Mapped[float] = mapped_column(Float, nullable=False)
    top_k: Mapped[int] = mapped_column(Integer, nullable=False)
    use_articles: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

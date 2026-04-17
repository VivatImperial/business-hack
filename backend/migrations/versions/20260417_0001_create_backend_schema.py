"""Create backend production schema.

Revision ID: 20260417_0001
Revises:
Create Date: 2026-04-17 19:30:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260417_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("login", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=512), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("login"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)
    op.create_index("ix_users_login", "users", ["login"], unique=False)

    op.create_table(
        "assistant_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tone_of_voice", sa.String(length=128), nullable=False),
        sa.Column("confidence_threshold", sa.Float(), nullable=False),
        sa.Column("top_k", sa.Integer(), nullable=False),
        sa.Column("use_articles", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "documents",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("source_system", sa.String(length=32), nullable=False),
        sa.Column("source_document_id", sa.String(length=128), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("source", sa.String(length=128), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "source_system",
            "source_document_id",
            name="uq_documents_source_document",
        ),
    )
    op.create_index("ix_documents_source_document_id", "documents", ["source_document_id"], unique=False)

    op.create_table(
        "metrics",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("is_healthy", sa.Boolean(), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_metrics_name", "metrics", ["name"], unique=False)

    op.create_table(
        "tickets",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("source_system", sa.String(length=32), nullable=False),
        sa.Column("source_ticket_id", sa.String(length=128), nullable=True),
        sa.Column("employee_login", sa.String(length=128), nullable=False),
        sa.Column("scope", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("priority", sa.String(length=8), nullable=False),
        sa.Column("category", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("csat", sa.Float(), nullable=True),
        sa.Column("assistant_resolved", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("rating_request_sent", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("taken_by_user_id", sa.String(length=64), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["taken_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_system", "source_ticket_id", name="uq_tickets_source_ticket"),
    )
    op.create_index("ix_tickets_employee_login", "tickets", ["employee_login"], unique=False)
    op.create_index("ix_tickets_source_ticket_id", "tickets", ["source_ticket_id"], unique=False)
    op.create_index("ix_tickets_status", "tickets", ["status"], unique=False)

    op.create_table(
        "messages",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("ticket_id", sa.String(length=64), nullable=False),
        sa.Column("source_system", sa.String(length=32), nullable=False),
        sa.Column("source_message_id", sa.String(length=128), nullable=True),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("author_login", sa.String(length=128), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_system", "source_message_id", name="uq_messages_source_message"),
    )
    op.create_index("ix_messages_source_message_id", "messages", ["source_message_id"], unique=False)
    op.create_index("ix_messages_ticket_id", "messages", ["ticket_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_messages_ticket_id", table_name="messages")
    op.drop_index("ix_messages_source_message_id", table_name="messages")
    op.drop_table("messages")

    op.drop_index("ix_tickets_status", table_name="tickets")
    op.drop_index("ix_tickets_source_ticket_id", table_name="tickets")
    op.drop_index("ix_tickets_employee_login", table_name="tickets")
    op.drop_table("tickets")

    op.drop_index("ix_metrics_name", table_name="metrics")
    op.drop_table("metrics")

    op.drop_index("ix_documents_source_document_id", table_name="documents")
    op.drop_table("documents")

    op.drop_table("assistant_settings")

    op.drop_index("ix_users_login", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

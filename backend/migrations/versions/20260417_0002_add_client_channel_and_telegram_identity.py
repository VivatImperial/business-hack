"""Add customer channel and Telegram identity fields.

Revision ID: 20260417_0002
Revises: 20260417_0001
Create Date: 2026-04-17 23:10:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260417_0002"
down_revision = "20260417_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("telegram_user_id", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("telegram_username", sa.String(length=255), nullable=True))
        batch_op.create_index("ix_users_telegram_user_id", ["telegram_user_id"], unique=True)

    with op.batch_alter_table("tickets") as batch_op:
        batch_op.add_column(sa.Column("requester_user_id", sa.String(length=64), nullable=True))
        batch_op.add_column(
            sa.Column(
                "channel",
                sa.String(length=32),
                nullable=False,
                server_default=sa.text("'web'"),
            )
        )
        batch_op.create_index("ix_tickets_requester_user_id", ["requester_user_id"], unique=False)
        batch_op.create_index("ix_tickets_channel", ["channel"], unique=False)
        batch_op.create_foreign_key(
            "fk_tickets_requester_user_id_users",
            "users",
            ["requester_user_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("tickets") as batch_op:
        batch_op.drop_constraint("fk_tickets_requester_user_id_users", type_="foreignkey")
        batch_op.drop_index("ix_tickets_channel")
        batch_op.drop_index("ix_tickets_requester_user_id")
        batch_op.drop_column("channel")
        batch_op.drop_column("requester_user_id")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index("ix_users_telegram_user_id")
        batch_op.drop_column("telegram_username")
        batch_op.drop_column("telegram_user_id")

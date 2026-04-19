"""Add message assets and citations metadata.

Revision ID: 20260418_0003
Revises: 20260417_0002
Create Date: 2026-04-18 12:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260418_0003"
down_revision = "20260417_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("messages") as batch_op:
        batch_op.add_column(sa.Column("image_url", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("image_name", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("citations_json", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("messages") as batch_op:
        batch_op.drop_column("citations_json")
        batch_op.drop_column("image_name")
        batch_op.drop_column("image_url")

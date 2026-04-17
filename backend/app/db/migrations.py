from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.config import Config


def build_alembic_config(database_url: str) -> Config:
    config_path = Path(__file__).resolve().parents[2] / "alembic.ini"
    config = Config(str(config_path))
    config.set_main_option("sqlalchemy.url", database_url)
    return config


def apply_migrations(database_url: str) -> None:
    command.upgrade(build_alembic_config(database_url), "head")

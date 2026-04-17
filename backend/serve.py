from __future__ import annotations

import uvicorn

from backend.app.config import Settings
from backend.app.db.migrations import apply_migrations


def main() -> None:
    settings = Settings()
    apply_migrations(settings.database_url)
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )


if __name__ == "__main__":
    main()

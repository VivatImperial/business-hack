from __future__ import annotations

import uvicorn

from ai_agent.app import build_runtime_dialog_orchestrator, create_app
from ai_agent.config import get_settings


def main() -> None:
    """Run the ai-agent application with uvicorn."""

    settings = get_settings()
    app = create_app(
        settings=settings,
        dialog_orchestrator=build_runtime_dialog_orchestrator(settings),
    )
    uvicorn.run(
        app,
        host=settings.service_host,
        port=settings.service_port,
        reload=settings.service_reload,
    )


if __name__ == "__main__":
    main()

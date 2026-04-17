from __future__ import annotations

import asyncio

from telegram_bot.backend_client import BackendClient
from telegram_bot.bot import build_application
from telegram_bot.config import Settings


async def run() -> None:
    settings = Settings()
    backend = BackendClient(
        base_url=settings.backend_base_url,
        bot_token=settings.effective_backend_bot_token,
        timeout_seconds=settings.request_timeout_seconds,
    )
    application = build_application(backend=backend, token=settings.telegram_bot_token)
    try:
        await application.initialize()
        await application.start()
        await application.updater.start_polling(drop_pending_updates=True)
        await asyncio.Event().wait()
    finally:
        if application.updater is not None:
            await application.updater.stop()
        await application.stop()
        await application.shutdown()
        await backend.aclose()


def main() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    main()

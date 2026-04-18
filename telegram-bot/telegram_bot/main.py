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
    initialized = False
    started = False
    polling_started = False
    try:
        await application.initialize()
        initialized = True
        await application.start()
        started = True
        await application.updater.start_polling(drop_pending_updates=True)
        polling_started = True
        await asyncio.Event().wait()
    finally:
        if application.updater is not None and polling_started:
            await application.updater.stop()
        if started:
            await application.stop()
        if initialized:
            await application.shutdown()
        await backend.aclose()


def main() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    main()

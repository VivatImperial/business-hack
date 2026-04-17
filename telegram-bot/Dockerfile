FROM python:3.13-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY telegram-bot/pyproject.toml /app/pyproject.toml
RUN uv sync --no-dev

COPY telegram-bot /app

CMD ["uv", "run", "python", "-m", "telegram_bot.main"]

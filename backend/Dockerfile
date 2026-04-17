FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN python -m pip install --upgrade pip && \
    python -m pip install --no-cache-dir \
        alembic \
        asyncpg \
        email-validator \
        fastapi \
        greenlet \
        httpx \
        pydantic-settings \
        pymssql \
        PyJWT \
        sqlalchemy \
        "uvicorn[standard]"

COPY backend /app/backend

EXPOSE 8000

CMD ["python", "-m", "backend.serve"]

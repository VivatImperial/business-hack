FROM python:3.13-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY ai-agent /app

RUN uv sync

EXPOSE 8090

CMD ["uv", "run", "ai-agent"]
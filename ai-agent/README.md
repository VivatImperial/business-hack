# AI Agent Service

Отдельный сервис ассистента для кейса `Балтийский Берег`.

## Что умеет

- internal endpoint `POST /api/v1/internal/agent/respond`;
- ticket-first retrieval по коллекциям `ticket_cases` и `article_chunks` в Qdrant;
- локальные эмбеддинги на `Qwen/Qwen3-Embedding-0.6B`;
- русские prompt templates для `resolve_issue` и `create_ticket`;
- базовый admin API для локального демо и совместимости с текущими тестами.

## Локальный запуск

```bash
cd ai-agent
uv sync
uv run ai-agent
```

По умолчанию сервис поднимается на `0.0.0.0:8090`.

## Основные переменные окружения

```bash
AI_AGENT_ENABLE_ORCHESTRATOR=false
QDRANT_URL=http://localhost:6333

YANDEX_GPT_API_KEY=
YANDEX_GPT_FOLDER_ID=
YANDEX_GPT_MODEL=yandexgpt/latest
YANDEX_GPT_BASE_URL=https://llm.api.cloud.yandex.net/v1
```

Если `AI_AGENT_ENABLE_ORCHESTRATOR=false`, internal `respond` остается в bootstrap-режиме и возвращает `501`, пока orchestration не включена явно при runtime-запуске.

## Индексация

Из готовых chunk-файлов:

```bash
cd ai-agent
uv run ai-agent-index-exports
```

Полный путь через MSSQL source extraction:

```bash
cd ai-agent
uv run ai-agent-index-mssql
```

Принудительное пересоздание коллекций:

```bash
cd ai-agent
uv run ai-agent-rebuild-collections --vector-size 1024
```

## RAG Eval

Golden-set regression suite:

```bash
cd ai-agent
uv run python -m unittest tests.test_rag_eval -v
```

Полный сервисный quality контур:

```bash
cd ai-agent
uv run python -m unittest discover tests -v
```

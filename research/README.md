# Research Workspace

Материалы анализа и source-layer выгрузки для ML/RAG экспериментов.

## Структура

- `eda/` — текущая работа с данными: source extraction, парсинг, формализация тикетов и статей.
- `data_preparation/` — дизайн retrieval/chunking и подготовка будущего RAG-пайплайна.

## Что где лежит

- `eda/ticket_parsing.md` — KISS-спецификация парсинга тикетов.
- `eda/parsers/tickets.py` — логика сборки тикетного source-doc и конвертации его в Markdown.
- `eda/parsers/articles.py` — логика очистки HTML KB-статей и сборки article source-doc.
- `extract_datasets.py` — orchestration-скрипт для source extraction.
- `eda/outputs/` — итоговые source datasets.
- `data_preparation/ticket_first_rag_design.md` — ticket-first логика retrieval и chunking под Qdrant.
- `data_preparation/chunk_building.py` — библиотечная логика сборки qdrant-ready чанков.
- `data_preparation/build_chunks.py` — CLI-скрипт построения `ticket_cases` и `article_chunks`.
- `data_preparation/outputs/` — готовые chunk-артефакты для следующего шага интеграции.

## Как выгрузить source datasets

1. Собрать совместимое окружение:

```bash
uv sync
source .venv/bin/activate
python --version  # должен быть 3.13.x
```

2. Убедиться, что MSSQL контейнер запущен и база восстановлена:

```bash
docker compose up -d
```

3. Запустить выгрузку:

```bash
python research/extract_datasets.py
```

Если нужно обогатить KB-статьи OCR-распознаванием inline-изображений:

```bash
python research/extract_datasets.py --ocr-articles
```

Если нужен отдельный resumable OCR-runner поверх уже собранного `articles_source`:

```bash
python research/ocr_articles.py
```

Он пишет OCR-результат батчами и умеет продолжать прогон по `working`-файлу, не повторяя уже обработанные статьи.

Или без активации venv:

```bash
./.venv/bin/python research/extract_datasets.py
```

По умолчанию выходные файлы будут в `research/eda/outputs/` (gzipped JSONL).

## Важно

- Конвертация KB HTML в Markdown требует `html-to-markdown`.
- Фолбэка на другую библиотеку нет специально.
- Проект сейчас честно зафиксирован на `Python < 3.14`, потому что `html-to-markdown` на текущий момент не публикует wheel для `cp314`.

## Состав выгрузки

- `tickets_source.jsonl.gz`
- `articles_source.jsonl.gz`
- `lookups.json`
- `dataset_stats.json`

При OCR-режиме `articles_source` дополнительно получает:

- `markdown_with_ocr`
- `ocr_status`
- `ocr_blocks`
- `image_stats`

## Подготовка чанков

После сборки source datasets можно подготовить qdrant-ready чанки:

```bash
./.venv/bin/python research/data_preparation/build_chunks.py
```

Результат появится в `research/data_preparation/outputs/`:

- `ticket_cases.jsonl.gz`
- `article_chunks.jsonl.gz`
- `dataset_stats.json`


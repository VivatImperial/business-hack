# Ticket-First RAG Design v2 (KISS)

Цель: зафиксировать простую и реалистичную логику поиска для кейса из `README.md`.

Ключевая идея:

1. **Сначала ищем максимально похожий решенный тикет**
2. **Потом, если нужно, добираем контекст из статей**

Это соответствует данным:

- главная экспертиза лежит в тикетах;
- KB полезна как дополнительный слой инструкций и подтверждений;
- пользовательские запросы выглядят как короткие формулировки проблемы, а не как формальные названия сервисов.

## 1) Что именно ищем по тикетам

Для ticket retrieval имеет смысл искать **не по полному тикету как попало**, а по проблемной части:

- `request_text` — главный поисковый текст;
- `service`, `task_type` — мягкие сигналы для буста;
- `custom_fields` — дополнительные доменные сигналы;
- `resolution_text` — не primary retrieval, а материал для rerank и финального ответа.

### Почему так

Входные запросы из `README.md`:

- «Не подключается удаленка»
- «Неправильный отчет в 1С»

Они ближе к `Task.Name + Task.Description`, чем к `resolution_text`.

Поэтому:

- **recall** лучше получать по `request_text`;
- **precision** добирать через `resolution_text` и метаданные.

## 2) Какие тикеты вообще стоит индексировать

Primary retrieval не должен идти по всему массиву тикетов.

### В primary ticket index включаем только retrieval-worthy cases:

- тикеты с `resolution_source = worklog`, если в них есть признаки реального действия или нормального закрытия;
- тикеты с `resolution_source = comment`, только если комментарий похож на actionable resolution.

### Не включаем в primary:

- тикеты с `resolution_source = none`;
- тикеты с явными сигналами `отменена`, `не актуально`, `отказано`, `невозможно`, `доступ запрещен`;
- comment-only кейсы, где есть эмоциональный диалог, но нет полезного способа решения.

Причина простая:

- resolved != useful;
- для этого кейса важно не просто найти похожую историю, а найти историю, из которой можно безопасно сделать grounded answer;
- `README.md` прямо требует лучше не ответить, чем ошибиться.

Нерешенные и не-actionable тикеты можно хранить отдельно для последующего анализа, но не использовать как основной retrieval corpus.

## 3) Коллекции Qdrant

Для первого релиза достаточно **двух коллекций**:

1. `ticket_cases`
2. `article_chunks`

Без мультивекторов, без сложной маршрутизации, без десяти служебных коллекций.

## 4) `ticket_cases`: схема и логика

### Unit of retrieval

**Один point = один retrieval-worthy resolved ticket**

То есть по тикетам на первом этапе делаем **не мелкий чанкинг**, а **case-level indexing**.

Это KISS и хорошо соответствует задаче:

- пользователь ищет похожий кейс;
- тикет и есть атомарный кейс;
- нам важна целостность запроса и решения.

### Почему не дробить тикет сразу

Если дробить тикет на маленькие куски с первого шага:

- теряется связь между проблемой и решением;
- растет шум;
- сложнее потом собирать ответ обратно.

Для текущего пайплайна один useful resolved ticket = одна retrieval unit.

### Point ID

`ticket:{ticket_id}`

Пример:

`ticket:31929`

### Payload schema

```json
{
  "source_type": "ticket",
  "ticket_id": 31929,
  "request_text": "...",
  "resolution_text": "...",
  "resolution_source": "worklog",
  "is_actionable": true,
  "resolution_quality": "strong",
  "candidate_for_abstain": false,
  "service": "Целевые: ЗУП (Корпоративная)",
  "task_type": "Тип: 1С (Программисты)",
  "status": "Закрыта",
  "priority": "Низкий",
  "created_at": "...",
  "closed_at": "...",
  "custom_fields": {
    "Тип обращения": "...",
    "Торговая марка": "..."
  },
  "worklogs": [
    {
      "date": "...",
      "minutes": 15,
      "comment": "анализ ошибки, изменение начисления"
    }
  ],
  "domain_tags": ["1с", "отчет", "доступ"]
}
```

### Текст для эмбеддинга

В vector search кладем **не весь raw payload**, а специальный `search_text`.

```text
[TITLE / REQUEST]
{request_text}

[SERVICE]
{service}

[TASK TYPE]
{task_type}

[KEY FIELDS]
{selected_custom_fields}
```

`resolution_text` как основной embedding signal сюда не тащим.

### Что не надо класть в embedding text как основной сигнал

- длинный `resolution_text`
- все worklogs подряд
- служебные поля

Иначе вектор будет уходить от “что за проблема” к “что делали”, а query у нас обычно problem-first.

### Как использовать `resolution_text`

`resolution_text` сохраняем в payload и используем:

- для rerank;
- для финального ответа;
- для пост-фильтра по качеству кандидата.

### Что добавляем в v2 поверх basic schema

- `is_actionable` — есть ли в кейсе признаки реального полезного решения;
- `resolution_quality` — грубая оценка (`strong` / `weak`);
- `candidate_for_abstain` — можно ли на этом кейсе строить ответ без дополнительного контекста;
- `domain_tags` — простые доменные маркеры для мягких бустов и отладки.

## 5) `article_chunks`: схема и логика

Статьи — это не case retrieval, а knowledge enrichment.

Поэтому для них уже нужен обычный чанкинг.

### Unit of retrieval

**Один point = один article chunk**

### Базовая логика чанкинга

Чанкуем **не по тупому fixed window**, а по структуре Markdown:

1. Сначала берем `markdown` из `articles_source`
2. Делим по заголовкам (`#`, `##`, `###`)
3. Внутри секции сохраняем вместе:
   - заголовок,
   - текст под ним,
   - списки,
   - таблицы
4. Если секция слишком большая — режем по абзацам/блокам, но:
   - не рвем таблицу,
   - не рвем список посередине

### Coarse-first правило

По статьям важнее **не резать в пустую**, чем любой ценой получать много мелких чанков.

Поэтому:

- короткую статью держим целиком;
- нормальную секцию держим целиком;
- режем только oversized sections;
- overlap используем только при forced split больших монолитных секций.

### KISS-параметры чанкинга

- целевой размер: `400-800` токенов
- hard limit: `1000-1200` токенов
- overlap: минимальный, через повтор breadcrumb, а не через большой raw overlap

### Breadcrumb вместо тяжелого overlap

Каждый chunk должен нести контекст:

- title статьи
- folder path
- heading path

То есть вместо дублирования длинного текста:

```text
Article: Доступ в VPN
Folder: IT / Remote Access
Heading path: Настройка / Windows / Первый вход
```

Это дешевле и для retrieval обычно полезнее, чем тащить 150 токенов overlap.

### Point ID

`article:{article_id}:{chunk_index}`

Пример:

`article:602:3`

### Payload schema

```json
{
  "source_type": "article",
  "article_id": 602,
  "chunk_id": "article:602:3",
  "chunk_index": 3,
  "title": "Настройка VPN",
  "folder_path": "1C",
  "tags": ["vpn", "удаленная работа"],
  "heading_path": ["Настройка", "Windows", "Первый вход"],
  "chunk_text": "...",
  "chunk_markdown": "...",
  "is_published": true,
  "rating": 5
}
```

### Текст для эмбеддинга

```text
[ARTICLE]
{title}

[PATH]
{folder_path}

[HEADINGS]
{heading_path}

[CONTENT]
{chunk_markdown}
```

## 6) Пошаговая логика поиска

## Шаг 1. Ticket retrieval

Пользовательский запрос идет в `ticket_cases`.

Ищем top-K по embeddings на основе `request_text`-центричного `search_text`.

### Допустимые soft boosts

Если из запроса явно читается домен, можно мягко повышать релевантность:

- `1с`
- `отчет`
- `всд`
- `меркурий`
- `принтер`
- `удаленка`
- `vpn`
- `доступ`
- `почта`

Но это **boost**, а не жесткий router.

## Шаг 2. Candidate filtering / rerank

После ticket retrieval оцениваем кандидатов по простым признакам:

- есть ли нормальный `resolution_text`
- совпадают ли важные сущности
- совпадает ли домен (`service`, `task_type`, `custom_fields`)
- насколько решение вообще похоже на actionable resolution
- нет ли сигналов отмены / отказа / неактуальности

Идея простая:

- initial retrieval ищет похожую проблему;
- rerank выбирает кейс, где реально есть полезное решение.

## Шаг 3. Confidence gate / abstain

После rerank обязательно принимаем одно из решений:

1. `answer_from_ticket`
2. `answer_from_ticket_plus_article`
3. `ask_clarifying_question`
4. `escalate_to_human`

### Когда не отвечаем сразу

Если top candidate:

- слабый по similarity;
- слабый по `resolution_quality`;
- не дает actionable resolution;
- конфликтует по домену;
- или похож на кейс-отказ / кейс-отмену,

то не делаем вид, что нашли надежный ответ.

Это ключевой safety-механизм для кейса из `README.md`.

## Шаг 4. Article enrichment

Статьи ищем **не всегда**, а только если:

1. ticket найден, но `resolution_text` короткий / бедный;
2. ticket дает направление, но не дает пошаговую инструкцию;
3. нужно подтверждение из KB;
4. top ticket confidence низкий.

### Query для статьи

Article search лучше строить не из исходного запроса в чистом виде, а из:

- исходного user query;
- нормализованной формулировки проблемы из top ticket;
- доменных сущностей из top ticket.

То есть article retrieval — это уже controlled enrichment, а не слепой второй поиск.

## 7) Минимальный pipeline для интеграции с Qdrant

### Offline

1. Собираем `tickets_source`
2. Фильтруем retrieval-worthy resolved tickets
3. Формируем `ticket_cases`
4. Собираем `articles_source`
5. Чанкуем статьи в `article_chunks`
6. Грузим в две коллекции Qdrant

### Online

1. User query
2. Search `ticket_cases`
3. Rerank top candidates
4. Confidence gate
5. Если нужно -> search `article_chunks`
6. Assemble answer или abstain

## 8) Что пока не делаем

- отдельную коллекцию worklog-step chunks
- жесткий query router по доменам
- мультивекторный retrieval
- сложный graph retrieval
- retrieval по нерешенным тикетам

Все это можно добавить позже, если KISS-версия упрется в качество.

## 9) Гипотезы про LLM enrichment

На текущем этапе LLM enrichment не является частью core design.

Но как следующий слой гипотез можно проверить offline generation для:

- `issue_summary`
- `resolution_summary`
- `entities/search_hints`

Идея:

- не генерировать answer-ready инструкции;
- не давать LLM “додумывать” решение;
- использовать LLM только как инструмент нормализации noisy ticket data.

## 10) Почему этот дизайн соответствует README

`README.md` прямо говорит:

- главная база экспертизы — исторические тикеты;
- KB — дополнительный важный источник;
- бот должен отвечать на новые запросы сотрудников;
- лучше не ответить, чем ошибиться.

Поэтому логика:

1. **ищем похожий полезный решенный кейс**
2. **если нужно — обогащаем статьями**
3. **если уверенности нет — не притворяемся, что ответ найден**

является наиболее естественной, безопасной и внедряемой.


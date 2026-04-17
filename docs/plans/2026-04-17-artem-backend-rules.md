# Artem Backend Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable project skill named `artem-backend-rules` that packages the repository's backend architecture and code-style rules from `rules.md`.

**Architecture:** Add a compact discovery-oriented `SKILL.md` plus a fuller `reference.md` under `.cursor/skills/artem-backend-rules/`. Keep `rules.md` unchanged so existing references are not broken.

**Tech Stack:** Cursor project skills, Markdown, YAML frontmatter

---

### Task 1: Create the main skill file

**Files:**
- Create: `.cursor/skills/artem-backend-rules/SKILL.md`
- Reference: `rules.md`

- [ ] **Step 1: Create the skill frontmatter and trigger description**

```markdown
---
name: artem-backend-rules
description: Use when working on `backend/` or `ai-agent/` in this repository, especially for FastAPI endpoints, SQLAlchemy 2.0 models, Pydantic schemas, JWT auth, service/repository boundaries, or `docker-compose` backend changes.
---
```

- [ ] **Step 2: Add the compact skill guidance**

```markdown
# Artem Backend Rules

## Overview

Apply these repository-specific backend rules before designing or editing code in `backend/` or `ai-agent/`.

## When To Use

- changes in `backend/` or `ai-agent/`
- FastAPI routers, Pydantic schemas, SQLAlchemy 2.0 models, repositories, services
- JWT access or backend service wiring in `docker-compose.yml`
```

- [ ] **Step 3: Add the non-negotiable rules and reference link**

```markdown
## Non-Negotiable Rules

- requests and responses use Pydantic models from `schemas`
- ORM uses SQLAlchemy 2.0 with `Mapped[]`
- models live in `db/models`
- repositories live in `db/repositories`
- business logic lives in `services`
- routers live in `routers`, `routers/admin`, and `routers/internal`
- backend code is async, built on FastAPI, and served with `uvicorn`

## Additional Reference

See [reference.md](reference.md).
```

### Task 2: Create the detailed reference file

**Files:**
- Create: `.cursor/skills/artem-backend-rules/reference.md`
- Reference: `rules.md`

- [ ] **Step 1: Rewrite the original rules into scan-friendly sections**

```markdown
# Artem Backend Rules Reference

## Directories
- `ai-agent` contains the AI agent service.
- `backend` contains the API service.

## Architecture Rules
- Requests and responses are Pydantic models in `schemas`.
- Database access uses SQLAlchemy 2.0 and `Mapped[]`.
- ORM models live in `db/models`.
- Repositories live in `db/repositories`.
- Business logic lives in `services`.
- Routers live in `routers`, `routers/admin`, and `routers/internal`.
```

- [ ] **Step 2: Add code style, infrastructure, and product constraints**

```markdown
## Code Style
- Use type annotations.
- Prefer docstrings over comments.
- Keep public names clear and not overloaded.
- Follow single responsibility and use dependency inversion where it helps.
- Keep code extensible and avoid cascading decorators.

## Infrastructure
- All services must be represented in `docker-compose.yml`.
- The project should start with `docker compose up`.

## Product Constraints
- Do not break previous work.
- Keep important notes in `README.md`, but do not overload it.
```

- [ ] **Step 3: Add required models and JWT reference**

```markdown
## Required Database Models
- `user`
- `message`
- `metric`
- `document`
- `ticket`

## Authentication
- `backend` must implement JWT-based access.
- Reference: `https://github.com/ArtgtH/alfa-hack/tree/main/backend`
```

### Task 3: Verify the packaged skill

**Files:**
- Verify: `.cursor/skills/artem-backend-rules/SKILL.md`
- Verify: `.cursor/skills/artem-backend-rules/reference.md`
- Compare: `rules.md`

- [ ] **Step 1: Confirm both files exist**

Run: `ls .cursor/skills/artem-backend-rules`
Expected: `SKILL.md` and `reference.md`

- [ ] **Step 2: Read the skill files and compare them with `rules.md`**

Run: `python - <<'PY'
from pathlib import Path
for path in [
    Path(".cursor/skills/artem-backend-rules/SKILL.md"),
    Path(".cursor/skills/artem-backend-rules/reference.md"),
    Path("rules.md"),
]:
    print(f"--- {path} ---")
    print(path.read_text(encoding='utf-8')[:800])
PY`

Expected: the compact file is discovery-oriented, the reference preserves the original rules, and `rules.md` remains unchanged.

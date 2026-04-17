---
name: artem-backend-rules
description: Use when working on `backend/` or `ai-agent/` in this repository, especially for FastAPI endpoints, SQLAlchemy 2.0 models, Pydantic schemas, JWT auth, service or repository boundaries, or `docker-compose` backend changes.
---

# Artem Backend Rules

## Overview

Apply these repository-specific backend rules before designing or editing code in `backend/` or `ai-agent/`.

## When To Use

Use this skill when the task involves:

- changes in `backend/` or `ai-agent/`;
- FastAPI routers or API handlers;
- Pydantic request or response schemas;
- SQLAlchemy 2.0 models, repositories, or service-layer code;
- JWT authentication or authorization;
- backend-related `docker-compose.yml` changes.

Do not use this skill for unrelated research or data-preparation work in `research/`.

## Non-Negotiable Rules

- Requests and responses use Pydantic models from `schemas`.
- Database access uses SQLAlchemy 2.0 and ORM fields should be declared with `Mapped[]`.
- ORM models live in `db/models`.
- Repositories live in `db/repositories`.
- Business logic lives in `services`.
- Routers live in `routers`, `routers/admin`, and `routers/internal`.
- Backend code should be async, built on FastAPI, and served with `uvicorn`.
- Do not break previous work.
- Keep important project notes in `README.md`, but do not overload it.

## Code Style

- Use type annotations.
- Prefer docstrings over comments.
- Keep public names clear and not overloaded.
- Follow single responsibility.
- Use dependency inversion where it helps keep code extensible.
- Avoid self-coupled designs and cascading decorators used to patch default problems.

## Required Defaults

- Expected DB model names include `user`, `message`, `metric`, `document`, and `ticket`.
- `backend` should implement JWT-based access.

## Additional Reference

See [reference.md](reference.md) for the full repository rule set.

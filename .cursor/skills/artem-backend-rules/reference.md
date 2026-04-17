# Artem Backend Rules Reference

## Directories

- `ai-agent` is the directory for the AI agent service.
- `backend` is the directory for the API service.

## Architecture Rules

- All request and response payloads should be represented as Pydantic models stored in `schemas`.
- Database access should use SQLAlchemy 2.0.
- ORM fields should be declared with `Mapped[]`.
- ORM models should live in `db/models`.
- Repositories are responsible for reading and writing database data and should live in `db/repositories`.
- Business logic should be moved into `services`.
- Routers should live in `routers`.
- Admin routers should live in `routers/admin`.
- Internal API routers should live in `routers/internal`.
- FastAPI is the backend framework.
- Backend code should be asynchronous.
- `uvicorn` is the expected web server.

## Code Style

- Use explicit type annotations in code.
- Comments are discouraged. If extra explanation is needed, prefer docstrings.
- Public naming should stay clear but not overloaded. Aim for readable interface names, typically in the `8-15` character range when reasonable.
- Code should follow single responsibility.
- Use dependency inversion where it helps keep modules extensible.
- Avoid designs that are tightly coupled to themselves.
- Avoid cascading decorators used to solve default problems when they hurt readability.

## Infrastructure

- All services should be represented in `docker-compose.yml`.
- The project should be startable with `docker compose up`.

## Prohibited Behavior

- Do not break previous work.

## README Expectations

- Important project decisions and usage notes should be reflected in `README.md`.
- Keep `README.md` useful and not overloaded.

## Required Database Models

The backend domain should include these model concepts:

- `user`
- `message`
- `metric`
- `document`
- `ticket`

## Authentication

- `backend` should implement JWT-based access.
- Reference implementation: [ArtgtH/alfa-hack backend](https://github.com/ArtgtH/alfa-hack/tree/main/backend)

# Artem Backend Rules Skill Design

## Goal

Convert `rules.md` into a reusable project skill named `artem-backend-rules` so the agent can automatically apply the repository's backend architecture and code style constraints when working in `backend/` and `ai-agent/`.

## Chosen Approach

Use a compact project skill with a reference file:

- `.cursor/skills/artem-backend-rules/SKILL.md`
- `.cursor/skills/artem-backend-rules/reference.md`

This keeps discovery lightweight while preserving the full rule set in a separate file.

## Scope

The new skill should cover:

- repository-specific backend directory roles;
- required stack choices: FastAPI, SQLAlchemy 2.0, Pydantic schemas, async code, uvicorn;
- repository layering rules for `db/models`, `db/repositories`, `services`, and `routers`;
- code style constraints such as type annotations, docstrings instead of comments, readable public naming, SRP, extensibility, and avoiding cascading decorators;
- infrastructure expectations such as `docker compose up`;
- product constraints such as preserving previous work and keeping important notes in `README`;
- required database entities and the JWT requirement for `backend`.

## Skill Structure

### `SKILL.md`

The main skill file should:

- use the name `artem-backend-rules`;
- have a description focused on trigger conditions only;
- tell the agent when to apply the skill;
- summarize the non-negotiable architecture and style rules;
- point to `reference.md` for the full checklist and domain details.

### `reference.md`

The reference file should preserve the substance of `rules.md`, but restructure it into sections that are easier for an agent to scan:

- directories;
- architecture rules;
- code style;
- infrastructure;
- prohibited behavior;
- `README` expectations;
- required DB models;
- JWT reference.

## Handling `rules.md`

Do not delete `rules.md` in this step. Keep it as the source note for now to avoid surprising the user and to preserve backwards compatibility with any existing references.

## Validation

After creating the skill:

1. Verify the files exist in `.cursor/skills/artem-backend-rules/`.
2. Check that `SKILL.md` has valid frontmatter with `name` and `description`.
3. Confirm the description is specific to discovery and does not summarize the workflow.
4. Confirm the skill content matches the intent of `rules.md`.

## Open Decisions

Resolved:

- store as a project skill, not a personal skill;
- use a compact main file plus a reference file;
- keep `rules.md` in place for now.

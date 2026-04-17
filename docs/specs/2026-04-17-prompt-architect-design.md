# Prompt Architect Hybrid Integration Design

## Goal

Add `prompt-architect` to this repository as a project skill so it can be used from `.cursor/skills/` without bringing in the upstream npm installer, plugin marketplace files, or non-Cursor adapter packaging.

## Chosen Approach

Use a **hybrid import**:

- keep the upstream skill name `prompt-architect`;
- import the core skill package from `skills/prompt-architect/`;
- preserve the working skill structure needed for actual use;
- exclude upstream distribution and installer scaffolding that is not needed inside this repository.

## Why Hybrid

The upstream repository is a portable package for many tools. This project only needs the project-skill version that Cursor can discover locally.

The hybrid approach keeps the useful parts:

- `SKILL.md`
- `scripts/`
- `references/frameworks/`
- `assets/templates/`

and drops the parts that are packaging-oriented rather than skill-oriented:

- npm installer flow
- package publishing metadata
- plugin marketplace wiring
- non-project adapters for other agent tools

## Upstream Baseline

The upstream skill package currently contains:

- `SKILL.md`
- 2 Python helper scripts
- 27 framework reference files
- 29 prompt templates

The local baseline test without this skill showed that a generic agent can improve a vague prompt, but it does not naturally:

- recommend a named framework;
- run a structured clarification flow;
- follow a consistent analysis-to-revised-prompt format;
- use the upstream intent taxonomy.

This confirms the imported skill adds real behavior rather than duplicate project guidance.

## Target Layout

Create this project-skill directory:

- `.cursor/skills/prompt-architect/`

Expected contents:

- `.cursor/skills/prompt-architect/SKILL.md`
- `.cursor/skills/prompt-architect/scripts/`
- `.cursor/skills/prompt-architect/references/frameworks/`
- `.cursor/skills/prompt-architect/assets/templates/`

## Scope

### Import As-Is

Import upstream skill content with minimal or no edits for:

- `SKILL.md`
- framework references
- prompt templates
- Python helper scripts

### Project-Specific Adjustments

Allow only small adjustments if needed to make the skill fit this repository cleanly:

- ensure relative links still work under `.cursor/skills/prompt-architect/`;
- optionally add a short note that this is a local project copy of the upstream skill;
- preserve upstream attribution and license context where reasonable.

### Explicitly Out of Scope

Do not import:

- `package.json`
- npm install scripts
- `.claude-plugin/`
- `adapters/`
- GitHub workflow files
- repository-level README/changelog/marketplace material unless needed as reference

## Validation

After implementation:

1. Verify the local skill directory exists with the expected subdirectories.
2. Verify `SKILL.md` frontmatter is valid and still discoverable.
3. Verify referenced paths inside `SKILL.md` resolve correctly against the imported local files.
4. Compare imported structure against upstream to confirm the hybrid boundary is respected.
5. Run a post-import behavior check with a subagent on a prompt-improvement request and confirm the response now uses the imported skill conventions.

## Risks and Mitigations

### Risk: Broken internal references

Mitigation:

- verify all relative references from `SKILL.md` still point to real local files.

### Risk: Pulling too much upstream clutter

Mitigation:

- limit import to the actual skill package files only.

### Risk: Silent divergence from upstream behavior

Mitigation:

- keep content as close to upstream as possible and avoid unnecessary rewriting.

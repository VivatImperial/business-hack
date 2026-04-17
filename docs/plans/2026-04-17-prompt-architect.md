# Prompt Architect Hybrid Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the upstream `prompt-architect` skill to this repository as a local project skill using the approved hybrid import boundary.

**Architecture:** Import the actual skill package from upstream into `.cursor/skills/prompt-architect/`, preserving `SKILL.md`, `scripts/`, `references/frameworks/`, and `assets/templates/`, while excluding installer, plugin, adapter, and package-publishing files.

**Tech Stack:** Cursor project skills, Markdown, Python helper scripts, plain-text prompt templates

---

### Task 1: Create the local skill directory and import boundary

**Files:**
- Create: `.cursor/skills/prompt-architect/`
- Reference: `docs/specs/2026-04-17-prompt-architect-design.md`
- Reference: `/tmp/prompt-architect-upstream/skills/prompt-architect/`

- [ ] **Step 1: Create the local skill directory**

Run: `mkdir -p .cursor/skills/prompt-architect`

Expected: the project now has a dedicated directory for the imported skill.

- [ ] **Step 2: Keep only the approved hybrid boundary**

Import only these paths from upstream:

- `SKILL.md`
- `scripts/`
- `references/frameworks/`
- `assets/templates/`

Do not import:

- `package.json`
- `.claude-plugin/`
- `adapters/`
- upstream repository docs unrelated to the skill payload

### Task 2: Import the upstream skill payload

**Files:**
- Create: `.cursor/skills/prompt-architect/SKILL.md`
- Create: `.cursor/skills/prompt-architect/scripts/framework_analyzer.py`
- Create: `.cursor/skills/prompt-architect/scripts/prompt_evaluator.py`
- Create: `.cursor/skills/prompt-architect/references/frameworks/*.md`
- Create: `.cursor/skills/prompt-architect/assets/templates/*.txt`

- [ ] **Step 1: Import `SKILL.md` with upstream metadata**

The imported file should preserve upstream frontmatter such as:

```markdown
---
name: prompt-architect
description: Analyzes and improves prompts using 27 research-backed frameworks across 7 intent categories. Use when a user wants to improve, rewrite, structure, or engineer a prompt ...
license: MIT
metadata:
  author: ckelsoe
  version: "3.2.2"
---
```

- [ ] **Step 2: Import the helper scripts untouched unless path fixes are required**

Expected script files:

- `scripts/framework_analyzer.py`
- `scripts/prompt_evaluator.py`

- [ ] **Step 3: Import framework references**

Expected count: `27` markdown files under `references/frameworks/`

- [ ] **Step 4: Import prompt templates**

Expected count: `29` text files under `assets/templates/`

### Task 3: Verify structure and references

**Files:**
- Verify: `.cursor/skills/prompt-architect/SKILL.md`
- Verify: `.cursor/skills/prompt-architect/scripts/`
- Verify: `.cursor/skills/prompt-architect/references/frameworks/`
- Verify: `.cursor/skills/prompt-architect/assets/templates/`

- [ ] **Step 1: Verify the imported file counts**

Run: `python - <<'PY'
from pathlib import Path
root = Path('.cursor/skills/prompt-architect')
print('skill', (root / 'SKILL.md').exists())
print('scripts', len(list((root / 'scripts').glob('*.py'))))
print('frameworks', len(list((root / 'references' / 'frameworks').glob('*.md'))))
print('templates', len(list((root / 'assets' / 'templates').glob('*.txt'))))
PY`

Expected:

- `skill True`
- `scripts 2`
- `frameworks 27`
- `templates 29`

- [ ] **Step 2: Verify `SKILL.md` references point to real local paths**

Check that these directories exist and match the relative paths used by the skill:

- `assets/templates/`
- `references/frameworks/`
- `scripts/`

- [ ] **Step 3: Verify the hybrid boundary**

Confirm that local `.cursor/skills/prompt-architect/` does not contain packaging-only upstream files such as `package.json`, `.claude-plugin`, or `adapters`.

### Task 4: Run a post-import behavior check

**Files:**
- Verify behavior against the imported `.cursor/skills/prompt-architect/SKILL.md`

- [ ] **Step 1: Re-run the baseline prompt-improvement scenario**

Use a fresh agent on:

`Help me improve this prompt: write a technical blog post`

- [ ] **Step 2: Verify imported-skill behavior appears**

Expected signs:

- explicit framework selection or recommendation;
- structured prompt-quality analysis;
- targeted clarification behavior or framework-specific questioning;
- a consistent analysis-to-revised-prompt output shape.

- [ ] **Step 3: Record whether the imported skill changed behavior meaningfully**

If the post-import response still looks like generic manual prompt expansion, treat that as a verification failure and inspect discoverability or skill-path issues before calling the work complete.

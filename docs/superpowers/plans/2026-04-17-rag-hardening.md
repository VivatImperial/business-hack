# RAG Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Довести `ai-agent` до ticket-first RAG из research-дизайна, чтобы `resolve_issue` и `create_ticket` работали grounded, explainable и проверяемо.

**Architecture:** Усиливаем retrieval core в `ai-agent` без расширения admin scope: ticket-first search, rerank, confidence gate, controlled article enrichment, затем intake flow и classifier hints для `create_ticket`, затем prompt hardening и eval. Все новые quality checks держим внутри `ai-agent/tests`, а admin migration в `backend` не трогаем.

**Tech Stack:** FastAPI, Pydantic, Qdrant, локальные эмбеддинги `Qwen/Qwen3-Embedding-0.6B`, YandexGPT latest, `unittest`.

---

### Task 1: Retrieval Core Hardening

**Files:**
- Modify: `ai-agent/ai_agent/services/retrieval_service.py`
- Modify: `ai-agent/ai_agent/services/rerank_service.py`
- Modify: `ai-agent/ai_agent/services/confidence_service.py`
- Modify: `ai-agent/ai_agent/services/dialog_orchestrator.py`
- Test: `ai-agent/tests/test_retrieval_core.py`

- [ ] **Step 1: Write the failing retrieval-core tests**

```python
import unittest

from ai_agent.schemas.inference import AgentSettingsPayload
from ai_agent.services.confidence_service import ConfidenceService
from ai_agent.services.retrieval_service import RetrievalService


class RetrievalCoreTests(unittest.TestCase):
    def test_article_search_uses_enriched_query_when_ticket_is_weak(self) -> None:
        # expected: article query is built from user text + top ticket hints
        self.fail("not implemented")

    def test_rerank_demotes_rejection_like_candidates(self) -> None:
        # expected: cancelled/non-actionable ticket loses to actionable candidate
        self.fail("not implemented")

    def test_confidence_gate_escalates_when_top_ticket_is_conflicting(self) -> None:
        gate = ConfidenceService()
        self.fail("not implemented")
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd ai-agent && uv run python -m unittest tests.test_retrieval_core -v
```

Expected:
- FAIL on missing enriched query behavior
- FAIL on weak rerank behavior
- FAIL on confidence gate matrix

- [ ] **Step 3: Implement minimal retrieval/rerank/gate changes**

```python
# retrieval_service.py
def build_ticket_query(user_text: str) -> str:
    return normalize_query(user_text)

def build_article_query(user_text: str, top_ticket: RetrievedDocument | None) -> str:
    parts = [normalize_query(user_text)]
    if top_ticket is not None:
        parts.extend(
            [
                str(top_ticket.payload.get("request_text") or ""),
                str(top_ticket.payload.get("service") or ""),
                str(top_ticket.payload.get("task_type") or ""),
                " ".join(top_ticket.payload.get("domain_tags") or []),
            ]
        )
    return "\n".join(part for part in parts if part).strip()

# rerank_service.py
score = base_score
if payload.get("resolution_quality") == "strong":
    score += 0.2
if payload.get("candidate_for_abstain"):
    score -= 0.25
if looks_like_rejection(payload):
    score -= 1.0
if domain_overlap(query_hints, payload):
    score += 0.15

# confidence_service.py
if not retrieval.tickets:
    return "escalate"
if top_ticket.score >= threshold and not top_ticket.payload.get("candidate_for_abstain"):
    return "answer"
if retrieval.articles or top_ticket.score >= threshold - 0.15:
    return "clarify"
return "escalate"
```

- [ ] **Step 4: Run tests to verify the retrieval core passes**

Run:
```bash
cd ai-agent && uv run python -m unittest tests.test_retrieval_core -v
```

Expected:
- PASS

- [ ] **Step 5: Run the broader service tests and keep them green**

Run:
```bash
cd ai-agent && uv run python -m unittest discover tests -v
```

Expected:
- PASS

### Task 2: `create_ticket` Intake Flow and Classifier Hints

**Files:**
- Modify: `ai-agent/ai_agent/services/ticket_draft_service.py`
- Modify: `ai-agent/ai_agent/services/dialog_orchestrator.py`
- Modify: `ai-agent/ai_agent/schemas/generation.py`
- Test: `ai-agent/tests/test_create_ticket_flow.py`

- [ ] **Step 1: Write the failing create-ticket tests**

```python
import unittest


class CreateTicketFlowTests(unittest.TestCase):
    def test_create_ticket_returns_missing_fields_when_context_is_incomplete(self) -> None:
        self.fail("not implemented")

    def test_create_ticket_uses_top_ticket_signals_for_classifier_hints(self) -> None:
        self.fail("not implemented")

    def test_create_ticket_asks_no_more_than_two_questions(self) -> None:
        self.fail("not implemented")
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd ai-agent && uv run python -m unittest tests.test_create_ticket_flow -v
```

Expected:
- FAIL on missing structured intake behavior

- [ ] **Step 3: Implement the minimal intake flow**

```python
# generation.py
class TicketDraftSuggestion(BaseModel):
    normalized_request: str
    missing_fields: list[str] = Field(default_factory=list)
    clarifying_questions: list[str] = Field(default_factory=list)
    suggested_service: str | None = None
    suggested_task_type: str | None = None
    suggested_priority: str | None = None
    evidence_ticket_ids: list[int] = Field(default_factory=list)
    evidence_summary: str | None = None

# ticket_draft_service.py
missing_fields = detect_missing_fields(user_text)
clarifying_questions = build_questions(missing_fields)[:2]
return TicketDraftSuggestion(
    normalized_request=normalized_request,
    missing_fields=missing_fields,
    clarifying_questions=clarifying_questions,
    suggested_service=...,
    suggested_task_type=...,
    suggested_priority=...,
    evidence_ticket_ids=...,
    evidence_summary=...,
)
```

- [ ] **Step 4: Run tests to verify `create_ticket` flow passes**

Run:
```bash
cd ai-agent && uv run python -m unittest tests.test_create_ticket_flow -v
```

Expected:
- PASS

- [ ] **Step 5: Re-run full `ai-agent` suite**

Run:
```bash
cd ai-agent && uv run python -m unittest discover tests -v
```

Expected:
- PASS

### Task 3: Prompt Hardening and Context Assembly

**Files:**
- Modify: `ai-agent/ai_agent/services/answer_service.py`
- Modify: `ai-agent/ai_agent/agents/support_agent/prompt_storage/resolve_issue.py`
- Modify: `ai-agent/ai_agent/agents/support_agent/prompt_storage/create_ticket.py`
- Modify: `ai-agent/ai_agent/agents/support_agent/prompt_storage/clarify.py`
- Modify: `ai-agent/ai_agent/agents/support_agent/prompt_storage/abstain.py`
- Test: `ai-agent/tests/test_prompt_contracts.py`

- [ ] **Step 1: Write failing prompt-contract tests**

```python
import unittest


class PromptContractTests(unittest.TestCase):
    def test_resolve_issue_prompt_requires_grounding_and_citations(self) -> None:
        self.fail("not implemented")

    def test_create_ticket_prompt_requires_recommendation_not_truth(self) -> None:
        self.fail("not implemented")

    def test_answer_service_context_contains_numbered_sources(self) -> None:
        self.fail("not implemented")
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd ai-agent && uv run python -m unittest tests.test_prompt_contracts -v
```

Expected:
- FAIL because prompt discipline and context assembly are still too weak

- [ ] **Step 3: Implement stricter prompts and context assembly**

```python
# answer_service.py
def _build_context(self, retrieval: RetrievalResult) -> str:
    parts = []
    for index, hit in enumerate([*retrieval.tickets[:3], *retrieval.articles[:3]], start=1):
        source_text = hit.payload.get("resolution_text") or hit.payload.get("chunk_markdown") or hit.payload.get("request_text") or ""
        title = hit.payload.get("title") or hit.payload.get("service") or hit.point_id
        parts.append(f"[{index}] SOURCE: {title}\n{source_text}")
    return "\n\n".join(parts)

# resolve_issue prompt
- отвечай только по источникам;
- если не хватает данных, не выдумывай;
- обязательно вставляй citations;

# create_ticket prompt
- classifier hints are recommendations;
- if missing data, ask up to two questions;
- return structured draft language;
```

- [ ] **Step 4: Run prompt tests**

Run:
```bash
cd ai-agent && uv run python -m unittest tests.test_prompt_contracts -v
```

Expected:
- PASS

- [ ] **Step 5: Re-run full `ai-agent` suite**

Run:
```bash
cd ai-agent && uv run python -m unittest discover tests -v
```

Expected:
- PASS

### Task 4: Retrieval Eval and End-to-End Regression Suite

**Files:**
- Create: `ai-agent/tests/fixtures/rag_eval_cases.json`
- Create: `ai-agent/tests/test_rag_eval.py`
- Modify: `ai-agent/README.md`

- [ ] **Step 1: Write failing eval test harness**

```python
import json
import unittest
from pathlib import Path


class RagEvalTests(unittest.TestCase):
    def test_eval_cases_have_expected_ticket_ids_and_decisions(self) -> None:
        fixture_path = Path("tests/fixtures/rag_eval_cases.json")
        self.assertTrue(fixture_path.exists())
        self.fail("not implemented")
```

- [ ] **Step 2: Run eval harness to verify it fails**

Run:
```bash
cd ai-agent && uv run python -m unittest tests.test_rag_eval -v
```

Expected:
- FAIL because fixture and evaluation loop are not ready

- [ ] **Step 3: Add initial golden set and evaluation loop**

```json
[
  {
    "name": "vpn_resolve",
    "query": "Не подключается удаленка",
    "expected_mode": "resolve_issue",
    "expected_decision": "answer",
    "expected_top_ticket_ids": ["ticket:..."]
  },
  {
    "name": "ticket_creation",
    "query": "Помоги оформить заявку на проблему с VPN",
    "expected_mode": "create_ticket",
    "expected_decision": "clarify"
  }
]
```

```python
for case in cases:
    result = orchestrator_or_service(...)
    self.assertEqual(result.mode, case["expected_mode"])
    self.assertEqual(result.decision, case["expected_decision"])
```

- [ ] **Step 4: Run eval suite and full suite**

Run:
```bash
cd ai-agent && uv run python -m unittest tests.test_rag_eval -v
cd ai-agent && uv run python -m unittest discover tests -v
```

Expected:
- PASS

- [ ] **Step 5: Document the evaluation loop in README**

```markdown
## RAG Eval

Run:

```bash
cd ai-agent
uv run python -m unittest tests.test_rag_eval -v
```
```

### Task 5: Wrapper and Compatibility Verification

**Files:**
- Modify: `research/run_ai_agent_index.py`
- Modify: `research/rebuild_qdrant_index.py`
- Modify: `ai-agent/ai_agent/cli/index_from_exports.py`
- Test: `ai-agent/tests/test_cli.py`

- [ ] **Step 1: Add/extend failing CLI and wrapper tests**

```python
import unittest


class CliCompatibilityTests(unittest.TestCase):
    def test_research_wrapper_invokes_ai_agent_index_exports(self) -> None:
        self.fail("not implemented")
```

- [ ] **Step 2: Run CLI tests to verify failure**

Run:
```bash
cd ai-agent && uv run python -m unittest tests.test_cli -v
```

Expected:
- FAIL if wrapper or CLI contract mismatches remain

- [ ] **Step 3: Implement minimal compatibility fixes**

```python
# research/run_ai_agent_index.py
command = ["uv", "run", "--project", str(AI_AGENT_DIR), "ai-agent-index-exports", *sys.argv[1:]]

# index_from_exports.py
# keep batching and Qdrant upload contract aligned with runtime settings
```

- [ ] **Step 4: Run CLI tests and smoke help commands**

Run:
```bash
cd ai-agent && uv run python -m unittest tests.test_cli -v
uv run --project ai-agent ai-agent-index-exports --help
python3 research/run_ai_agent_index.py --help
```

Expected:
- PASS

- [ ] **Step 5: Final verification sweep**

Run:
```bash
cd ai-agent && uv run python -m unittest discover tests -v
uv run --project ai-agent python -m unittest discover tests/ai_agent -v
```

Expected:
- PASS

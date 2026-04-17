from __future__ import annotations

import asyncio
import datetime as dt

from ai_agent.schemas.generation import AgentRespondResponse
from ai_agent.schemas.inference import AgentRespondRequest
from ai_agent.schemas.retrieval import RetrievalResult
from ai_agent.services.answer_service import AnswerService
from ai_agent.services.confidence_service import ConfidenceService
from ai_agent.services.mode_router import ModeRouter
from ai_agent.services.rerank_service import RerankService
from ai_agent.services.retrieval_service import RetrievalService
from ai_agent.services.ticket_draft_service import TicketDraftService


class DialogOrchestrator:
    """Main online orchestrator for ai-agent requests."""

    def __init__(
        self,
        *,
        mode_router: ModeRouter,
        retrieval_service: RetrievalService,
        rerank_service: RerankService,
        confidence_service: ConfidenceService,
        answer_service: AnswerService,
        ticket_draft_service: TicketDraftService,
    ) -> None:
        self.mode_router = mode_router
        self.retrieval_service = retrieval_service
        self.rerank_service = rerank_service
        self.confidence_service = confidence_service
        self.answer_service = answer_service
        self.ticket_draft_service = ticket_draft_service

    async def respond(self, request: AgentRespondRequest) -> AgentRespondResponse:
        mode = self.mode_router.route(request.user_text)
        query_hints_getter = getattr(self.retrieval_service, "extract_query_hints", None)
        retrieve_tickets = getattr(self.retrieval_service, "retrieve_ticket_candidates", None)
        retrieve_articles = getattr(self.retrieval_service, "retrieve_article_candidates", None)
        should_enrich_getter = getattr(self.retrieval_service, "_should_enrich_with_articles", None)
        build_ticket_query = getattr(self.retrieval_service, "build_ticket_query", None)

        if callable(query_hints_getter) and callable(retrieve_tickets):
            query_hints = query_hints_getter(request.user_text)
            tickets = await asyncio.to_thread(
                retrieve_tickets,
                request.user_text,
                settings=request.settings,
            )
            reranked_tickets = await asyncio.to_thread(
                self.rerank_service.rerank_tickets,
                tickets,
                user_text=request.user_text,
                query_hints=query_hints,
            )
            retrieval = RetrievalResult(
                tickets=reranked_tickets,
                articles=[],
                used_articles=False,
            )
            if mode == "resolve_issue" and request.settings.use_articles and callable(retrieve_articles):
                should_enrich = bool(should_enrich_getter(reranked_tickets)) if callable(should_enrich_getter) else False
                if should_enrich:
                    top_ticket = reranked_tickets[0] if reranked_tickets else None
                    normalized_query = build_ticket_query(request.user_text) if callable(build_ticket_query) else request.user_text
                    retrieval.articles = await asyncio.to_thread(
                        retrieve_articles,
                        user_text=request.user_text,
                        normalized_query=normalized_query,
                        query_hints=query_hints,
                        top_ticket=top_ticket,
                        settings=request.settings,
                    )
                    retrieval.used_articles = bool(retrieval.articles)
        else:
            retrieval = await asyncio.to_thread(
                self.retrieval_service.retrieve,
                request.user_text,
                settings=request.settings,
            )
        decision = self.confidence_service.decide(
            mode=mode,
            retrieval=retrieval,
            threshold=request.settings.confidence_threshold,
        )
        confidence = self.confidence_service.confidence(retrieval)
        citations = self.answer_service.build_citations(retrieval)
        suggested_ticket = None

        if mode == "create_ticket":
            suggested_ticket = self.ticket_draft_service.build_draft(
                user_text=request.user_text,
                top_tickets=[ticket.model_dump() for ticket in retrieval.tickets],
            )
            if decision != "escalate" and suggested_ticket.clarifying_questions:
                decision = "clarify"
            if decision == "answer":
                assistant_message = await self.answer_service.build_create_ticket_message(
                    draft=suggested_ticket,
                    tone_of_voice=request.settings.tone_of_voice,
                )
                resolved_by = "assistant"
            elif decision == "clarify":
                assistant_message = self.answer_service.build_clarify_message(draft=suggested_ticket)
                resolved_by = "assistant"
            else:
                assistant_message = self.answer_service.build_escalation_message()
                resolved_by = "human"
        elif decision == "answer":
            assistant_message = await self.answer_service.build_resolve_issue_answer(
                user_text=request.user_text,
                retrieval=retrieval,
                tone_of_voice=request.settings.tone_of_voice,
            )
            resolved_by = "assistant"
        elif decision == "clarify":
            assistant_message = self.answer_service.build_clarify_message()
            resolved_by = "assistant"
        else:
            assistant_message = self.answer_service.build_escalation_message()
            resolved_by = "human"

        return AgentRespondResponse(
            mode=mode,
            decision=decision,
            assistant_message=assistant_message,
            citations=citations,
            confidence=confidence,
            used_articles=retrieval.used_articles,
            top_ticket_ids=[ticket.point_id for ticket in retrieval.tickets[:3]],
            suggested_ticket=suggested_ticket,
            retrieval_stats={
                "ticket_hits": len(retrieval.tickets),
                "article_hits": len(retrieval.articles),
            },
            resolved_by=resolved_by,
            processed_at=dt.datetime.now(dt.UTC),
        )

from __future__ import annotations

import logging

from fastapi import FastAPI
from qdrant_client import QdrantClient

from ai_agent.config import Settings, get_settings
from ai_agent.integrations.qdrant_repository import QdrantRepository
from ai_agent.integrations.yandex_gpt_client import YandexGptClient
from ai_agent.routers.admin.appeals import build_admin_appeals_router
from ai_agent.routers.admin.auth import build_admin_auth_router
from ai_agent.routers.admin.dashboard import build_admin_dashboard_router
from ai_agent.routers.admin.settings import build_admin_settings_router
from ai_agent.routers.internal.health import build_health_router
from ai_agent.routers.internal.inference import build_inference_router
from ai_agent.services.admin_service import AdminService
from ai_agent.services.answer_service import AnswerService
from ai_agent.services.confidence_service import ConfidenceService
from ai_agent.services.dialog_orchestrator import DialogOrchestrator
from ai_agent.services.embedding_service import QwenEmbeddingService
from ai_agent.services.mode_router import ModeRouter
from ai_agent.services.rerank_service import RerankService
from ai_agent.services.retrieval_service import RetrievalService
from ai_agent.services.ticket_draft_service import TicketDraftService


logger = logging.getLogger(__name__)


def build_runtime_dialog_orchestrator(settings: Settings) -> DialogOrchestrator | None:
    """Build the runtime dialog orchestrator when explicitly enabled."""

    if not settings.enable_runtime_orchestrator:
        return None

    logger.info("Building runtime dialog orchestrator.")
    repository = QdrantRepository(client=QdrantClient(url=settings.qdrant_url))
    embedder = QwenEmbeddingService(
        model_name=settings.embedding_model_name,
        device=settings.embedding_device,
        torch_dtype=settings.embedding_torch_dtype,
        max_length=settings.embedding_max_length,
        embedding_dim=settings.embedding_dim,
    )
    generator_client = YandexGptClient(
        api_key=settings.yandex_gpt_api_key,
        folder_id=settings.yandex_gpt_folder_id,
        model_name=settings.yandex_gpt_model,
        base_url=settings.yandex_gpt_base_url,
    )
    return DialogOrchestrator(
        mode_router=ModeRouter(),
        retrieval_service=RetrievalService(repository=repository, embedder=embedder),
        rerank_service=RerankService(),
        confidence_service=ConfidenceService(),
        answer_service=AnswerService(generator_client=generator_client),
        ticket_draft_service=TicketDraftService(),
    )


def create_app(
    settings: Settings | None = None,
    *,
    dialog_orchestrator: DialogOrchestrator | None = None,
) -> FastAPI:
    """Create the FastAPI application instance."""

    resolved_settings = settings or get_settings()
    resolved_orchestrator = dialog_orchestrator

    app = FastAPI(title=resolved_settings.service_name)
    app.state.dialog_orchestrator = resolved_orchestrator
    admin_service = AdminService(resolved_settings)
    app.state.admin_service = admin_service
    app.include_router(
        build_health_router(
            resolved_settings,
            dialog_orchestrator_ready=resolved_orchestrator is not None,
        )
    )
    app.include_router(build_admin_auth_router(admin_service))
    app.include_router(build_admin_dashboard_router(admin_service))
    app.include_router(build_admin_appeals_router(admin_service))
    app.include_router(build_admin_settings_router(admin_service))
    app.include_router(build_inference_router(dialog_orchestrator=resolved_orchestrator))
    return app


_module_settings = get_settings()
app = create_app(
    settings=_module_settings,
    dialog_orchestrator=build_runtime_dialog_orchestrator(_module_settings),
)

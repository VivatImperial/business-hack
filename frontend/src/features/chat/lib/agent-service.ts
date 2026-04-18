import Cookies from "js-cookie";
import { BASE_URL } from "@/lib/api/client";
import type { ChatMessage, ChatCitation } from "@/features/chat/lib/chat-store";

export interface AgentRespondRequest {
    appeal_id: string;
    message_id: string;
    employee_login: string;
    user_text: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AgentRespondResponse {
    assistant_message: string;
    confidence: number;
    should_escalate: boolean;
    citations: ChatCitation[];
    resolved_by: "assistant" | "human";
}

const RESPOND_URL = "/api/v1/internal/agent/respond";

interface RawAgentResponse {
    assistant_message?: string;
    message?: string;
    confidence?: number;
    should_escalate?: boolean | null;
    citations?: Array<{
        source_id?: string;
        title?: string;
        url?: string | null;
        kind?: string;
    }>;
    resolved_by?: "assistant" | "human";
}

function normalizeCitations(
    raw: RawAgentResponse["citations"],
): ChatCitation[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((c, idx) => ({
        source_id: c.source_id ?? String(idx),
        title: c.title ?? "Источник",
        url: c.url ?? null,
        kind:
            c.kind === "ticket" || c.kind === "article"
                ? c.kind
                : "unknown",
    }));
}

function pickText(raw: RawAgentResponse): string {
    const text = raw.assistant_message ?? raw.message ?? "";
    if (typeof text === "string" && text.trim().length > 0) return text;
    return "Не удалось получить ответ от ассистента. Попробуйте ещё раз.";
}

async function callLiveAgent(
    req: AgentRespondRequest,
): Promise<AgentRespondResponse> {
    const token = Cookies.get("auth_token");
    const res = await fetch(`${BASE_URL}${RESPOND_URL}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            ...req,
            // backend expects settings; server uses defaults if omitted
            settings: {
                tone_of_voice: "",
                confidence_threshold: 0.5,
                top_k: 10,
                use_articles: true,
            },
        }),
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || `HTTP ${res.status}`);
    }

    const raw = (await res.json()) as RawAgentResponse;
    return {
        assistant_message: pickText(raw),
        confidence: typeof raw.confidence === "number" ? raw.confidence : 0,
        should_escalate: raw.should_escalate === true,
        citations: normalizeCitations(raw.citations),
        resolved_by:
            raw.resolved_by === "human" ? "human" : "assistant",
    };
}

function mockResponse(req: AgentRespondRequest): AgentRespondResponse {
    const hint = req.user_text.toLowerCase();
    if (hint.includes("впн") || hint.includes("удал")) {
        return {
            assistant_message:
                "Проверьте подключение **UniVPN** и двухфакторную авторизацию через Контур.Коннект.\n\n1. Перезапустите VPN-клиент.\n2. Убедитесь, что код 2FA введён корректно.\n3. Если не помогает — обратитесь в тех.поддержку.",
            confidence: 0.82,
            should_escalate: false,
            resolved_by: "assistant",
            citations: [
                {
                    source_id: "kb-001",
                    title: "Настройка UniVPN",
                    url: null,
                    kind: "article",
                },
            ],
        };
    }
    if (hint.includes("1с") || hint.includes("отчет")) {
        return {
            assistant_message:
                "Проверьте в 1С выбранный период и список контрагентов. Обычно ошибка связана с некорректным диапазоном дат.",
            confidence: 0.74,
            should_escalate: false,
            resolved_by: "assistant",
            citations: [],
        };
    }
    return {
        assistant_message:
            "Я не уверен в точном ответе на этот вопрос. Передаю обращение живому менеджеру — он ответит в ближайшее время.",
        confidence: 0.2,
        should_escalate: true,
        resolved_by: "human",
        citations: [],
    };
}

const AGENT_MODE = (import.meta.env.VITE_AGENT_MODE ?? "auto").trim();

export async function respondFromAgent(
    req: AgentRespondRequest,
): Promise<AgentRespondResponse> {
    if (AGENT_MODE === "mock") {
        await new Promise((r) => setTimeout(r, 600));
        return mockResponse(req);
    }
    try {
        return await callLiveAgent(req);
    } catch (err) {
        if (AGENT_MODE === "live") {
            throw err;
        }
        // auto: fallback to mock on failure
        await new Promise((r) => setTimeout(r, 400));
        return mockResponse(req);
    }
}

export function toHistory(
    messages: ChatMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
    return messages
        .filter((m) => !m.pending)
        .map((m) => ({ role: m.role, content: m.content }));
}

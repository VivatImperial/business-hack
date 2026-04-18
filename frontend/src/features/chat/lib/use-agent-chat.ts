import { useCallback, useState } from "react";

import {
    chatStore,
    type ChatMessage,
    type ChatSession,
} from "@/features/chat/lib/chat-store";
import {
    respondFromAgent,
    toHistory,
} from "@/features/chat/lib/agent-service";
import { useSnackbar } from "@/hooks/use-snackbar";

interface SendArgs {
    sessionId: string;
    employeeLogin: string;
    text: string;
}

function uid(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useAgentChat() {
    const { showError } = useSnackbar();
    const [pending, setPending] = useState(false);

    const send = useCallback(
        async ({ sessionId, employeeLogin, text }: SendArgs) => {
            const session: ChatSession | undefined = chatStore.getSession(sessionId);
            if (!session) {
                showError("Сессия чата не найдена");
                return;
            }

            const now = Date.now();

            const userMessage: ChatMessage = {
                id: uid(),
                role: "user",
                content: text,
                createdAt: now,
            };
            chatStore.upsertMessage(sessionId, userMessage);

            const placeholderId = uid();
            const placeholder: ChatMessage = {
                id: placeholderId,
                role: "assistant",
                content: "",
                createdAt: now + 1,
                pending: true,
            };
            chatStore.upsertMessage(sessionId, placeholder);

            setPending(true);

            try {
                const updatedSession = chatStore.getSession(sessionId);
                const historyMessages = updatedSession?.messages ?? [];
                const history = toHistory(
                    historyMessages.filter((m) => m.id !== placeholderId),
                );

                const response = await respondFromAgent({
                    appeal_id: sessionId,
                    message_id: userMessage.id,
                    employee_login: employeeLogin || "anonymous",
                    user_text: text,
                    history,
                });

                const assistantMessage: ChatMessage = {
                    id: placeholderId,
                    role: "assistant",
                    content: response.assistant_message,
                    createdAt: Date.now(),
                    pending: false,
                    citations: response.citations,
                    confidence: response.confidence,
                    escalated: response.should_escalate,
                };
                chatStore.upsertMessage(sessionId, assistantMessage);
            } catch (err) {
                const errorMessage: ChatMessage = {
                    id: placeholderId,
                    role: "assistant",
                    content:
                        "Не удалось получить ответ от ассистента. Попробуйте ещё раз.",
                    createdAt: Date.now(),
                    pending: false,
                };
                chatStore.upsertMessage(sessionId, errorMessage);
                const text =
                    err instanceof Error ? err.message : "Ошибка запроса";
                showError(text);
            } finally {
                setPending(false);
            }
        },
        [showError],
    );

    return { send, pending };
}

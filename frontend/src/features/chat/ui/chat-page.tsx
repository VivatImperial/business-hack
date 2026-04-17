import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    useNavigate,
    useParams,
    useMatches,
} from "@tanstack/react-router";

import {
    useChatSessions,
    useChatSession,
} from "@/features/chat/lib/chat-store";
import { useAgentChat } from "@/features/chat/lib/use-agent-chat";
import { useMeApiV1AdminMeGet } from "@/lib/api/generated/admin-auth/admin-auth";
import { ChatInput } from "@/features/chat/ui/chat-input";
import { MessageUser } from "@/features/chat/ui/message-user";
import { MessageAssistant } from "@/features/chat/ui/message-assistant";
import { ChatEmpty } from "@/features/chat/ui/chat-empty";

export function ChatPage() {
    const navigate = useNavigate();
    const matches = useMatches();
    const isDetail = matches.some(
        (m) => m.routeId === "/_app/chat/$chatId",
    );
    const params = useParams({ strict: false }) as { chatId?: string };
    const routeChatId = isDetail ? params.chatId : undefined;

    const { createSession } = useChatSessions();
    const session = useChatSession(routeChatId);
    const { send, pending } = useAgentChat();

    const { data: me } = useMeApiV1AdminMeGet();
    const employeeLogin = me?.status === 200 ? me.data.login : "";

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Ensure session exists for /chat/:id; redirect if not found
    useEffect(() => {
        if (mounted && routeChatId && !session) {
            navigate({ to: "/chat", replace: true });
        }
    }, [mounted, routeChatId, session, navigate]);

    const handleSend = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        let sessionId = routeChatId;
        if (!sessionId) {
            const created = createSession();
            sessionId = created.id;
            navigate({
                to: "/chat/$chatId",
                params: { chatId: created.id },
                replace: true,
            });
        }
        await send({ sessionId, employeeLogin, text: trimmed });
    };

    const messages = useMemo(() => session?.messages ?? [], [session?.messages]);
    const showEmpty = !session || messages.length === 0;

    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const [atBottom, setAtBottom] = useState(true);

    useLayoutEffect(() => {
        const el = scrollerRef.current;
        if (!el || !atBottom) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length, pending, atBottom]);

    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const threshold = 48;
        const isBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
        setAtBottom(isBottom);
    };

    if (!mounted) {
        return (
            <div className="flex flex-col flex-1 h-full p-8 gap-4 max-w-4xl mx-auto w-full">
                <div className="h-12 w-3/4 bg-muted rounded-xl animate-pulse" />
                <div className="h-20 w-full bg-muted rounded-xl animate-pulse" />
                <div className="h-12 w-1/2 bg-muted rounded-xl animate-pulse self-end" />
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 h-full max-h-full overflow-hidden">
            <div
                ref={scrollerRef}
                onScroll={onScroll}
                className="flex-1 overflow-y-auto"
            >
                <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-8">
                    {showEmpty ? (
                        <ChatEmpty onSuggest={handleSend} disabled={pending} />
                    ) : (
                        <div className="flex flex-col gap-4">
                            {messages.map((m) =>
                                m.role === "user" ? (
                                    <MessageUser key={m.id} message={m} />
                                ) : (
                                    <MessageAssistant
                                        key={m.id}
                                        message={m}
                                    />
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="shrink-0 bg-background pt-2 pb-6">
                <div className="max-w-4xl mx-auto w-full px-4 md:px-6">
                    <ChatInput
                        onSend={handleSend}
                        disabled={pending}
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
}

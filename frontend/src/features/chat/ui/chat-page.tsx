import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    getRouteApi,
    useNavigate,
    useParams,
    Link,
    useMatches,
} from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckBadgeIcon, PlusIcon } from "@heroicons/react/24/solid";

import {
    useCreateRequestApiV1ClientRequestsPost,
    useAddMessageApiV1ClientRequestsRequestIdMessagesPost,
    useGetRequestApiV1ClientRequestsRequestIdGet,
    getListRequestsApiV1ClientRequestsGetQueryKey,
    getGetRequestApiV1ClientRequestsRequestIdGetQueryKey,
} from "@/lib/api/generated/client-requests/client-requests";
import type {
    ClientRequestDetailResponse,
    ClientRequestMessageResponse,
} from "@/lib/api/generated/schemas";
import { customFetch } from "@/lib/api/client";
import { useSnackbar } from "@/hooks/use-snackbar";

const appRoute = getRouteApi("/_app");
import { ChatInput } from "@/features/chat/ui/chat-input";
import { MessageUser } from "@/features/chat/ui/message-user";
import { MessageAssistant } from "@/features/chat/ui/message-assistant";
import { ChatEmpty } from "@/features/chat/ui/chat-empty";

export function ChatPage() {
    const matches = useMatches();
    const isDetail = matches.some((m) => m.routeId === "/_app/chat/$chatId");
    const params = useParams({ strict: false }) as { chatId?: string };
    const routeChatId = isDetail ? params.chatId : undefined;

    if (routeChatId) {
        return <ChatConversation requestId={routeChatId} />;
    }
    return <ChatFirstMessage />;
}

/* ─── /chat — empty state, first message creates the request ─── */

function ChatFirstMessage() {
    const navigate = useNavigate();
    const { showError } = useSnackbar();
    const queryClient = useQueryClient();
    const [optimisticText, setOptimisticText] = useState<string | null>(null);

    const createRequest = useCreateRequestApiV1ClientRequestsPost({
        mutation: {
            onSuccess: (res) => {
                if (res.status === 200) {
                    queryClient.invalidateQueries({
                        queryKey:
                            getListRequestsApiV1ClientRequestsGetQueryKey(),
                    });
                    queryClient.setQueryData(
                        getGetRequestApiV1ClientRequestsRequestIdGetQueryKey(
                            res.data.id,
                        ),
                        res,
                    );
                    navigate({
                        to: "/chat/$chatId",
                        params: { chatId: res.data.id },
                        replace: true,
                    });
                }
            },
            onError: (err) => {
                setOptimisticText(null);
                const message =
                    err instanceof Error
                        ? err.message
                        : "Не удалось создать обращение";
                showError(message);
            },
        },
    });

    const handleSend = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        setOptimisticText(trimmed);
        const title =
            trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
        createRequest.mutate({
            data: {
                title: title || "Новое обращение",
                description: trimmed,
                channel: "web",
            },
        });
    };

    const pending = createRequest.isPending || optimisticText !== null;

    return (
        <ChatLayout
            footer={
                <ChatInput
                    onSend={handleSend}
                    disabled={pending}
                    autoFocus
                />
            }
        >
            {optimisticText ? (
                <div className="flex flex-col gap-4">
                    <MessageUser
                        message={{
                            id: "optimistic",
                            role: "user",
                            text: optimisticText,
                            author_login: null,
                            created_at: new Date().toISOString(),
                        }}
                    />
                    <MessageAssistant pending />
                </div>
            ) : (
                <ChatEmpty onSuggest={handleSend} disabled={pending} />
            )}
        </ChatLayout>
    );
}

/* ─── /chat/$chatId — existing request timeline ─── */

function getAdminAppealConversationQueryKey(requestId: string) {
    return ["admin-appeal-conversation", requestId] as const;
}

function ChatConversation({ requestId }: { requestId: string }) {
    const navigate = useNavigate();
    const { showError } = useSnackbar();
    const queryClient = useQueryClient();
    const [optimisticText, setOptimisticText] = useState<string | null>(null);
    const { role } = appRoute.useRouteContext();
    const viewerIsAdmin = role === "admin";

    const adminConversationQuery = useQuery({
        queryKey: getAdminAppealConversationQueryKey(requestId),
        queryFn: () =>
            customFetch<{
                status: number;
                data: ClientRequestDetailResponse;
            }>(`/api/v1/admin/appeals/${requestId}/conversation`, {
                method: "GET",
            }),
        enabled: viewerIsAdmin && !!requestId,
        staleTime: 15_000,
        retry: false,
    });

    const clientDetailQuery = useGetRequestApiV1ClientRequestsRequestIdGet(
        requestId,
        {
            query: {
                enabled: !viewerIsAdmin && !!requestId,
                staleTime: 15_000,
                retry: false,
            },
        },
    );

    const detailQuery = viewerIsAdmin
        ? adminConversationQuery
        : clientDetailQuery;

    // If the URL id is garbage (deleted / never existed) — bounce back to /chat.
    useEffect(() => {
        if (
            !detailQuery.isLoading &&
            detailQuery.error instanceof Error &&
            detailQuery.error.message.includes("404")
        ) {
            navigate({ to: "/chat", replace: true });
        }
    }, [detailQuery.isLoading, detailQuery.error, navigate]);

    const addMessage = useAddMessageApiV1ClientRequestsRequestIdMessagesPost({
        mutation: {
            onSuccess: (res) => {
                if (res.status === 200) {
                    queryClient.setQueryData(
                        getGetRequestApiV1ClientRequestsRequestIdGetQueryKey(
                            requestId,
                        ),
                        res,
                    );
                    queryClient.invalidateQueries({
                        queryKey:
                            getListRequestsApiV1ClientRequestsGetQueryKey(),
                    });
                    queryClient.invalidateQueries({
                        queryKey: getAdminAppealConversationQueryKey(requestId),
                    });
                }
                setOptimisticText(null);
            },
            onError: (err) => {
                setOptimisticText(null);
                const message =
                    err instanceof Error
                        ? err.message
                        : "Не удалось отправить сообщение";
                showError(message);
            },
        },
    });

    const detail =
        detailQuery.data?.status === 200 ? detailQuery.data.data : undefined;
    const messages = useMemo<ClientRequestMessageResponse[]>(
        () => detail?.messages ?? [],
        [detail?.messages],
    );
    const isClosed = detail?.status === "closed";
    const isResolvedByAssistant = detail?.status !== "closed" && false;
    // Note: assistant-resolved flag isn't in the detail payload; leaving
    // placeholder so we can wire it up later if the backend adds it.
    void isResolvedByAssistant;

    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const [atBottom, setAtBottom] = useState(true);

    useLayoutEffect(() => {
        const el = scrollerRef.current;
        if (!el || !atBottom) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length, optimisticText, atBottom]);

    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const threshold = 48;
        const isBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
        setAtBottom(isBottom);
    };

    const handleSend = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        setOptimisticText(trimmed);
        addMessage.mutate({ requestId, data: { text: trimmed } });
    };

    const pending = addMessage.isPending || optimisticText !== null;

    if (detailQuery.isLoading) {
        return (
            <ChatLayout>
                <div className="flex flex-col gap-3 py-10">
                    <div className="h-12 w-3/4 animate-pulse rounded-xl bg-muted" />
                    <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
                    <div className="h-12 w-1/2 animate-pulse self-end rounded-xl bg-muted" />
                </div>
            </ChatLayout>
        );
    }

    const renderableMessages = messages.filter(
        (m) => m.role === "user" || m.role === "assistant",
    );

    return (
        <ChatLayout
            scrollerRef={scrollerRef}
            onScroll={onScroll}
            footer={
                isClosed ? (
                    <ClosedBanner />
                ) : (
                    <ChatInput
                        onSend={handleSend}
                        disabled={pending}
                        autoFocus
                    />
                )
            }
        >
            {detail?.title && (
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <h1 className="font-heading truncate text-[15px] font-semibold text-foreground">
                        {detail.title}
                    </h1>
                    <StatusBadge status={detail.status} />
                </div>
            )}

            <div className="flex flex-col gap-4">
                {renderableMessages.map((m, idx) =>
                    m.role === "user" ? (
                        <MessageUser key={m.id} message={m} index={idx} />
                    ) : (
                        <MessageAssistant
                            key={m.id}
                            message={m}
                            index={idx}
                        />
                    ),
                )}

                {optimisticText && (
                    <>
                        <MessageUser
                            message={{
                                id: "optimistic",
                                role: "user",
                                text: optimisticText,
                                author_login: null,
                                created_at: new Date().toISOString(),
                            }}
                            index={renderableMessages.length}
                        />
                        <MessageAssistant
                            pending
                            index={renderableMessages.length + 1}
                        />
                    </>
                )}
            </div>
        </ChatLayout>
    );
}

/* ─── Layout helpers ─── */

function ChatLayout({
    children,
    footer,
    scrollerRef,
    onScroll,
}: {
    children: React.ReactNode;
    footer?: React.ReactNode;
    scrollerRef?: React.RefObject<HTMLDivElement | null>;
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}) {
    return (
        <div className="flex h-full max-h-full flex-1 flex-col overflow-hidden">
            <div
                ref={scrollerRef}
                onScroll={onScroll}
                className="flex-1 overflow-y-auto"
            >
                <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
                    {children}
                </div>
            </div>
            {footer ? (
                <div className="shrink-0 bg-background pb-6 pt-2">
                    <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
                        {footer}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function StatusBadge({
    status,
}: {
    status: "open" | "in_progress" | "closed";
}) {
    const map = {
        open: {
            label: "Открыто",
            classes: "bg-amber-400 text-white",
        },
        in_progress: {
            label: "В работе",
            classes: "bg-[var(--brand-dark)] text-white",
        },
        closed: {
            label: "Закрыто",
            classes: "bg-emerald-500 text-white",
        },
    } as const;
    const m = map[status];
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${m.classes}`}
        >
            {m.label}
        </span>
    );
}

function ClosedBanner() {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-cream)]/60 px-5 py-6 text-center">
            <CheckBadgeIcon className="size-7 text-[var(--brand-sage)]" />
            <div className="space-y-1">
                <p className="text-[14px] font-semibold text-[var(--brand-dark)]">
                    Обращение закрыто
                </p>
                <p className="text-[13px] text-[var(--brand-text)]">
                    Спасибо! Если нужен ещё вопрос — начните новый чат.
                </p>
            </div>
            <Link
                to="/chat"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--brand-dark)] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[var(--brand-dark-2)]"
            >
                <PlusIcon className="size-3.5" />
                Начать новый чат
            </Link>
        </div>
    );
}

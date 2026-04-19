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
import { useMutation } from "@tanstack/react-query";
import { CheckBadgeIcon, PlusIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

import {
    useCreateRequestApiV1ClientRequestsPost,
    useAddMessageApiV1ClientRequestsRequestIdMessagesPost,
    useGetRequestApiV1ClientRequestsRequestIdGet,
    getListRequestsApiV1ClientRequestsGetQueryKey,
    getGetRequestApiV1ClientRequestsRequestIdGetQueryKey,
} from "@/lib/api/generated/client-requests/client-requests";
import { getListAppealsApiV1AdminAppealsGetQueryKey } from "@/lib/api/generated/admin-appeals/admin-appeals";
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

type ChatRequestDetail = ClientRequestDetailResponse & {
    csat: number | null;
    assistant_resolved: boolean;
    rating_request_sent: boolean;
    can_self_close: boolean;
    awaiting_csat: boolean;
};

type ClientOcrResponse = {
    text: string;
    mime_type: string;
    file_name?: string | null;
};

type ClientRequestCloseResponse = {
    id: string;
    status: "closed";
    closed_at: string;
    rating_request_sent: boolean;
};

type ClientRequestRatingResponse = {
    id: string;
    csat: number;
};

async function recognizeImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await customFetch<{
        status: number;
        data: ClientOcrResponse;
    }>("/api/v1/client/ocr", {
        method: "POST",
        body: formData,
    });
    return response.data.text;
}

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
    const ocrMutation = useMutation({
        mutationFn: recognizeImage,
    });

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
                    onRecognizeImage={(file) => ocrMutation.mutateAsync(file)}
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
    const { show, showError } = useSnackbar();
    const queryClient = useQueryClient();
    const [optimisticText, setOptimisticText] = useState<string | null>(null);
    const [resolutionExpanded, setResolutionExpanded] = useState(false);
    const [resolutionDismissed, setResolutionDismissed] = useState(false);
    const [selectedScore, setSelectedScore] = useState<number | null>(null);
    const { role } = appRoute.useRouteContext();
    const viewerIsAdmin = role === "admin";

    const adminConversationQuery = useQuery({
        queryKey: getAdminAppealConversationQueryKey(requestId),
        queryFn: () =>
            customFetch<{
                status: number;
                data: ChatRequestDetail;
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
    const addAdminMessage = useMutation({
        mutationFn: (text: string) =>
            customFetch<{
                status: number;
                data: ChatRequestDetail;
            }>(`/api/v1/admin/appeals/${requestId}/messages`, {
                method: "POST",
                body: JSON.stringify({ text }),
            }),
        onSuccess: (res) => {
            if (res.status === 200) {
                queryClient.setQueryData(
                    getAdminAppealConversationQueryKey(requestId),
                    res,
                );
                queryClient.invalidateQueries({
                    queryKey: getListAppealsApiV1AdminAppealsGetQueryKey(),
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
    });
    const ocrMutation = useMutation({
        mutationFn: recognizeImage,
    });
    const closeRequest = useMutation({
        mutationFn: () =>
            customFetch<{
                status: number;
                data: ClientRequestCloseResponse;
            }>(`/api/v1/client/requests/${requestId}/close`, {
                method: "POST",
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: getGetRequestApiV1ClientRequestsRequestIdGetQueryKey(
                    requestId,
                ),
            });
            queryClient.invalidateQueries({
                queryKey: getListRequestsApiV1ClientRequestsGetQueryKey(),
            });
        },
    });
    const submitRating = useMutation({
        mutationFn: (score: number) =>
            customFetch<{
                status: number;
                data: ClientRequestRatingResponse;
            }>(`/api/v1/client/requests/${requestId}/rating`, {
                method: "POST",
                body: JSON.stringify({ score }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: getGetRequestApiV1ClientRequestsRequestIdGetQueryKey(
                    requestId,
                ),
            });
            queryClient.invalidateQueries({
                queryKey: getListRequestsApiV1ClientRequestsGetQueryKey(),
            });
        },
    });

    const detail =
        detailQuery.data?.status === 200
            ? (detailQuery.data.data as ChatRequestDetail)
            : undefined;
    const messages = useMemo<ClientRequestMessageResponse[]>(
        () => detail?.messages ?? [],
        [detail?.messages],
    );
    const isClosed = detail?.status === "closed";

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

    useEffect(() => {
        setSelectedScore(null);
        if (detail?.awaiting_csat) {
            setResolutionExpanded(true);
            setResolutionDismissed(false);
            return;
        }
        if (!detail?.can_self_close) {
            setResolutionExpanded(false);
            setResolutionDismissed(false);
        }
    }, [detail?.awaiting_csat, detail?.can_self_close, requestId]);

    const handleSend = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        setOptimisticText(trimmed);
        if (viewerIsAdmin) {
            addAdminMessage.mutate(trimmed);
            return;
        }
        addMessage.mutate({ requestId, data: { text: trimmed } });
    };

    const handleResolutionSubmit = async () => {
        if (!detail || viewerIsAdmin) return;
        if (selectedScore === null) {
            showError("Поставьте оценку от 1 до 5");
            return;
        }

        try {
            if (!detail.awaiting_csat) {
                await closeRequest.mutateAsync();
            }
            await submitRating.mutateAsync(selectedScore);
            setResolutionExpanded(false);
            setResolutionDismissed(false);
            setSelectedScore(null);
            show("Спасибо за оценку");
        } catch (error) {
            showError(
                error instanceof Error
                    ? error.message
                    : "Не удалось сохранить оценку",
            );
        }
    };

    const pending =
        addMessage.isPending || addAdminMessage.isPending || optimisticText !== null;
    const resolutionPending = closeRequest.isPending || submitRating.isPending;

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
                isClosed && !detail?.awaiting_csat ? (
                    <ClosedBanner />
                ) : !isClosed ? (
                    <ChatInput
                        onSend={handleSend}
                        onRecognizeImage={(file) => ocrMutation.mutateAsync(file)}
                        disabled={pending}
                        autoFocus
                    />
                ) : undefined
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
                )
            }

                {!viewerIsAdmin && detail && (
                    <ResolutionPanel
                        canSelfClose={detail.can_self_close}
                        awaitingCsat={detail.awaiting_csat}
                        dismissed={resolutionDismissed}
                        expanded={resolutionExpanded}
                        score={selectedScore}
                        pending={resolutionPending}
                        onOpen={() => setResolutionExpanded(true)}
                        onDismiss={() => {
                            setResolutionExpanded(false);
                            setResolutionDismissed(true);
                        }}
                        onScoreChange={setSelectedScore}
                        onSubmit={handleResolutionSubmit}
                    />
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

function ResolutionPanel({
    canSelfClose,
    awaitingCsat,
    dismissed,
    expanded,
    score,
    pending,
    onOpen,
    onDismiss,
    onScoreChange,
    onSubmit,
}: {
    canSelfClose: boolean;
    awaitingCsat: boolean;
    dismissed: boolean;
    expanded: boolean;
    score: number | null;
    pending: boolean;
    onOpen: () => void;
    onDismiss: () => void;
    onScoreChange: (value: number) => void;
    onSubmit: () => void;
}) {
    if (!awaitingCsat && (!canSelfClose || dismissed)) {
        return null;
    }

    if (!expanded && !awaitingCsat) {
        return (
            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-cream)]/50 px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[var(--brand-dark)]">
                            Проблема решена?
                        </p>
                        <p className="text-xs text-[var(--brand-text)]">
                            Закройте заявку и сразу поставьте оценку качеству решения.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onOpen}
                            className="rounded-full bg-[var(--brand-dark)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-dark-2)]"
                        >
                            Да, закрыть
                        </button>
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="rounded-full border border-[var(--brand-border)] px-4 py-2 text-sm font-medium text-[var(--brand-text)] transition-colors hover:bg-white"
                        >
                            Еще нужна помощь
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-cream)]/50 px-4 py-4">
            <div className="space-y-3">
                <div>
                    <p className="text-sm font-semibold text-[var(--brand-dark)]">
                        {awaitingCsat
                            ? "Заявка закрыта. Оцените качество решения"
                            : "Оцените решение и закройте заявку"}
                    </p>
                    <p className="text-xs text-[var(--brand-text)]">
                        Оценка попадет в CSAT и поможет понять, насколько полезен ассистент.
                    </p>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            type="button"
                            disabled={pending}
                            onClick={() => onScoreChange(value)}
                            className={cn(
                                "rounded-xl px-3 py-2 text-2xl transition-transform",
                                score !== null && value <= score
                                    ? "text-amber-400"
                                    : "text-slate-300",
                                "disabled:cursor-not-allowed disabled:opacity-50",
                            )}
                        >
                            ★
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={pending}
                        onClick={onSubmit}
                        className="rounded-full bg-[var(--brand-dark)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-dark-2)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {awaitingCsat ? "Отправить оценку" : "Закрыть и отправить"}
                    </button>
                    {!awaitingCsat && (
                        <button
                            type="button"
                            disabled={pending}
                            onClick={onDismiss}
                            className="rounded-full border border-[var(--brand-border)] px-4 py-2 text-sm font-medium text-[var(--brand-text)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Отмена
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

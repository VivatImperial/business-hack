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
import { CheckBadgeIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
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
import {
    ChatInput,
    type ChatInputSubmitPayload,
    type RecognizedOcrAsset,
} from "@/features/chat/ui/chat-input";
import { MessageUser } from "@/features/chat/ui/message-user";
import { MessageAssistant } from "@/features/chat/ui/message-assistant";
import { ChatEmpty } from "@/features/chat/ui/chat-empty";

type MessageCitation = {
    source_type: string;
    source_id: string;
    title?: string | null;
    snippet?: string | null;
};

type SourceReferenceResponse = {
    source_id: string;
    source_type: "ticket" | "article";
    title: string;
    body: string;
    subtitle?: string | null;
    app_url?: string | null;
};

type ChatMessage = ClientRequestMessageResponse & {
    image_url?: string | null;
    image_name?: string | null;
    citations?: MessageCitation[];
};

type ChatRequestDetail = ClientRequestDetailResponse & {
    csat: number | null;
    assistant_resolved: boolean;
    rating_request_sent: boolean;
    can_self_close: boolean;
    awaiting_csat: boolean;
    messages: ChatMessage[];
};

type ClientOcrResponse = RecognizedOcrAsset & {
    mime_type: string;
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

type PendingMessageDraft = {
    text: string;
    image_url?: string;
    image_name?: string | null;
};

async function recognizeImage(file: File): Promise<ClientOcrResponse> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await customFetch<{
        status: number;
        data: ClientOcrResponse;
    }>("/api/v1/client/ocr", {
        method: "POST",
        body: formData,
    });
    return response.data;
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
    const [optimisticDraft, setOptimisticDraft] = useState<PendingMessageDraft | null>(null);
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
                setOptimisticDraft(null);
                const message =
                    err instanceof Error
                        ? err.message
                        : "Не удалось создать обращение";
                showError(message);
            },
        },
    });

    const handleSend = (payload: ChatInputSubmitPayload) => {
        const trimmed = payload.text.trim();
        if (!trimmed) return;
        setOptimisticDraft({
            text: trimmed,
            image_url: payload.imageUrl,
            image_name: payload.imageName,
        });
        const title =
            trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
        createRequest.mutate({
            data: {
                title: title || "Новое обращение",
                description: trimmed,
                channel: "web",
                ocr_upload_key: payload.ocrUploadKey,
            },
        });
    };

    const pending = createRequest.isPending || optimisticDraft !== null;

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
            {optimisticDraft ? (
                <div className="flex flex-col gap-4">
                    <MessageUser
                        message={{
                            id: "optimistic",
                            role: "user",
                            text: optimisticDraft.text,
                            author_login: null,
                            image_url: optimisticDraft.image_url,
                            image_name: optimisticDraft.image_name,
                            created_at: new Date().toISOString(),
                        }}
                    />
                    <MessageAssistant pending />
                </div>
            ) : (
                <ChatEmpty
                    onSuggest={(text) => handleSend({ text })}
                    disabled={pending}
                />
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
    const [optimisticDraft, setOptimisticDraft] = useState<PendingMessageDraft | null>(null);
    const [resolutionExpanded, setResolutionExpanded] = useState(false);
    const [resolutionDismissed, setResolutionDismissed] = useState(false);
    const [selectedScore, setSelectedScore] = useState<number | null>(null);
    const [sourceDialog, setSourceDialog] = useState<SourceReferenceResponse | null>(null);
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
                setOptimisticDraft(null);
            },
            onError: (err) => {
                setOptimisticDraft(null);
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
            setOptimisticDraft(null);
        },
        onError: (err) => {
            setOptimisticDraft(null);
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
    const sourceMutation = useMutation({
        mutationFn: async (citation: MessageCitation) => {
            const response = await customFetch<{
                status: number;
                data: SourceReferenceResponse;
            }>(`/api/v1/admin/appeals/sources/${encodeURIComponent(citation.source_id)}`, {
                method: "GET",
            });
            return response.data;
        },
        onSuccess: (source) => setSourceDialog(source),
        onError: (_error, citation) => {
            if (citation?.snippet) {
                setSourceDialog({
                    source_id: citation.source_id,
                    source_type:
                        citation.source_type === "article" ? "article" : "ticket",
                    title: citation.title || citation.source_id,
                    subtitle: "Сохраненный фрагмент из retrieval-контекста",
                    body: citation.snippet,
                    app_url: null,
                });
                return;
            }
            showError("Не удалось открыть источник");
        },
    });

    const detail =
        detailQuery.data?.status === 200
            ? (detailQuery.data.data as ChatRequestDetail)
            : undefined;
    const messages = useMemo<ChatMessage[]>(
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
    }, [messages.length, optimisticDraft, atBottom]);

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

    const handleSend = (payload: ChatInputSubmitPayload) => {
        const trimmed = payload.text.trim();
        if (!trimmed) return;
        setOptimisticDraft({
            text: trimmed,
            image_url: payload.imageUrl,
            image_name: payload.imageName,
        });
        if (viewerIsAdmin) {
            addAdminMessage.mutate(trimmed);
            return;
        }
        addMessage.mutate({
            requestId,
            data: { text: trimmed, ocr_upload_key: payload.ocrUploadKey },
        });
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

    const handleOpenSource = (citation: MessageCitation) => {
        if (!viewerIsAdmin) {
            return;
        }
        sourceMutation.mutate(citation);
    };

    const pending =
        addMessage.isPending || addAdminMessage.isPending || optimisticDraft !== null;
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
                            onOpenSource={
                                viewerIsAdmin ? handleOpenSource : undefined
                            }
                            sourceLoadingId={
                                sourceMutation.isPending
                                    ? sourceMutation.variables?.source_id
                                    : null
                            }
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

                {optimisticDraft && (
                    <>
                        <MessageUser
                            message={{
                                id: "optimistic",
                                role: "user",
                                text: optimisticDraft.text,
                                author_login: null,
                                image_url: optimisticDraft.image_url,
                                image_name: optimisticDraft.image_name,
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
            {viewerIsAdmin && sourceDialog ? (
                <SourceDialog
                    source={sourceDialog}
                    onClose={() => setSourceDialog(null)}
                />
            ) : null}
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

function SourceDialog({
    source,
    onClose,
}: {
    source: SourceReferenceResponse;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-background shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
                    <div className="min-w-0">
                        <div className="truncate text-lg font-semibold text-foreground">
                            {source.title}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            {source.subtitle || source.source_id}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                        aria-label="Закрыть источник"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                </div>
                <div className="overflow-y-auto px-5 py-4">
                    {source.app_url ? (
                        <div className="mb-4">
                            <Link
                                to={source.app_url}
                                onClick={onClose}
                                className="inline-flex rounded-full border border-[var(--brand-border)] bg-[var(--brand-cream)] px-3 py-1.5 text-sm font-medium text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-cream)]/80"
                            >
                                Открыть связанную заявку
                            </Link>
                        </div>
                    ) : null}
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed text-foreground">
                        {shouldRenderAsMarkdown(source.body) ? (
                            <MarkdownDocument text={source.body} />
                        ) : (
                            <pre className="whitespace-pre-wrap break-words">
                                {source.body}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MarkdownDocument({ text }: { text: string }) {
    const lines = text.split("\n");
    return (
        <div className="space-y-2">
            {lines.map((line, index) => {
                const trimmed = line.trim();
                if (!trimmed) {
                    return <div key={index} className="h-2" />;
                }
                const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
                if (heading) {
                    const level = heading[1].length;
                    const className =
                        level === 1
                            ? "text-xl font-semibold"
                            : level === 2
                              ? "text-lg font-semibold"
                              : "text-base font-semibold";
                    return (
                        <div key={index} className={className}>
                            <InlineMarkdown text={heading[2]} />
                        </div>
                    );
                }
                const unordered = /^[-*]\s+(.*)$/.exec(trimmed);
                if (unordered) {
                    return (
                        <div key={index} className="flex gap-2">
                            <span className="text-muted-foreground">•</span>
                            <div className="min-w-0">
                                <InlineMarkdown text={unordered[1]} />
                            </div>
                        </div>
                    );
                }
                const ordered = /^(\d+)\.\s+(.*)$/.exec(trimmed);
                if (ordered) {
                    return (
                        <div key={index} className="flex gap-2">
                            <span className="shrink-0 text-muted-foreground">
                                {ordered[1]}.
                            </span>
                            <div className="min-w-0">
                                <InlineMarkdown text={ordered[2]} />
                            </div>
                        </div>
                    );
                }
                return (
                    <div key={index} className="whitespace-pre-wrap break-words">
                        <InlineMarkdown text={line} />
                    </div>
                );
            })}
        </div>
    );
}

function shouldRenderAsMarkdown(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) {
        return false;
    }
    return /(^|\n)(#{1,6}\s+|[-*]\s+|\d+\.\s+|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/.test(
        trimmed,
    );
}

function InlineMarkdown({ text }: { text: string }) {
    const pattern = /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*)/g;
    const parts = text.split(pattern);
    return (
        <>
            {parts.map((part, index) => {
                const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
                if (link) {
                    return (
                        <a
                            key={index}
                            href={link[2]}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--brand-accent-deep)] underline underline-offset-2"
                        >
                            {link[1]}
                        </a>
                    );
                }
                const code = /^`([^`]+)`$/.exec(part);
                if (code) {
                    return (
                        <code
                            key={index}
                            className="rounded bg-background px-1 py-0.5 font-mono text-[0.95em]"
                        >
                            {code[1]}
                        </code>
                    );
                }
                const bold = /^\*\*([^*]+)\*\*$/.exec(part);
                if (bold) {
                    return <strong key={index}>{bold[1]}</strong>;
                }
                return <span key={index}>{part}</span>;
            })}
        </>
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

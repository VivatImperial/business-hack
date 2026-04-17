import {
    CheckIcon,
    ClipboardDocumentIcon,
    ArrowTopRightOnSquareIcon,
    HeartIcon,
    ArrowPathIcon,
    PaperAirplaneIcon,
    SparklesIcon,
    HandThumbDownIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import type { LeadRecord } from "@/features/leads/types";
import type { LeadAction } from "@/lib/queries/leads";
import { Badge } from "@/shared/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";
import { Spinner } from "@/shared/ui/spinner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from "@/shared/ui/sheet";

type LeadDetailSheetProps = {
    lead: LeadRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSetInProgress: (leadId: number) => void;
    onSetAction: (leadId: number, action: LeadAction) => void;
};

const STATUS_MAP: Record<
    LeadRecord["status"],
    { label: string; variant: "blue" | "success" | "secondary" | "error" }
> = {
    new: { label: "Новый", variant: "blue" },
    viewed: { label: "Просмотрен", variant: "secondary" },
    in_progress: { label: "В работе", variant: "success" },
    rejected: { label: "Отклонён", variant: "error" },
};

function getActiveAction(lead: LeadRecord): LeadAction | null {
    if (lead.status === "in_progress") return "in_progress";
    if (lead.isFavorite) return "favorite";
    if (lead.status === "rejected") return "rejected";
    return null;
}

export function LeadDetailSheet({
    lead,
    open,
    onOpenChange,
    onSetInProgress,
    onSetAction,
}: LeadDetailSheetProps) {
    const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
    const [mainCopyState, setMainCopyState] = useState<
        "idle" | "loading" | "copied"
    >("idle");

    useEffect(() => {
        setCopyState("idle");
        setMainCopyState("idle");
    }, [lead?.id]);

    if (!lead) return null;

    const status = STATUS_MAP[lead.status];
    const username = lead.telegramUsername?.replace(/^@/, "")?.trim();
    const hasUsername = !!username;
    const telegramLink = hasUsername ? `https://t.me/${username}` : "#";
    const activeAction = getActiveAction(lead);
    const hasOffer = !!lead.suggestedOffer?.trim();
    const hasOriginalMessage = !!lead.originalMessage?.trim();
    const hasSummary = !!lead.summary?.trim();
    const hasAnyAnalysis =
        hasSummary || !!lead.request?.trim() || !!lead.nextStep?.trim();
    const displayName = lead.name?.trim() || username || "Неизвестный";

    const handleCopyOffer = async () => {
        try {
            await navigator.clipboard.writeText(lead.suggestedOffer);
            setCopyState("copied");
            setTimeout(() => setCopyState("idle"), 2500);
        } catch {
            // fallback
        }
    };

    const handleCopyAndOpen = async () => {
        setMainCopyState("loading");
        try {
            await navigator.clipboard.writeText(lead.suggestedOffer);
            setMainCopyState("copied");
            setTimeout(() => {
                if (typeof window !== "undefined") {
                    window.open(telegramLink, "_blank");
                }
                onSetInProgress(lead.id);
            }, 600);
            setTimeout(() => setMainCopyState("idle"), 3000);
        } catch {
            if (typeof window !== "undefined") {
                window.open(telegramLink, "_blank");
            }
            onSetInProgress(lead.id);
            setMainCopyState("idle");
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                hideClose
                className="flex w-full flex-col overflow-hidden p-0 sm:max-w-[520px] sm:rounded-l-[24px] border-l-0 shadow-2xl"
            >
                <SheetTitle className="sr-only">Детали лида</SheetTitle>
                <SheetDescription className="sr-only">
                    Подробная информация о лиде {lead.name}
                </SheetDescription>

                {/* ═══ Header ═══ */}
                <div className="shrink-0 px-6 pt-5 pb-2">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-[16px] font-bold text-foreground/60">
                            {displayName.charAt(0).toUpperCase()}
                        </div>

                        {/* Name + tags */}
                        <div className="min-w-0 flex-1">
                            <span className="block truncate text-[17px] font-bold text-foreground">
                                {hasUsername ? `@${username}` : displayName}
                            </span>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Badge
                                    variant={status.variant}
                                    className="rounded-xl px-2.5 py-0.5 text-[13px]"
                                >
                                    {status.label}
                                </Badge>
                                {lead.tag?.trim() && (
                                    <span className="rounded-xl bg-blue-100 px-2.5 py-0.5 text-[13px] font-bold text-blue-700">
                                        {lead.tag}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Original link */}
                        {lead.sourceUrl?.trim() && (
                            <a
                                href={lead.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                                Оригинал
                                <ArrowTopRightOnSquareIcon className="size-3.5" />
                            </a>
                        )}
                    </div>

                    {/* ── Actions row — right under header ── */}
                    <TooltipProvider>
                        <div className="mt-4 flex items-center gap-2">
                            {(
                                [
                                    {
                                        action: "in_progress" as LeadAction,
                                        icon: (
                                            <ArrowPathIcon className="size-4" style={activeAction === "in_progress" ? { animation: "spin 2s linear infinite" } : undefined} />
                                        ),
                                        label: "В работу",
                                        activeColor: "bg-blue-50 text-blue-500 border-blue-200",
                                    },
                                    {
                                        action: "rejected" as LeadAction,
                                        icon: <HandThumbDownIcon className="size-4" />,
                                        label: "Отклонить",
                                        activeColor: "bg-secondary text-foreground/50 border-border",
                                    },
                                    {
                                        action: "favorite" as LeadAction,
                                        icon: <HeartIcon className="size-4" />,
                                        label: "Избранное",
                                        activeColor: "bg-rose-50 text-rose-500 border-rose-200",
                                    },
                                ] as const
                            ).map((btn) => {
                                const active = activeAction === btn.action;
                                return (
                                    <Tooltip key={btn.action}>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium transition-colors ${
                                                    active
                                                        ? btn.activeColor
                                                        : "border-slate-200 bg-white text-foreground/50 hover:bg-secondary hover:text-foreground"
                                                }`}
                                                onClick={() =>
                                                    onSetAction(
                                                        lead.id,
                                                        active ? "none" : btn.action,
                                                    )
                                                }
                                            >
                                                {btn.icon}
                                                {btn.label}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>{btn.label}</TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </TooltipProvider>
                </div>

                {/* ═══ Scrollable body — hidden scrollbar ═══ */}
                <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex flex-col gap-1 px-6 pb-4">
                        {/* ── Incoming bubble (client message) ── */}
                        <div className="mr-12">
                            <div className="rounded-2xl rounded-tl-md bg-secondary px-4 py-3">
                                <p className="text-[16px] leading-relaxed text-foreground/90">
                                    {hasOriginalMessage ? (
                                        lead.originalMessage
                                    ) : (
                                        <span className="italic text-muted-foreground/50">
                                            &lt;не распаршен&gt;
                                        </span>
                                    )}
                                </p>
                                <div className="mt-1 text-right">
                                    <span className="text-[10.5px] text-muted-foreground/40 tabular-nums">
                                        {formatMessageTime(lead.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── Outgoing bubble (our offer) — only if offer exists ── */}
                        {hasOffer && (
                            <div className="ml-12 mt-1.5">
                                <div className="relative rounded-2xl rounded-tr-md bg-blue-500/8 px-4 py-3">
                                    {/* Copy button inside bubble */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            void handleCopyOffer();
                                        }}
                                        className={`absolute right-2 top-2 flex size-6 items-center justify-center rounded-md transition-all duration-150 ${
                                            copyState === "copied"
                                                ? "bg-emerald-100 text-emerald-600"
                                                : "text-blue-400/50 hover:bg-blue-500/10 hover:text-blue-500"
                                        }`}
                                    >
                                        {copyState === "copied" ? (
                                            <CheckIcon className="size-3" />
                                        ) : (
                                            <ClipboardDocumentIcon className="size-3" />
                                        )}
                                    </button>

                                    <p className="pr-7 text-[16px] leading-relaxed text-foreground/90">
                                        {lead.suggestedOffer}
                                    </p>
                                    <div className="mt-1 flex items-center justify-end gap-1">
                                        <span className="text-[10.5px] text-blue-400/60 tabular-nums">
                                            {formatMessageTime(
                                                lead.createdAt,
                                                1,
                                            )}
                                        </span>
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-blue-400/60"
                                        >
                                            <path d="M18 6L7 17l-5-5" />
                                            <path d="M22 10l-5.5 5.5" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── AI Analysis (compact) — only if any analysis exists ── */}
                        {hasAnyAnalysis && (
                            <div className="mt-4">
                                <div className="flex items-center gap-1.5 mb-2.5">
                                    <SparklesIcon className="size-3.5 text-blue-500" />
                                    <span className="text-[13px] font-medium text-muted-foreground/50">
                                        Анализ ИИ
                                    </span>
                                </div>
                                <div className="rounded-2xl bg-secondary/70 px-4 py-3.5 space-y-2">
                                    {hasSummary && (
                                        <InlineField
                                            label="Кратко"
                                            value={lead.summary}
                                        />
                                    )}
                                    {lead.request?.trim() && (
                                        <InlineField
                                            label="Запрос"
                                            value={lead.request}
                                        />
                                    )}
                                    {lead.nextStep?.trim() && (
                                        <InlineField
                                            label="Следующий шаг"
                                            value={lead.nextStep}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ Sticky footer — CTA only ═══ */}
                <div className="shrink-0 border-t border-black/5 bg-card px-6 py-4">
                    {hasUsername ? (
                        <button
                            type="button"
                            onClick={() => {
                                void handleCopyAndOpen();
                            }}
                            className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white transition-colors ${
                                mainCopyState === "copied"
                                    ? "bg-emerald-500"
                                    : "bg-blue-500 hover:bg-blue-600"
                            }`}
                        >
                            {mainCopyState === "loading" ? (
                                <Spinner className="size-4 animate-spin" />
                            ) : mainCopyState === "copied" ? (
                                <>
                                    <CheckIcon className="size-4" />
                                    Скопировано! Открываю TG...
                                </>
                            ) : (
                                <>
                                    <PaperAirplaneIcon className="size-4" />
                                    Скопировать и написать в Telegram
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-medium text-muted-foreground bg-secondary">
                            Telegram-профиль не найден
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

/** Inline field: "Label: value" on one line to save vertical space */
function InlineField({ label, value }: { label: string; value: string }) {
    return (
        <div className="text-[15px] leading-relaxed">
            <span className="text-muted-foreground/50">{label}:</span>{" "}
            <span className="text-foreground/85">{value}</span>
        </div>
    );
}

function formatMessageTime(dateStr: string, offsetMinutes = 0): string {
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() + offsetMinutes);
    return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

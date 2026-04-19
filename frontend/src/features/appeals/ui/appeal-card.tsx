import {
    ArrowRightIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
    UserCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import type { AppealListItemResponse as GeneratedAppealListItem } from "@/lib/api/generated/schemas";
import { AppealListItemResponseStatus as AppealStatus } from "@/lib/api/generated/schemas";
import {
    PRIORITY_BADGE,
    STATUS_BADGE,
    formatProcessingDuration,
    priorityLabel,
    statusLabel,
} from "@/features/appeals/lib/format";

type AppealListItem = GeneratedAppealListItem & {
    rating_request_sent?: boolean;
};

interface AppealCardProps {
    item: AppealListItem;
    onTake: () => void;
    onClose: () => void;
    onGoToChat: () => void;
    isTaking: boolean;
    isClosing: boolean;
}

export function AppealCard({
    item,
    onTake,
    onClose,
    onGoToChat,
    isTaking,
    isClosing,
}: AppealCardProps) {
    const isOpen = item.status === AppealStatus.open;
    const isClosed = item.status === AppealStatus.closed;

    return (
        <div
            className={cn(
                "group relative rounded-2xl border bg-white p-5 transition-colors md:p-6",
                "border-[var(--brand-border)] hover:border-[var(--brand-sage-deep)]",
                isClosed && "opacity-80",
            )}
        >
            <div className="flex flex-col gap-4">
                {/* Top row: badges */}
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold tracking-wide",
                            item.scope === "assistant"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-slate-100 text-slate-700",
                        )}
                    >
                        {item.scope === "assistant" ? "Ассистент" : "Оператор"}
                    </span>
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold tracking-wide",
                            PRIORITY_BADGE[item.priority],
                        )}
                    >
                        {priorityLabel(item.priority)}
                    </span>
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold tracking-wide",
                            STATUS_BADGE[item.status],
                        )}
                    >
                        {statusLabel(item.status)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-cream)] px-2.5 py-1 text-[12px] font-medium text-[var(--brand-text-dim)]">
                        {item.category || "Без категории"}
                    </span>
                    {item.csat !== null && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-border)] bg-white px-2.5 py-1 text-[12px] font-medium text-[var(--brand-text)]">
                            CSAT
                            <span className="font-semibold text-[var(--brand-ink)]">
                                {item.csat.toFixed(1)}
                            </span>
                        </span>
                    )}
                    {isClosed &&
                        item.csat === null &&
                        item.rating_request_sent && (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700">
                                Ждет оценку
                            </span>
                        )}
                </div>

                {/* Bottom row: employee + actions */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[15px] font-medium text-[var(--brand-ink)]">
                            <UserCircleIcon className="size-4 text-[var(--brand-text-dim)]" />
                            <span className="truncate">
                                {item.employee_login}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[13px] text-[var(--brand-text-dim)]">
                            <ClockIcon className="size-3.5" />
                            <span>
                                {formatProcessingDuration(
                                    item.processing_duration_minutes,
                                )}
                                {isClosed
                                    ? " до закрытия"
                                    : " с момента создания"}
                            </span>
                        </div>
                    </div>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        {!isClosed && (
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isClosing}
                                className="border-[var(--brand-border)] bg-white text-[var(--brand-text)] hover:bg-[var(--brand-cream)]"
                            >
                                Закрыть
                                <XMarkIcon className="size-4" />
                            </Button>
                        )}
                        {isOpen && (
                            <Button
                                onClick={onTake}
                                disabled={isTaking}
                                className="bg-[var(--brand-dark)] text-white hover:bg-[var(--brand-dark-2)]"
                            >
                                Взять в работу
                                <ArrowRightIcon className="size-4" />
                            </Button>
                        )}
                        {!isOpen && !isClosed && (
                            <Button
                                onClick={onGoToChat}
                                className="bg-[var(--brand-dark)] text-white hover:bg-[var(--brand-dark-2)]"
                            >
                                К чату
                                <ChatBubbleLeftRightIcon className="size-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

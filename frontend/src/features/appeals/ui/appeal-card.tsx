import { ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import type { AppealListItemResponse as AppealListItem } from "@/lib/api/generated/schemas";
import { AppealListItemResponseStatus as AppealStatus } from "@/lib/api/generated/schemas";
import {
    PRIORITY_BADGE,
    STATUS_BADGE,
    formatProcessingDuration,
    priorityLabel,
    statusLabel,
} from "@/features/appeals/lib/format";

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
        <div className="group rounded-2xl bg-card p-5 md:p-6 shadow-card transition-shadow hover:shadow-pop">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={cn(
                            "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
                            PRIORITY_BADGE[item.priority],
                        )}
                    >
                        {priorityLabel(item.priority)}
                    </span>
                    <span
                        className={cn(
                            "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
                            STATUS_BADGE[item.status],
                        )}
                    >
                        {statusLabel(item.status)}
                    </span>
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-accent text-accent-foreground">
                        {item.category || "—"}
                    </span>
                    {item.csat !== null && (
                        <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
                            CSAT {item.csat.toFixed(1)}
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-end gap-4 justify-between">
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[15px] font-medium text-foreground truncate">
                            {item.employee_login}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {formatProcessingDuration(
                                item.processing_duration_minutes,
                            )}
                            {isClosed
                                ? " до закрытия"
                                : " с начала запроса"}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {!isClosed && (
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isClosing}
                            >
                                Закрыть обращение
                                <XMarkIcon className="size-4" />
                            </Button>
                        )}
                        {isOpen && (
                            <Button
                                onClick={onTake}
                                disabled={isTaking}
                                className="bg-primary hover:bg-navy-800"
                            >
                                Взять в работу
                                <ArrowRightIcon className="size-4" />
                            </Button>
                        )}
                        {!isOpen && !isClosed && (
                            <Button
                                onClick={onGoToChat}
                                className="bg-primary hover:bg-navy-800"
                            >
                                К чату
                                <ArrowRightIcon className="size-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

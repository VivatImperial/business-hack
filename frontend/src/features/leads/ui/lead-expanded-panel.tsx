import {
    ArrowTopRightOnSquareIcon,
    FlagIcon,
    ChatBubbleOvalLeftIcon,
    StarIcon,
} from "@heroicons/react/24/solid";
import type { ReactNode } from "react";
import type { LeadRecord, RejectReason } from "@/features/leads/types";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";

type LeadExpandedPanelProps = {
    lead: LeadRecord;
    rejectReason: RejectReason;
    onRejectReasonChange: (value: RejectReason) => void;
    onCopyOffer: (offer: string) => void;
    onSetInProgress: (leadId: number) => void;
    onReject: (leadId: number, reason: RejectReason) => void;
    onToggleFavorite: (leadId: number, value?: boolean) => void;
    onReport: (leadId: number) => void;
};

const REJECT_REASON_LABELS: Record<RejectReason, string> = {
    irrelevant: "Нерелевантный",
    duplicate: "Дубликат",
    already_contacted: "Уже связались",
    other: "Другое",
};

export function LeadExpandedPanel({
    lead,
    rejectReason,
    onRejectReasonChange,
    onCopyOffer,
    onSetInProgress,
    onReject,
    onToggleFavorite,
    onReport,
}: LeadExpandedPanelProps) {
    return (
        <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 lg:grid-cols-[2.3fr_1fr]">
            <div className="space-y-4">
                <InfoBlock title="Кратко">{lead.summary}</InfoBlock>
                <InfoBlock title="Запрос">{lead.request}</InfoBlock>
                <InfoBlock title="Оригинал сообщения">
                    <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
                        {lead.originalMessage}
                    </div>
                </InfoBlock>
                <InfoBlock title="Возможный оффер">
                    <div className="flex flex-col gap-2 rounded-md border bg-background p-3">
                        <p className="text-sm">{lead.suggestedOffer}</p>
                        <div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onCopyOffer(lead.suggestedOffer)}
                            >
                                Копировать оффер
                            </Button>
                        </div>
                    </div>
                </InfoBlock>
                <InfoBlock title="Следующий шаг">{lead.nextStep}</InfoBlock>
            </div>

            <div className="flex flex-col gap-3 rounded-md border bg-background p-3">
                <div className="space-y-1 text-sm">
                    <p className="font-medium">Источник</p>
                    <p className="text-muted-foreground">{lead.source}</p>
                    <a
                        href={lead.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                    >
                        Оригинал в Telegram
                        <ArrowTopRightOnSquareIcon className="size-3" />
                    </a>
                </div>

                <div className="space-y-1 text-sm">
                    <p className="font-medium">Пользователь</p>
                    <a
                        href={`https://t.me/${lead.telegramUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:underline"
                    >
                        @{lead.telegramUsername}
                    </a>
                </div>

                <div className="space-y-1 text-sm">
                    <p className="font-medium">Статус</p>
                    <Badge
                        variant={lead.status === "rejected" ? "error" : "blue"}
                    >
                        {getStatusLabel(lead.status)}
                    </Badge>
                </div>

                <div className="mt-2 flex flex-col gap-2">
                    <Button size="sm" onClick={() => onSetInProgress(lead.id)}>
                        <ChatBubbleOvalLeftIcon className="size-4" />
                        Написать в Telegram
                    </Button>

                    <div className="flex gap-2">
                        <select
                            className="h-8 flex-1 rounded-md border bg-background px-2 text-xs"
                            value={rejectReason}
                            onChange={(event) =>
                                onRejectReasonChange(
                                    event.target.value as RejectReason,
                                )
                            }
                        >
                            {Object.entries(REJECT_REASON_LABELS).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReject(lead.id, rejectReason)}
                        >
                            Отклонить
                        </Button>
                    </div>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onToggleFavorite(lead.id)}
                    >
                        {lead.isFavorite ? (
                            <StarIcon className="size-4" />
                        ) : (
                            <StarIcon className="size-4" />
                        )}
                        {lead.isFavorite
                            ? "Убрать из избранного"
                            : "В избранное"}
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        className="justify-start text-muted-foreground"
                        onClick={() => onReport(lead.id)}
                    >
                        <FlagIcon className="size-4" />
                        Пожаловаться
                    </Button>
                </div>
            </div>
        </div>
    );
}

function InfoBlock({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-sm font-medium">{title}</p>
            <div className="text-sm text-muted-foreground">{children}</div>
        </div>
    );
}

function getStatusLabel(status: LeadRecord["status"]): string {
    if (status === "new") return "Новый";
    if (status === "viewed") return "Просмотрен";
    if (status === "in_progress") return "В работе";
    return "Отклонён";
}

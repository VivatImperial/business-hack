import {
    AppealListItemResponsePriority as AppealPriority,
    AppealListItemResponseStatus as AppealStatus,
} from "@/lib/api/generated/schemas";

/**
 * Flat, high-contrast badge classes — no soft tints, solid bg + white text.
 * Matches the bright chat-status bubbles so the whole admin reads consistent.
 */
export const PRIORITY_BADGE: Record<AppealPriority, string> = {
    p1: "bg-rose-500 text-white",
    p2: "bg-amber-500 text-white",
    p3: "bg-[var(--brand-accent)] text-white",
    p4: "bg-emerald-500 text-white",
};

export const STATUS_BADGE: Record<AppealStatus, string> = {
    open: "bg-amber-400 text-white",
    in_progress: "bg-[var(--brand-dark)] text-white",
    closed: "bg-emerald-500 text-white",
};

export function priorityLabel(priority: AppealPriority): string {
    switch (priority) {
        case AppealPriority.p1:
            return "Критично";
        case AppealPriority.p2:
            return "Высокий";
        case AppealPriority.p3:
            return "Средне";
        case AppealPriority.p4:
            return "Низкий";
        default:
            return "Неизвестно";
    }
}

export function statusLabel(status: AppealStatus): string {
    switch (status) {
        case AppealStatus.open:
            return "Открыто";
        case AppealStatus.in_progress:
            return "В работе";
        case AppealStatus.closed:
            return "Закрыто";
        default:
            return "Неизвестно";
    }
}

export function formatProcessingDuration(minutes: number): string {
    if (minutes < 1) return "меньше минуты";
    if (minutes < 60) return `${Math.round(minutes)} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours < 24) return `${hours} ч ${mins} мин`;
    const days = Math.floor(hours / 24);
    return `${days} д ${hours % 24} ч`;
}

import {
    AppealListItemResponsePriority as AppealPriority,
    AppealListItemResponseStatus as AppealStatus,
} from "@/lib/api/generated/schemas";

export const PRIORITY_BADGE: Record<AppealPriority, string> = {
    p1: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
    p2: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    p3: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    p4: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

export const STATUS_BADGE: Record<AppealStatus, string> = {
    open: "bg-navy-50 text-primary ring-1 ring-inset ring-navy-200",
    in_progress: "bg-navy-50 text-primary ring-1 ring-inset ring-navy-200",
    closed: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
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
    if (minutes < 60) return `${Math.round(minutes)} мин.`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours < 24) return `${hours} ч. ${mins} мин.`;
    const days = Math.floor(hours / 24);
    return `${days} д. ${hours % 24} ч.`;
}

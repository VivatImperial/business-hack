import type {
    AdminClientLifecycleSummary,
    AdminHealthCheckSummary,
} from "@/lib/queries/admin";

function sessionTone(status: string) {
    if (status === "backoff" || status === "paused") {
        return "border-amber-200 bg-amber-100 text-foreground dark:border-amber-800/60 dark:bg-amber-950/40";
    }
    if (status === "leased") {
        return "border-sky-200 bg-sky-100 text-foreground dark:border-sky-800/60 dark:bg-sky-950/40";
    }
    if (status === "healthy") {
        return "border-border bg-secondary/80 text-muted-foreground";
    }
    return "border-border bg-secondary/80 text-muted-foreground";
}

export function SessionStatusBadge({
    status,
    label,
}: {
    status: string;
    label: string;
}) {
    return (
        <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${sessionTone(status)}`}
        >
            {label}
        </span>
    );
}

function isHealthFailure(status: string) {
    return status === "critical" || status === "error";
}

import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/solid";

export function HealthCheckBadge({ item }: { item: AdminHealthCheckSummary }) {
    const failed = isHealthFailure(item.status);
    const isWarning = item.status === "warning";
    const isInfo = item.status === "info";

    const tone = failed
        ? "border-red-200 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200"
        : isWarning
          ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
          : isInfo
            ? "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-100"
            : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200";

    const Icon = failed
        ? XCircleIcon
        : isWarning
          ? ExclamationTriangleIcon
          : isInfo
            ? InformationCircleIcon
            : CheckCircleIcon;

    const iconColor = failed
        ? "text-red-600 dark:text-red-500"
        : isWarning
          ? "text-amber-600 dark:text-amber-500"
          : isInfo
            ? "text-sky-600 dark:text-sky-500"
            : "text-emerald-600 dark:text-emerald-500";

    return (
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${tone}`}>
            <Icon className={`size-5 shrink-0 ${iconColor}`} />
            <div className="flex flex-col">
                <div className="text-[13px] font-semibold tracking-tight">
                    {item.label}
                </div>
                <div className="mt-0.5 text-[12px] leading-relaxed opacity-90">
                    {item.detail || "ok"}
                </div>
            </div>
        </div>
    );
}

function lifecycleTone(lifecycle: AdminClientLifecycleSummary) {
    if (lifecycle.status === "destination_missing") {
        return "border-red-200 bg-red-100 text-foreground dark:border-red-800/60 dark:bg-red-950/40";
    }
    if (
        lifecycle.status === "quota_exhausted" ||
        lifecycle.status === "backoff"
    ) {
        return "border-amber-200 bg-amber-100 text-foreground dark:border-amber-800/60 dark:bg-amber-950/40";
    }
    if (lifecycle.status === "scanning") {
        return "border-border bg-secondary/80 text-muted-foreground";
    }
    return "border-border bg-secondary/80 text-muted-foreground";
}

export function LifecycleStatusBadge({
    lifecycle,
}: {
    lifecycle: AdminClientLifecycleSummary;
}) {
    return (
        <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${lifecycleTone(lifecycle)}`}
        >
            {lifecycle.label}
        </span>
    );
}

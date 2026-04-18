import type { ReactNode } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/solid";

import { Skeleton } from "@/shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import type { DashboardSummaryResponseHealth as HealthStatus } from "@/lib/api/generated/schemas";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    hint: string;
    value: ReactNode;
    loading?: boolean;
}

export function StatCard({ title, hint, value, loading }: StatCardProps) {
    return (
        <div
            className={cn(
                "flex min-h-[160px] flex-col gap-3 rounded-2xl border p-6",
                "border-[var(--brand-border)] bg-white",
                "hover:border-[var(--brand-sage-deep)]",
            )}
        >
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--brand-text-dim)]">
                <span>{title}</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className="text-[var(--brand-text-dim)]/60  hover:text-[var(--brand-text-dim)]"
                            aria-label="Подсказка"
                        >
                            <InformationCircleIcon className="size-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>{hint}</TooltipContent>
                </Tooltip>
            </div>

            <div className="flex flex-1 items-center text-[32px] font-semibold leading-tight tracking-tight text-[var(--brand-ink)]">
                {loading ? <Skeleton className="h-9 w-24" /> : value}
            </div>

            <div className="text-[12px] text-[var(--brand-text-dim)]">
                {hint}
            </div>
        </div>
    );
}

interface HealthIndicatorProps {
    status: HealthStatus;
}

const HEALTH_MAP: Record<
    HealthStatus,
    { color: string; pulse: boolean; ring: string }
> = {
    healthy: {
        color: "bg-emerald-500",
        ring: "bg-emerald-400/40",
        pulse: true,
    },
    degraded: {
        color: "bg-amber-500",
        ring: "bg-amber-400/40",
        pulse: false,
    },
    down: { color: "bg-rose-500", ring: "bg-rose-400/40", pulse: false },
};

export function HealthIndicator({ status }: HealthIndicatorProps) {
    const info = HEALTH_MAP[status];
    return (
        <span className="relative flex size-3 items-center justify-center">
            {info.pulse && (
                <span
                    className={cn(
                        "absolute inline-flex h-full w-full animate-ping rounded-full",
                        info.ring,
                    )}
                />
            )}
            <span
                className={cn(
                    "relative inline-flex size-3 rounded-full shadow-[0_0_0_3px_var(--card)]",
                    info.color,
                )}
            />
        </span>
    );
}

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
        <div className="rounded-2xl bg-card p-6 shadow-card flex flex-col gap-3 min-h-[168px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{title}</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                            <InformationCircleIcon className="size-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>{hint}</TooltipContent>
                </Tooltip>
            </div>
            <div className="text-[32px] font-semibold text-foreground leading-tight flex-1 flex items-center">
                {loading ? <Skeleton className="h-9 w-24" /> : value}
            </div>
            <div className="text-[13px] text-muted-foreground">{hint}</div>
        </div>
    );
}

interface HealthIndicatorProps {
    status: HealthStatus;
}

const HEALTH_MAP: Record<HealthStatus, { color: string; pulse: boolean }> = {
    healthy: { color: "bg-emerald-500", pulse: true },
    degraded: { color: "bg-amber-500", pulse: false },
    down: { color: "bg-red-500", pulse: false },
};

export function HealthIndicator({ status }: HealthIndicatorProps) {
    const info = HEALTH_MAP[status];
    return (
        <span
            className={cn(
                "inline-block size-2.5 rounded-full",
                info.color,
                info.pulse && "animate-soft-pulse",
            )}
        />
    );
}

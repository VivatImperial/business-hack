import React from "react";
import {
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { motion } from "@/shared/animations/motion";

export function DashboardCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl bg-card p-5 border border-gray-200">
            <h3 className="font-heading text-[14px] font-bold text-foreground tracking-tight mb-3.5">
                {title}
            </h3>
            {children}
        </div>
    );
}

export function KpiCard({
    title,
    value,
    delta,
}: {
    title: string;
    value: string | number;
    delta: number;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between rounded-2xl bg-card p-4 border border-gray-200 h-full">
            <div className="flex flex-col">
                <span className="text-[16px] font-medium">{title}</span>
                <DeltaBadge delta={delta} className="mt-1.5" />
            </div>
            <div className="font-heading text-[21px] font-extrabold leading-none pr-4 tracking-tight text-foreground">
                {value}
            </div>
        </div>
    );
}

export function LimitsCard({
    value,
    total,
    delta,
}: {
    value: number;
    total: number;
    percent?: number;
    delta: number;
}) {
    return (
        <div className="flex items-center justify-between rounded-2xl bg-card p-4 border border-gray-200 h-full">
            <div className="flex flex-col">
                <span className="text-[16px] font-medium">Баланс</span>
                <DeltaBadge delta={delta} className="mt-1.5" />
            </div>
            <div className="flex flex-col items-end leading-none pr-1">
                <span className="font-heading text-[21px] font-extrabold tracking-tight text-foreground">
                    {value.toLocaleString("ru-RU")}
                </span>
                <span className="text-[13px] text-muted-foreground font-medium mt-1">
                    {total.toLocaleString("ru-RU")}
                </span>
            </div>
        </div>
    );
}

export function DeltaBadge({
    delta,
    className,
}: {
    delta: number;
    className?: string;
}) {
    const isPositive = delta >= 0;
    return (
        <span
            className={`inline-flex items-center gap-0.5 rounded-xl px-1.5 py-0.5 text-[12px] font-bold w-fit ${
                isPositive ? " text-emerald-500" : " text-red-400"
            } ${className ?? ""}`}
        >
            {isPositive ? (
                <ArrowTrendingUpIcon className="h-3 w-3" />
            ) : (
                <ArrowTrendingDownIcon className="h-3 w-3" />
            )}
            {Math.abs(delta)}%
        </span>
    );
}

export function FunnelStep({
    label,
    value,
    max,
    color,
    hint,
    convPercent,
}: {
    label: string;
    value: number;
    max: number;
    color: string;
    hint?: string;
    convPercent?: string;
}) {
    const percent = max > 0 ? (Math.log1p(value) / Math.log1p(max)) * 100 : 0;
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground font-medium flex items-center gap-1">
                    {label}
                    {hint && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <InformationCircleIcon className="size-3.5 text-muted-foreground/40 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                className="max-w-[220px] text-[12px]"
                            >
                                {hint}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </span>
                {convPercent && (
                    <div className="flex items-center gap-1">
                        <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                            className="text-muted-foreground/30"
                        >
                            <path
                                d="M6 2v8M3 7l3 3 3-3"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="text-[11px] font-bold text-blue-500">
                            {convPercent}%
                        </span>
                    </div>
                )}
            </div>
            <div className="h-7 bg-secondary rounded-xl overflow-hidden">
                <motion.div
                    className="h-full rounded-xl flex items-center px-2.5"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(percent, 12)}%` }}
                    transition={{
                        duration: 0.6,
                        ease: [0.25, 0.1, 0.25, 1],
                    }}
                >
                    <span className="text-[11px] font-bold text-white whitespace-nowrap">
                        {formatCompact(value)}
                    </span>
                </motion.div>
            </div>
        </div>
    );
}

export function formatCompact(num: number): string {
    if (num >= 1_000_000)
        return `${(num / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return num.toString();
}

import {
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from "@heroicons/react/24/solid";

export function MobileKpiCard({
    title,
    value,
    delta,
}: {
    title: string;
    value: string | number;
    delta: number;
    color?: string;
}) {
    return (
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5">
            <span className="text-[13px] font-medium text-muted-foreground">
                {title}
            </span>
            <div className="mt-2 font-heading text-[26px] font-extrabold leading-none tracking-tight text-foreground">
                {value}
            </div>
            <div className="mt-2">
                <DeltaBadge delta={delta} />
            </div>
        </div>
    );
}

export function MobileLimitsCard({
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
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5">
            <span className="text-[13px] font-medium text-muted-foreground">
                Баланс
            </span>
            <div className="mt-2 flex flex-col leading-none">
                <span className="font-heading text-[26px] font-extrabold tracking-tight text-foreground">
                    {value.toLocaleString("ru-RU")}
                </span>
                <span className="text-[13px] text-muted-foreground font-medium mt-1">
                    {total.toLocaleString("ru-RU")}
                </span>
            </div>
            <div className="mt-2 flex justify-end">
                <DeltaBadge delta={delta} />
            </div>
        </div>
    );
}

export function DeltaBadge({ delta }: { delta: number }) {
    const isPositive = delta >= 0;
    return (
        <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                isPositive
                    ? "bg-emerald-500/8 text-emerald-500"
                    : "bg-red-500/8 text-red-400"
            }`}
        >
            {isPositive ? (
                <ArrowTrendingUpIcon className="h-2.5 w-2.5" />
            ) : (
                <ArrowTrendingDownIcon className="h-2.5 w-2.5" />
            )}
            {Math.abs(delta)}%
        </span>
    );
}

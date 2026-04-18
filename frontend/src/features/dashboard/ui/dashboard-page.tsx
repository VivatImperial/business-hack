import { useMemo } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartBarIcon } from "@heroicons/react/24/solid";

import {
    useSummaryApiV1AdminDashboardSummaryGet as useGetDashboardSummary,
    useMessagesTimeseriesApiV1AdminDashboardMessagesTimeseriesGet as useGetMessagesTimeseries,
} from "@/lib/api/generated/admin-dashboard/admin-dashboard";
import type { MessagesTimeseriesResponsePeriod as Period } from "@/lib/api/generated/schemas/messagesTimeseriesResponsePeriod";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/lib/utils";
import {
    HealthIndicator,
    StatCard,
} from "@/features/dashboard/ui/dashboard-components";
import { Route as DashboardRoute } from "@/routes/_app.dashboard";
import { motion, staggerContainerDelayed } from "@/shared/animations/motion";

const PERIOD_LABELS: Record<string, string> = {
    "1h": "1ч",
    "6h": "6ч",
    "24h": "24ч",
    "7d": "7д",
    "30d": "30д",
    "90d": "90д",
};

const PERIOD_ORDER: Period[] = ["1h", "6h", "24h", "7d", "30d", "90d"];

function isPeriod(value: string | undefined): value is Period {
    return (
        value === "1h" ||
        value === "6h" ||
        value === "24h" ||
        value === "7d" ||
        value === "30d" ||
        value === "90d"
    );
}

function formatDuration(minutes: number): string {
    if (!Number.isFinite(minutes)) return "—";
    if (minutes < 60) return `${Math.round(minutes)} мин`;
    const hours = minutes / 60;
    return `${hours.toFixed(1)} ч`;
}

function formatRate(rate: number): string {
    return `${Math.round(rate * 100)}%`;
}

function healthLabel(status: "healthy" | "degraded" | "down"): string {
    if (status === "healthy") return "Работает";
    if (status === "degraded") return "Нестабильно";
    return "Недоступен";
}

export function DashboardPage() {
    const search = DashboardRoute.useSearch();
    const navigate = DashboardRoute.useNavigate();
    const period: Period = isPeriod(search.period) ? search.period : "24h";

    const summaryQuery = useGetDashboardSummary({ period });
    const tsQuery = useGetMessagesTimeseries({ period });

    const summary =
        summaryQuery.data?.status === 200 ? summaryQuery.data.data : undefined;
    const timeseries =
        tsQuery.data?.status === 200 ? tsQuery.data.data : undefined;

    const chartData = useMemo(() => {
        if (!timeseries) return [];
        return timeseries.points.map((p) => ({
            ts: p.ts,
            messages_count: p.messages_count,
            label: new Date(p.ts).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        }));
    }, [timeseries]);

    const setPeriod = (next: Period) => {
        navigate({ search: { period: next }, replace: true });
    };

    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 p-6 md:p-10">
            {/* Header */}
            <header className="flex flex-col gap-1">
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-[var(--brand-ink)] md:text-[34px]">
                    Дашборд
                </h1>
            </header>

            {/* Stat cards */}
            <motion.section
                variants={staggerContainerDelayed(0.04, 0)}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-4"
            >
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-text-dim)]">
                    Состояние платформы
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <StatCard
                        title="Статус"
                        hint="Общий статус платформы и ассистента"
                        loading={summaryQuery.isLoading}
                        value={
                            <div className="flex items-center gap-2">
                                {summary && (
                                    <HealthIndicator status={summary.health} />
                                )}
                                <span>
                                    {summary
                                        ? healthLabel(summary.health)
                                        : "—"}
                                </span>
                            </div>
                        }
                    />
                    <StatCard
                        title="Открытые обращения"
                        hint="Заявки в статусе «Открыто»"
                        loading={summaryQuery.isLoading}
                        value={summary?.open_appeals_count ?? "—"}
                    />
                    <StatCard
                        title="Обращения в работе"
                        hint="Взятые оператором в обработку"
                        loading={summaryQuery.isLoading}
                        value={summary?.in_progress_appeals_count ?? "—"}
                    />
                    <StatCard
                        title="Доля ассистента"
                        hint="Доля обращений, которые закрыл ассистент без оператора"
                        loading={summaryQuery.isLoading}
                        value={
                            summary
                                ? formatRate(summary.assistant_resolution_rate)
                                : "—"
                        }
                    />
                    <StatCard
                        title="Время решения"
                        hint="Среднее время от создания до закрытия"
                        loading={summaryQuery.isLoading}
                        value={
                            summary
                                ? formatDuration(summary.avg_resolution_minutes)
                                : "—"
                        }
                    />
                    <StatCard
                        title="CSAT"
                        hint="Среднее пользовательское удовлетворение (1–5)"
                        loading={summaryQuery.isLoading}
                        value={
                            summary?.csat_avg !== null &&
                            summary?.csat_avg !== undefined
                                ? summary.csat_avg.toFixed(1)
                                : "—"
                        }
                    />
                </div>
            </motion.section>

            {/* Chart */}
            <section className="rounded-2xl border border-[var(--brand-border)] bg-white p-6 md:p-7">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="font-heading text-[18px] font-semibold tracking-tight text-[var(--brand-ink)]">
                            Обработка обращений
                        </h2>
                        <p className="mt-1 text-[13px] text-[var(--brand-text-dim)]">
                            Всего за период:{" "}
                            {timeseries ? (
                                <span className="font-semibold text-[var(--brand-ink)]">
                                    {timeseries.total_messages}
                                </span>
                            ) : (
                                "—"
                            )}
                        </p>
                    </div>
                    <PeriodSwitcher
                        value={period}
                        options={PERIOD_ORDER}
                        onChange={setPeriod}
                    />
                </div>

                <div className="h-[320px]">
                    {tsQuery.isLoading ? (
                        <Skeleton className="h-full w-full rounded-xl" />
                    ) : chartData.length === 0 ? (
                        <ChartEmpty />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="msgGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#3361ff"
                                            stopOpacity={0.35}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#3361ff"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5ebf3"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="label"
                                    stroke="#8892ab"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#8892ab"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    width={28}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        background: "#ffffff",
                                        border: "1px solid #d5dce8",
                                        borderRadius: 10,
                                        fontSize: 12,
                                        padding: "8px 10px",
                                    }}
                                    labelStyle={{
                                        color: "#5a6378",
                                        marginBottom: 4,
                                    }}
                                    cursor={{
                                        stroke: "#c5d1ff",
                                        strokeWidth: 1.5,
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="messages_count"
                                    stroke="#3361ff"
                                    strokeWidth={2.5}
                                    fill="url(#msgGradient)"
                                    animationDuration={600}
                                    dot={false}
                                    activeDot={{
                                        r: 5,
                                        fill: "#3361ff",
                                        stroke: "#ffffff",
                                        strokeWidth: 2,
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>
        </div>
    );
}

/* ─── Sub-components ─── */

interface PeriodSwitcherProps {
    value: Period;
    options: Period[];
    onChange: (next: Period) => void;
}

function PeriodSwitcher({ value, options, onChange }: PeriodSwitcherProps) {
    return (
        <div className="relative inline-flex items-center gap-1 rounded-xl border border-[var(--brand-border)] bg-white p-1">
            {options.map((p) => {
                const isActive = value === p;
                return (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onChange(p)}
                        className={cn(
                            "relative z-10 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                            isActive
                                ? "text-white"
                                : "text-[var(--brand-text-dim)] hover:text-[var(--brand-ink)]",
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="dashboard-period"
                                className="absolute inset-0 -z-10 rounded-lg bg-[var(--brand-dark)]"
                                transition={{
                                    type: "spring",
                                    bounce: 0.18,
                                    duration: 0.45,
                                }}
                            />
                        )}
                        {PERIOD_LABELS[p]}
                    </button>
                );
            })}
        </div>
    );
}

function ChartEmpty() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-cream)] text-center">
            <ChartBarIcon className="size-8 text-[var(--brand-text-dim)]/40" />
            <p className="text-[14px] font-medium text-[var(--brand-text-dim)]">
                Нет данных за выбранный период
            </p>
            <p className="text-[12px] text-[var(--brand-text-dim)]/70">
                Попробуйте увеличить диапазон сверху
            </p>
        </div>
    );
}

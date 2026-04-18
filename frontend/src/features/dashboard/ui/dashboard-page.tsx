import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from "recharts";

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
    if (minutes < 60) return `${Math.round(minutes)} мин.`;
    const hours = minutes / 60;
    return `${hours.toFixed(1)} ч.`;
}

function formatRate(rate: number): string {
    return `${Math.round(rate * 100)}%`;
}

export function DashboardPage() {
    const search = DashboardRoute.useSearch();
    const navigate = DashboardRoute.useNavigate();
    const period: Period = isPeriod(search.period) ? search.period : "7d";

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
        <div className="flex flex-col gap-8 p-6 md:p-10 max-w-[1400px] w-full mx-auto animate-fade-in-up">
            <section className="flex flex-col gap-4">
                <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
                    Состояние платформы
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Статус"
                        hint="Общий статус платформы"
                        loading={summaryQuery.isLoading}
                        value={
                            <div className="flex items-center gap-2 capitalize">
                                {summary && (
                                    <HealthIndicator status={summary.health} />
                                )}
                                <span className="text-foreground">
                                    {summary ? healthLabel(summary.health) : ""}
                                </span>
                            </div>
                        }
                    />
                    <StatCard
                        title="Обращений"
                        hint="Кол-во открытых заявок"
                        loading={summaryQuery.isLoading}
                        value={summary?.open_appeals_count ?? "—"}
                    />
                    <StatCard
                        title="Обращений в работе"
                        hint="Кол-во заявок в работе"
                        loading={summaryQuery.isLoading}
                        value={summary?.in_progress_appeals_count ?? "—"}
                    />
                    <StatCard
                        title="Доля ассистента"
                        hint="Доля закрытых заявок ассистентом"
                        loading={summaryQuery.isLoading}
                        value={
                            summary
                                ? formatRate(summary.assistant_resolution_rate)
                                : "—"
                        }
                    />
                    <StatCard
                        title="Время решения"
                        hint="Ср. время решения обращений"
                        loading={summaryQuery.isLoading}
                        value={
                            summary
                                ? formatDuration(summary.avg_resolution_minutes)
                                : "—"
                        }
                    />
                    <StatCard
                        title="CSAT"
                        hint="Индекс удовлетворённости ответами"
                        loading={summaryQuery.isLoading}
                        value={
                            summary?.csat_avg !== null &&
                            summary?.csat_avg !== undefined
                                ? summary.csat_avg.toFixed(1)
                                : "—"
                        }
                    />
                </div>
            </section>

            <section className="rounded-2xl bg-card p-6 md:p-7 shadow-card">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            Обработка обращений
                        </h3>
                        {timeseries && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Всего за период: {timeseries.total_messages}
                            </p>
                        )}
                    </div>
                    <div className="inline-flex items-center gap-1 p-1 bg-card rounded-xl ring-1 ring-border shadow-sm relative">
                        {PERIOD_ORDER.map((p) => {
                            const isActive = period === p;
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPeriod(p)}
                                    className={cn(
                                        "relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors z-10",
                                        isActive
                                            ? "text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="dashboard-period"
                                            className="absolute inset-0 bg-primary rounded-lg -z-10"
                                            transition={{
                                                type: "spring",
                                                bounce: 0.2,
                                                duration: 0.6,
                                            }}
                                        />
                                    )}
                                    {PERIOD_LABELS[p]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-[320px]">
                    {tsQuery.isLoading ? (
                        <Skeleton className="h-full w-full rounded-xl" />
                    ) : chartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            Нет данных за выбранный период
                        </div>
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
                                            stopColor="#152b52"
                                            stopOpacity={0.25}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#152b52"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e3e7ed"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="label"
                                    stroke="#9aa3b3"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9aa3b3"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    width={28}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        background: "#ffffff",
                                        border: "1px solid #e3e7ed",
                                        borderRadius: 8,
                                        boxShadow:
                                            "0 4px 12px rgba(21,43,82,0.08)",
                                        fontSize: 12,
                                    }}
                                    labelStyle={{
                                        color: "#6b7584",
                                        marginBottom: 4,
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="messages_count"
                                    stroke="#152b52"
                                    strokeWidth={2}
                                    fill="url(#msgGradient)"
                                    animationDuration={600}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>
        </div>
    );
}

function healthLabel(status: "healthy" | "degraded" | "down"): string {
    if (status === "healthy") return "Healthy";
    if (status === "degraded") return "Degraded";
    return "Down";
}

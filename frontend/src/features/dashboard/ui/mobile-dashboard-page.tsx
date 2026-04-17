import { ArrowRightIcon } from "@heroicons/react/24/solid";
import {
    Area,
    AreaChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { dashboardQueries } from "@/lib/queries/dashboard";
import { leadsQueries } from "@/lib/queries/leads";
import { motion, AnimatePresence } from "@/shared/animations/motion";
import { PERIOD_PRESETS } from "@/lib/constants";
import { getTagColor } from "@/features/dashboard/lib/dashboard-utils";
import { MobileKpiCard, MobileLimitsCard } from "./mobile-dashboard-components";
import { FunnelStep } from "./dashboard-components";
import { Spinner } from "@/shared/ui/spinner";

type DashboardData = {
    kpi: {
        leadsFound: { value: number; delta: number };
        messagesProcessed: { value: number; delta: number };
        conversionRate: { value: number; delta: number };
        limitsUsed: { value: number; delta: number; total: number };
    };
    chartData: Array<{ date: string; leads: number; messages: number }>;
    tagDistribution: Array<{ tag: string; count: number; color: string }>;
};

export function MobileDashboardPage({ tenantId }: { tenantId: number }) {
    const [activePeriod, setActivePeriod] = useState("7d");
    const [chartsReady, setChartsReady] = useState(false);

    const {
        data: dataRaw,
        isFetching,
        isPending,
        isError,
        refetch,
    } = useQuery(dashboardQueries.stats(tenantId, activePeriod));
    const data = dataRaw as DashboardData | undefined;

    const { data: todayLeadsData, isLoading: leadsLoading } = useQuery(
        leadsQueries.list(tenantId, { pageSize: 1, period: "today" }),
    );
    const todayCounts = (todayLeadsData as { counts?: Record<string, number> })
        ?.counts;
    const pendingLeads = todayCounts
        ? (todayCounts.new ?? 0) + (todayCounts.viewed ?? 0)
        : 0;

    const { data: periodLeadsData } = useQuery(
        leadsQueries.list(tenantId, {
            pageSize: 1,
            period: activePeriod as "today" | "7d" | "30d" | "90d" | "all",
        }),
    );
    const periodCounts = (
        periodLeadsData as { counts?: Record<string, number> }
    )?.counts;

    const groupedChartData = useMemo(() => {
        if (!data?.chartData || data.chartData.length === 0) return [];
        return data.chartData;
    }, [data?.chartData]);

    useEffect(() => {
        setChartsReady(true);
    }, []);

    if (isPending) {
        return (
            <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
                Загружаем статистику...
            </div>
        );
    }

    if (isError || !data?.kpi) {
        return (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-muted-foreground">
                    Не удалось загрузить статистику.
                </p>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="rounded-xl border px-3 py-2 text-sm"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    const limitsPercent = data.kpi?.limitsUsed?.total
        ? Math.round(
              (data.kpi.limitsUsed.value / data.kpi.limitsUsed.total) * 100,
          )
        : 0;

    const statusCounts = {
        new: (periodCounts?.new ?? 0) + (periodCounts?.viewed ?? 0),
        in_progress: periodCounts?.in_progress ?? 0,
        rejected: periodCounts?.rejected ?? 0,
        favorites: periodCounts?.favorites ?? 0,
    };
    const statusMax = Math.max(
        statusCounts.new,
        statusCounts.in_progress,
        statusCounts.rejected,
        statusCounts.favorites,
        1,
    );
    const tagDistribution = data.tagDistribution ?? [];
    const tagTotal = tagDistribution.reduce((s, t) => s + t.count, 0);

    return (
        <div className="flex flex-col gap-2.5">
            {/* Loading */}
            <AnimatePresence>
                {isFetching && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-card/95 backdrop-blur-md px-3 py-1.5 shadow-lg"
                    >
                        <Spinner className="size-3 animate-spin" />
                        <span className="text-[13px] font-medium text-muted-foreground">
                            Обновление...
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Period selector — full width, no title */}
            <div className="flex items-center gap-1 rounded-xl bg-secondary p-0.5">
                {PERIOD_PRESETS.map((preset) => (
                    <button
                        key={preset.value}
                        className="relative flex-1 h-8 text-[14px] font-medium rounded-xl transition-colors"
                        onClick={() => setActivePeriod(preset.value)}
                        disabled={isFetching}
                    >
                        {activePeriod === preset.value && (
                            <motion.div
                                layoutId="m-period"
                                className="absolute inset-0 bg-card rounded-xl shadow-sm"
                                transition={{
                                    type: "spring",
                                    bounce: 0.15,
                                    duration: 0.5,
                                }}
                            />
                        )}
                        <span
                            className={`relative z-10 ${
                                activePeriod === preset.value
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {preset.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Pending leads */}
            {!leadsLoading && pendingLeads > 0 && (
                <Link
                    to="/leads"
                    className="flex items-center justify-between rounded-2xl bg-blue-500 px-4 py-3 active:bg-blue-600 transition-colors"
                >
                    <div>
                        <span className="text-[18px] font-bold text-white">
                            {pendingLeads}{" "}
                            {pendingLeads === 1 ? "лид" : "лидов"} без обработки
                        </span>
                    </div>
                    <ArrowRightIcon className="size-5 text-white/80" />
                </Link>
            )}

            {/* KPI Cards 2x2 */}
            <div className="grid grid-cols-2 gap-2">
                <MobileKpiCard
                    title="Лиды"
                    value={data.kpi.leadsFound.value.toLocaleString("ru-RU")}
                    delta={data.kpi.leadsFound.delta}
                />
                <MobileKpiCard
                    title="Сообщения"
                    value={formatCompact(data.kpi.messagesProcessed.value)}
                    delta={data.kpi.messagesProcessed.delta}
                />
                <MobileKpiCard
                    title="Конверсия"
                    value={`${data.kpi.conversionRate.value}%`}
                    delta={data.kpi.conversionRate.delta}
                />
                <MobileLimitsCard
                    value={data.kpi.limitsUsed.value}
                    total={data.kpi.limitsUsed.total}
                    percent={limitsPercent}
                    delta={data.kpi.limitsUsed.delta}
                />
            </div>

            {/* Chart */}
            {chartsReady && groupedChartData.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <h3 className="text-[14px] font-bold text-foreground mb-2">
                        Динамика лидов
                    </h3>
                    <div className="h-[140px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={groupedChartData}
                                margin={{
                                    top: 4,
                                    right: 4,
                                    left: 4,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="mColorLeads"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#2AABEE"
                                            stopOpacity={0.2}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#2AABEE"
                                            stopOpacity={0.02}
                                        />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                                    dy={4}
                                    interval="preserveStartEnd"
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        borderRadius: "10px",
                                        border: "none",
                                        boxShadow:
                                            "0 4px 16px rgba(0,0,0,0.10)",
                                        fontSize: "13px",
                                        padding: "8px 12px",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="leads"
                                    name="Лиды"
                                    stroke="#2AABEE"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#mColorLeads)"
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Lead statuses */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <h3 className="text-[14px] font-bold text-foreground mb-3">
                    Статусы лидов
                </h3>
                <div className="flex flex-col gap-2">
                    <FunnelStep
                        label="Необработанные"
                        value={statusCounts.new}
                        max={statusMax}
                        color="#FF9500"
                    />
                    <FunnelStep
                        label="В процессе"
                        value={statusCounts.in_progress}
                        max={statusMax}
                        color="#007AFF"
                    />
                    <FunnelStep
                        label="Отклонённые"
                        value={statusCounts.rejected}
                        max={statusMax}
                        color="#FF3B30"
                    />
                    <FunnelStep
                        label="Избранные"
                        value={statusCounts.favorites}
                        max={statusMax}
                        color="#34C759"
                    />
                </div>
            </div>

            {/* Tag distribution */}
            {tagDistribution.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <h3 className="text-[14px] font-bold text-foreground mb-2">
                        Распределение по тегам
                    </h3>
                    <div className="flex flex-col items-center gap-4 pt-1 pb-1">
                        <div className="w-full h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={tagDistribution.map((item) => ({
                                            name: item.tag,
                                            value: item.count,
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={68}
                                        paddingAngle={3}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {tagDistribution.map((_, i) => (
                                            <Cell
                                                key={`m-cell-${i}`}
                                                fill={getTagColor(i)}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-1 gap-2 w-full">
                            {tagDistribution.map((item, i) => {
                                const pct =
                                    tagTotal > 0
                                        ? Math.round(
                                              (item.count / tagTotal) * 100,
                                          )
                                        : 0;
                                return (
                                    <div
                                        key={item.tag}
                                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-secondary/60 border border-border/50 text-[13px]"
                                    >
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{
                                                backgroundColor: getTagColor(i),
                                            }}
                                        />
                                        <span className="text-foreground font-medium truncate min-w-0 flex-1">
                                            {item.tag}
                                        </span>
                                        <div className="flex items-center gap-1.5 pl-1.5 border-l border-border/50 shrink-0">
                                            <span className="font-bold text-foreground tabular-nums">
                                                {item.count}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground tabular-nums">
                                                {pct}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatCompact(num: number): string {
    if (num >= 1_000_000)
        return `${(num / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return num.toString();
}

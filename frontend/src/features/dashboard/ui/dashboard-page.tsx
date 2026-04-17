import { Button } from "@/shared/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import { GuideHelpButton } from "@/shared/layout/guide-help-button";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardQueries } from "@/lib/queries/dashboard";
import { leadsQueries } from "@/lib/queries/leads";
import { motion, AnimatePresence } from "@/shared/animations/motion";
import {
    getGreeting,
    getTagColor,
} from "@/features/dashboard/lib/dashboard-utils";
import { useDashboardExport } from "@/features/dashboard/lib/use-dashboard-export";
import { PERIOD_PRESETS } from "@/lib/constants";
import { LeadsIcon, MessagesIcon, ConversionIcon } from "./dashboard-icons";
import { Spinner } from "@/shared/ui/spinner";
import {
    DashboardCard,
    KpiCard,
    LimitsCard,
    FunnelStep,
    formatCompact,
} from "./dashboard-components";

/* ── Types ── */

type DashboardData = {
    kpi: {
        leadsFound: { value: number; delta: number };
        messagesProcessed: { value: number; delta: number };
        conversionRate: { value: number; delta: number };
        limitsUsed: { value: number; delta: number; total: number };
    };
    chartData: Array<{ date: string; leads: number; messages: number }>;
    promptStats: Array<{
        name: string;
        leads: number;
        conversion: number;
        cpl: number;
        trend: number[];
    }>;
    tagDistribution: Array<{ tag: string; count: number; color: string }>;
};

/* ── Main Component ── */

export function DashboardPage({ tenantId }: { tenantId: number }) {
    const [activePeriod, setActivePeriod] = useState("7d");
    const [hoveredTagIndex, setHoveredTagIndex] = useState<number | null>(null);

    const { data: dataRaw, isFetching } = useQuery(
        dashboardQueries.stats(tenantId, activePeriod),
    );
    const data = dataRaw as DashboardData | undefined;

    const { data: leadsDataPeriod } = useQuery(
        leadsQueries.list(tenantId, {
            pageSize: 1,
            period: activePeriod as "today" | "7d" | "30d" | "90d" | "all",
        }),
    );
    const leadsCounts = (leadsDataPeriod as { counts?: Record<string, number> })
        ?.counts;

    const handlePeriodChange = (period: string) => {
        if (period !== activePeriod) setActivePeriod(period);
    };

    const { handleExport, isExporting } = useDashboardExport(
        tenantId,
        activePeriod,
    );

    const groupedChartData = useMemo(() => {
        if (!data?.chartData || data.chartData.length === 0) return [];
        return data.chartData;
    }, [data?.chartData]);

    if (!data?.kpi || !data?.tagDistribution) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <img
                    src="/images/common/empty-state-illustration.svg"
                    alt=""
                    className="w-40 h-40 mb-6 opacity-60"
                />
                <h2 className="font-heading text-[20px] font-extrabold text-foreground mb-1.5 tracking-tight">
                    Данные загружаются
                </h2>
                <p className="text-[14px] text-muted-foreground leading-relaxed max-w-xs">
                    Статистика появится после первого сканирования чатов.
                    Убедитесь, что Telegram подключён и добавлены источники.
                </p>
            </div>
        );
    }

    const limitsPercent = data.kpi?.limitsUsed?.total
        ? Math.round(
              (data.kpi.limitsUsed.value / data.kpi.limitsUsed.total) * 100,
          )
        : 0;

    const statusCounts = {
        new: (leadsCounts?.new ?? 0) + (leadsCounts?.viewed ?? 0),
        in_progress: leadsCounts?.in_progress ?? 0,
        rejected: leadsCounts?.rejected ?? 0,
        favorites: leadsCounts?.favorites ?? 0,
    };
    const statusMax = Math.max(
        statusCounts.new,
        statusCounts.in_progress,
        statusCounts.rejected,
        statusCounts.favorites,
        1,
    );

    return (
        <TooltipProvider>
            <div className="relative flex flex-col gap-6">
                {/* Loading indicator */}
                <AnimatePresence>
                    {isFetching && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-2 right-0 z-50 flex items-center gap-2 rounded-xl bg-card/95 backdrop-blur-md px-3.5 py-2 shadow-lg shadow-black/6"
                        >
                            <Spinner className="size-3.5 animate-spin text-foreground" />
                            <span className="text-[13px] font-medium text-muted-foreground">
                                Обновление...
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1
                            className="font-heading text-[26px] font-extrabold tracking-tight text-foreground"
                            suppressHydrationWarning
                        >
                            {getGreeting()}
                        </h1>
                        <GuideHelpButton section="dashboard" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5 rounded-xl bg-secondary p-1">
                            {PERIOD_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    className="relative h-7 px-3.5 text-[13px] font-medium rounded-xl transition-colors"
                                    onClick={() =>
                                        handlePeriodChange(preset.value)
                                    }
                                    disabled={isFetching}
                                >
                                    {activePeriod === preset.value && (
                                        <motion.div
                                            layoutId="period-indicator"
                                            className="absolute inset-0 bg-card rounded-xl shadow-sm shadow-black/6"
                                            transition={{
                                                type: "spring",
                                                bounce: 0.15,
                                                duration: 0.5,
                                            }}
                                        />
                                    )}
                                    <span
                                        className={`relative z-10 transition-colors duration-200 ${
                                            activePeriod === preset.value
                                                ? "text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {preset.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-2 h-7 px-3 gap-1.5 rounded-xl border-dashed text-[13px] font-medium text-muted-foreground hover:text-foreground"
                            onClick={() => void handleExport()}
                            disabled={isExporting}
                        >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            Экспорт
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <KpiCard
                        title="Найдено лидов"
                        value={data.kpi.leadsFound.value.toLocaleString(
                            "ru-RU",
                        )}
                        delta={data.kpi.leadsFound.delta}
                        icon={<LeadsIcon />}
                    />
                    <KpiCard
                        title="Сообщений"
                        value={formatCompact(data.kpi.messagesProcessed.value)}
                        delta={data.kpi.messagesProcessed.delta}
                        icon={<MessagesIcon />}
                    />
                    <KpiCard
                        title="Конверсия"
                        value={`${data.kpi.conversionRate.value}%`}
                        delta={data.kpi.conversionRate.delta}
                        icon={<ConversionIcon />}
                    />
                    <LimitsCard
                        value={data.kpi.limitsUsed.value}
                        total={data.kpi.limitsUsed.total}
                        percent={limitsPercent}
                        delta={data.kpi.limitsUsed.delta}
                    />
                </div>

                {/* Bottom section: Chart left + Funnel/Tags right */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-start">
                    {/* Chart */}
                    <DashboardCard title="Динамика поиска лидов">
                        <div className="h-[400px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={groupedChartData}
                                    margin={{
                                        top: 8,
                                        right: 8,
                                        left: 8,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="colorLeads"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#2AABEE"
                                                stopOpacity={0.25}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#2AABEE"
                                                stopOpacity={0.02}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="4 4"
                                        vertical={false}
                                        stroke="#e5e7eb"
                                        strokeOpacity={0.6}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fill: "#9ca3af",
                                            fontSize: 11,
                                            fontFamily: "Inter",
                                        }}
                                        dy={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fill: "#9ca3af",
                                            fontSize: 11,
                                            fontFamily: "Inter",
                                        }}
                                        dx={-6}
                                        width={30}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "none",
                                            boxShadow:
                                                "0 8px 32px rgba(0,0,0,0.10)",
                                            fontSize: "12px",
                                            padding: "10px 14px",
                                            fontFamily: "Inter",
                                            background:
                                                "rgba(255,255,255,0.98)",
                                            backdropFilter: "blur(8px)",
                                        }}
                                        itemStyle={{
                                            color: "#111827",
                                            fontWeight: 500,
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="leads"
                                        name="Лиды"
                                        stroke="#2AABEE"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorLeads)"
                                        dot={false}
                                        activeDot={{
                                            r: 4,
                                            fill: "#2AABEE",
                                            stroke: "white",
                                            strokeWidth: 2,
                                        }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardCard>

                    {/* Right column: Funnel + Tags stacked */}
                    <div className="flex flex-col gap-4">
                        {/* Lead statuses */}
                        <DashboardCard title="Статусы лидов">
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
                        </DashboardCard>

                        {/* Tags — Donut chart */}
                        <DashboardCard title="Распределение по тегам">
                            <div className="flex flex-col items-center gap-6 pt-2 pb-1">
                                <div className="w-full h-[180px] shrink-0">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={data.tagDistribution.map(
                                                    (item) => ({
                                                        name: item.tag,
                                                        value: item.count,
                                                    }),
                                                )}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={3}
                                                dataKey="value"
                                                strokeWidth={0}
                                            >
                                                {data.tagDistribution.map(
                                                    (_, i) => (
                                                        <Cell
                                                            key={`cell-${i}`}
                                                            fill={getTagColor(
                                                                i,
                                                            )}
                                                            opacity={
                                                                hoveredTagIndex ===
                                                                    null ||
                                                                hoveredTagIndex ===
                                                                    i
                                                                    ? 1
                                                                    : 0.3
                                                            }
                                                            className="transition-opacity duration-200"
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-1 gap-2 w-full">
                                    {data.tagDistribution.map((item, i) => {
                                        const total =
                                            data.tagDistribution.reduce(
                                                (s, t) => s + t.count,
                                                0,
                                            );
                                        const pct =
                                            total > 0
                                                ? Math.round(
                                                      (item.count / total) *
                                                          100,
                                                  )
                                                : 0;
                                        return (
                                            <div
                                                key={item.tag}
                                                className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-secondary/60 border border-border/50 text-[13px] transition-all cursor-default ${hoveredTagIndex === i ? "bg-secondary border-border shadow-sm scale-105" : "hover:bg-secondary/80"}`}
                                                onMouseEnter={() =>
                                                    setHoveredTagIndex(i)
                                                }
                                                onMouseLeave={() =>
                                                    setHoveredTagIndex(null)
                                                }
                                            >
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{
                                                        backgroundColor:
                                                            getTagColor(i),
                                                    }}
                                                />
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="text-foreground font-medium truncate min-w-0 flex-1">
                                                            {item.tag}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {item.tag}
                                                    </TooltipContent>
                                                </Tooltip>
                                                <div className="flex items-center gap-1.5 pl-1.5 border-l border-border/50">
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
                        </DashboardCard>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}

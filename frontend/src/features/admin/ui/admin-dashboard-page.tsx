import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { motion } from "@/shared/animations/motion";

import { adminQueries } from "@/lib/queries/admin";
import { Button } from "@/shared/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/ui/chart";
import { Spinner } from "@/shared/ui/spinner";
import { HealthCheckBadge } from "./admin-status-badges";
import { SummaryCard } from "./admin-summary-card";

const MESSAGE_RANGE_PRESETS = [
    { value: "1h", label: "1ч" },
    { value: "6h", label: "6ч" },
    { value: "24h", label: "24ч" },
    { value: "7d", label: "7д" },
    { value: "30d", label: "30д" },
    { value: "90d", label: "90д" },
] as const;

const CHART_COLOR = "#2AABEE";

export function AdminDashboardPage() {
    const [messagesRange, setMessagesRange] = useState("24h");
    const { data: summary, isFetching: isFetchingSummary, refetch: refetchSummary } = useQuery(adminQueries.summary());
    const {
        data: processedMessages,
        isFetching: isFetchingProcessedMessages,
        refetch: refetchProcessedMessages,
        error: processedMessagesError,
    } = useQuery(adminQueries.processedMessagesTimeseries(messagesRange));

    const chartData = useMemo(() => (processedMessages?.points ?? []).map((point) => ({
        bucketStart: point.bucketStart,
        total: point.total,
        label: formatBucketLabel(point.bucketStart, messagesRange),
    })), [messagesRange, processedMessages?.points]);

    const chartTotal = useMemo(() => chartData.reduce((acc, p) => acc + p.total, 0), [chartData]);
    const showEmptyChartState =
        !isFetchingProcessedMessages &&
        !processedMessagesError &&
        chartData.length > 0 &&
        chartTotal === 0;
    const isRefreshingAll = isFetchingSummary || isFetchingProcessedMessages;

    return (
        <div className="relative flex flex-col gap-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="font-heading text-[26px] font-extrabold tracking-tight text-foreground">
                        Дэшборд
                    </h1>
                    <p className="text-[14px] text-muted-foreground">
                        Здоровье платформы, статистика обработки сообщений и общие метрики.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 shrink-0 rounded-xl px-4 w-full sm:w-auto"
                    onClick={() => {
                        void refetchSummary();
                        void refetchProcessedMessages();
                    }}
                    disabled={isRefreshingAll}
                >
                    {isRefreshingAll ? <Spinner className="size-4 animate-spin mr-2" /> : null}
                    Обновить сводку
                </Button>
            </div>

            <div className="flex flex-col gap-8">
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">Состояние платформы</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <SummaryCard title="Здоровье" value={summary?.overallStatus ?? "—"} hint="Общий статус платформы" />
                        <SummaryCard title="Пользователи" value={summary?.totalUsers ?? 0} hint="Активных пользователей" />
                        <SummaryCard title="Сообщения 30д" value={summary?.totalMessages30d ?? 0} hint={`Всего за всё время: ${summary?.totalMessagesAllTime ?? 0}`} />
                        <SummaryCard title="Очередь" value={summary?.currentQueueLength ?? 0} hint={`Ошибок за 24ч: ${summary?.failedAttempts24h ?? 0}`} />
                        <SummaryCard title="Сессии" value={summary?.sessionsTotal ?? 0} hint={`Активных: ${summary?.activeSessions ?? 0}`} />
                        <SummaryCard title="Бэкофф" value={summary?.sessionsInBackoff ?? 0} hint={`${summary?.backoffPercent ?? 0}% от всех сессий`} />
                        <SummaryCard title="Арендовано" value={summary?.leasedSessions ?? 0} hint={`Клиентов активно: ${summary?.activeTenants ?? 0}`} />
                        <SummaryCard title="Последняя обработка" value={summary?.lastProcessedAt ? new Date(summary.lastProcessedAt).toLocaleString("ru-RU") : "—"} hint="Последнее движение в очереди" />
                    </div>
                </section>

                {(summary?.healthChecks ?? []).length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-foreground mb-4">Проверки</h2>
                        <div className="flex flex-col gap-3">
                            {(summary?.healthChecks ?? []).map((item) => (
                                <HealthCheckBadge key={item.key} item={item} />
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Обработка сообщений</h2>
                            <p className="text-[13px] text-muted-foreground mt-0.5">
                                Всего за период: <span className="font-semibold text-foreground">{chartTotal.toLocaleString("ru-RU")}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-1 rounded-xl bg-secondary/50 p-1 w-fit">
                            {MESSAGE_RANGE_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    className="relative h-8 rounded-lg px-3.5 text-[13px] font-medium transition-colors disabled:opacity-50"
                                    onClick={() => setMessagesRange(preset.value)}
                                    disabled={isFetchingProcessedMessages}
                                >
                                    {messagesRange === preset.value && (
                                        <motion.div
                                            layoutId="admin-messages-period"
                                            className="absolute inset-0 rounded-lg bg-background shadow-sm"
                                            transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
                                        />
                                    )}
                                    <span className={`relative z-10 ${messagesRange === preset.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                                        {preset.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4 sm:p-6">
                        {processedMessagesError ? (
                            <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-6 text-center">
                                <div className="max-w-md">
                                    <div className="text-sm font-semibold text-foreground">
                                        Не удалось загрузить график
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {processedMessagesError instanceof Error
                                            ? processedMessagesError.message
                                            : "Попробуйте обновить график ещё раз."}
                                    </div>
                                </div>
                            </div>
                        ) : showEmptyChartState ? (
                            <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-border/60 px-6 text-center">
                                <div className="max-w-md">
                                    <div className="text-sm font-semibold text-foreground">
                                        За выбранный период нет обработанных сообщений
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        График строится по новым записям в{" "}
                                        <span className="font-mono">
                                            message_processing_attempts
                                        </span>
                                        . Пока за этот интервал новых attempts нет.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <ChartContainer config={{ total: { label: "Сообщения", color: CHART_COLOR } }} className="h-[300px] w-full [&_.recharts-cartesian-grid_line]:stroke-border">
                                <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="adminProcessedMessages" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.28} />
                                            <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-border" strokeOpacity={0.5} />
                                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 11, opacity: 0.5 }} minTickGap={28} dy={6} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} tick={{ fill: "currentColor", fontSize: 11, opacity: 0.5 }} dx={-4} domain={[0, "auto"]} />
                                    <ChartTooltip content={<ChartTooltipContent labelKey="label" formatter={(value) => [Number(value).toLocaleString("ru-RU"), "Сообщения"]} />} />
                                    <Area type="monotone" dataKey="total" stroke="var(--color-total)" fill="url(#adminProcessedMessages)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: CHART_COLOR, stroke: "var(--color-background)", strokeWidth: 2 }} />
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function formatBucketLabel(bucketStart: string, range: string) {
    const date = new Date(bucketStart);
    if (range === "1h" || range === "6h" || range === "24h") {
        return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

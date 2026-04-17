import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { DatePicker } from "@/shared/ui/date-picker";
import type { SourceChat } from "@/features/settings/types";
import { settingsQueries, settingsMutations } from "@/lib/queries/settings";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { Spinner } from "@/shared/ui/spinner";

dayjs.locale("ru");

const PERIOD_PRESETS = [
    { label: "Последняя неделя", days: 7 },
    { label: "Последний месяц", days: 30 },
    { label: "Последние 3 месяца", days: 90 },
] as const;

export interface HistoricalScanModalProps {
    tenantId: number;
    open: boolean;
    chat: SourceChat | null;
    onClose: () => void;
}

export function HistoricalScanModal({
    tenantId,
    open,
    chat,
    onClose,
}: HistoricalScanModalProps) {
    const queryClient = useQueryClient();
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

    const scanQuery = useQuery({
        ...settingsQueries.sourceScan(tenantId, chat?.id ?? ""),
        enabled: open && Boolean(chat?.id),
    });

    const scanMutation = useMutation({
        mutationFn: (payload: { dateFrom?: string; dateTo?: string }) =>
            settingsMutations.startSourceScan(tenantId, chat!.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["settings", "source-scan", tenantId, chat?.id],
            });
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        },
    });

    useEffect(() => {
        if (open) {
            setDateFrom(undefined);
            setDateTo(undefined);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open || !chat || typeof document === "undefined") return null;

    const currentScan = scanQuery.data;
    const displayName = chat.title || chat.url || "Без названия";

    const handleScanStart = () => {
        scanMutation.mutate({
            dateFrom: dateFrom
                ? dayjs(dateFrom).format("YYYY-MM-DD")
                : undefined,
            dateTo: dateTo ? dayjs(dateTo).format("YYYY-MM-DD") : undefined,
        });
    };

    const statusLabels: Record<string, string> = {
        pending: "Ожидание",
        running: "Выполняется",
        completed: "Завершён",
        failed: "Ошибка",
    };

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[460px] rounded-2xl bg-popover border border-border/40 overflow-hidden animate-in zoom-in-95 fade-in duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-0">
                    <h3 className="text-base font-semibold text-foreground">
                        Скан за период
                    </h3>
                    <button
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 pt-4 pb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[13px] text-muted-foreground">
                                Чат:{" "}
                                <span className="font-medium text-foreground">
                                    {displayName}
                                </span>
                            </span>
                            <p className="text-[13px] text-muted-foreground leading-relaxed">
                                Разовый проход по сообщениям за выбранный
                                период. Основное сканирование не затрагивается.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-medium text-foreground">
                                    Дата от
                                </label>
                                <DatePicker
                                    value={dateFrom}
                                    onChange={setDateFrom}
                                    placeholder="Начало"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-medium text-foreground">
                                    Дата до
                                </label>
                                <DatePicker
                                    value={dateTo}
                                    onChange={setDateTo}
                                    placeholder="Конец"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {PERIOD_PRESETS.map((preset) => (
                                <button
                                    key={preset.days}
                                    type="button"
                                    onClick={() => {
                                        const to = new Date();
                                        const from = new Date();
                                        from.setDate(
                                            from.getDate() - preset.days,
                                        );
                                        setDateFrom(from);
                                        setDateTo(to);
                                    }}
                                    className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-secondary text-[12px] font-semibold text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <Button
                            type="button"
                            onClick={handleScanStart}
                            disabled={
                                scanMutation.isPending || (!dateFrom && !dateTo)
                            }
                            className="w-full h-11 bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium mt-1"
                        >
                            {scanMutation.isPending ? (
                                <>
                                    <Spinner className="mr-2 size-4 animate-spin" />
                                    Запускаем...
                                </>
                            ) : (
                                "Запустить скан"
                            )}
                        </Button>

                        {currentScan ? (
                            <div className="rounded-xl bg-muted/30 px-4 py-3 text-[13px] flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-foreground">
                                        {statusLabels[currentScan.status] ??
                                            currentScan.status}
                                    </span>
                                    {currentScan.status === "running" && (
                                        <Spinner className="size-3.5 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-muted-foreground">
                                    <span>
                                        Просмотрено: {currentScan.totalMessages}
                                    </span>
                                    <span>
                                        В очереди:{" "}
                                        {currentScan.enqueuedMessages}
                                    </span>
                                    <span>
                                        Обработано:{" "}
                                        {currentScan.processedMessages}
                                    </span>
                                </div>
                                {currentScan.errorText ? (
                                    <span className="text-red-600 mt-1">
                                        {currentScan.errorText}
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}

/** Mobile version — bottom sheet style */
export function MobileHistoricalScanSheet({
    tenantId,
    open,
    chat,
    onClose,
}: HistoricalScanModalProps) {
    const queryClient = useQueryClient();
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

    const scanQuery = useQuery({
        ...settingsQueries.sourceScan(tenantId, chat?.id ?? ""),
        enabled: open && Boolean(chat?.id),
    });

    const scanMutation = useMutation({
        mutationFn: (payload: { dateFrom?: string; dateTo?: string }) =>
            settingsMutations.startSourceScan(tenantId, chat!.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["settings", "source-scan", tenantId, chat?.id],
            });
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        },
    });

    useEffect(() => {
        if (open) {
            setDateFrom(undefined);
            setDateTo(undefined);
        }
    }, [open]);

    if (!open || !chat || typeof document === "undefined") return null;

    const currentScan = scanQuery.data;
    const displayName = chat.title || chat.url || "Без названия";

    const handleScanStart = () => {
        scanMutation.mutate({
            dateFrom: dateFrom
                ? dayjs(dateFrom).format("YYYY-MM-DD")
                : undefined,
            dateTo: dateTo ? dayjs(dateTo).format("YYYY-MM-DD") : undefined,
        });
    };

    const statusLabels: Record<string, string> = {
        pending: "Ожидание",
        running: "Выполняется",
        completed: "Завершён",
        failed: "Ошибка",
    };

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex flex-col justify-end bg-black/40 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="bg-popover rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 safe-area-bottom"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h3 className="text-[16px] font-semibold text-foreground">
                        Скан за период
                    </h3>
                    <button
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-xl text-muted-foreground"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                </div>

                <div className="px-5 pt-2 pb-6">
                    <div className="flex flex-col gap-3">
                        <p className="text-[13px] text-muted-foreground">
                            Чат:{" "}
                            <span className="font-medium text-foreground">
                                {displayName}
                            </span>
                        </p>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                            Разовый проход по сообщениям за выбранный период.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-medium text-foreground">
                                    Дата от
                                </label>
                                <DatePicker
                                    value={dateFrom}
                                    onChange={setDateFrom}
                                    placeholder="Начало"
                                    className="h-12 text-[16px]"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-medium text-foreground">
                                    Дата до
                                </label>
                                <DatePicker
                                    value={dateTo}
                                    onChange={setDateTo}
                                    placeholder="Конец"
                                    className="h-12 text-[16px]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {PERIOD_PRESETS.map((preset) => (
                                <button
                                    key={preset.days}
                                    type="button"
                                    onClick={() => {
                                        const to = new Date();
                                        const from = new Date();
                                        from.setDate(
                                            from.getDate() - preset.days,
                                        );
                                        setDateFrom(from);
                                        setDateTo(to);
                                    }}
                                    className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-secondary text-[12px] font-semibold text-muted-foreground active:bg-secondary/80 active:text-foreground transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <Button
                            type="button"
                            onClick={handleScanStart}
                            disabled={
                                scanMutation.isPending || (!dateFrom && !dateTo)
                            }
                            className="w-full h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium text-[15px]"
                        >
                            {scanMutation.isPending ? (
                                <>
                                    <Spinner className="mr-2 size-4 animate-spin" />
                                    Запускаем...
                                </>
                            ) : (
                                "Запустить скан"
                            )}
                        </Button>

                        {currentScan ? (
                            <div className="rounded-xl bg-muted/30 px-4 py-3 text-[13px] flex flex-col gap-1">
                                <span className="font-medium text-foreground">
                                    {statusLabels[currentScan.status] ??
                                        currentScan.status}
                                </span>
                                <div className="flex flex-col gap-0.5 text-muted-foreground">
                                    <span>
                                        Просмотрено: {currentScan.totalMessages}
                                    </span>
                                    <span>
                                        В очереди:{" "}
                                        {currentScan.enqueuedMessages}
                                    </span>
                                    <span>
                                        Обработано:{" "}
                                        {currentScan.processedMessages}
                                    </span>
                                </div>
                                {currentScan.errorText ? (
                                    <span className="text-red-600 mt-1">
                                        {currentScan.errorText}
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}

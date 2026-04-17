import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { settingsMutations } from "@/lib/queries/settings";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { ConfirmModal } from "@/shared/ui/confirm-modal";
import { TelegramConnectFlow } from "@/shared/ui/telegram-connect-flow";
import type { SettingsData } from "@/features/settings/types";

export function MobileTelegramTab({
    data,
    onChange,
    tenantId,
}: {
    data: SettingsData["telegram"];
    onChange: (k: keyof SettingsData["telegram"], v: string) => void;
    tenantId: number;
}) {
    const hasActiveSession = !!data.stringSession;
    const isScanPaused = data.scanPaused === true;
    const [changingUser, setChangingUser] = useState(false);
    const [showPauseConfirm, setShowPauseConfirm] = useState(false);
    const queryClient = useQueryClient();

    const pauseMutation = useMutation({
        mutationFn: async () =>
            isScanPaused
                ? settingsMutations.resumeScan(tenantId)
                : settingsMutations.pauseScan(tenantId),
        onSuccess: async (result) => {
            await queryClient.invalidateQueries({ queryKey: ["settings"] });
            snackbarStore.show(
                result.paused
                    ? "Сканирование лидов поставлено на паузу"
                    : "Сканирование лидов возобновлено",
            );
        },
        onError: (err: unknown) => {
            const message =
                err instanceof Error
                    ? err.message
                    : "Не удалось изменить статус сканирования";
            snackbarStore.showError(message);
        },
    });

    const hasError = data.sessionStatus === "backoff" && !!data.lastError;

    return (
        <div className="flex flex-col gap-4">
            {hasActiveSession && !changingUser ? (
                <>
                    {/* Settings card */}
                    <div className="rounded-2xl border border-border/60 divide-y divide-border/60 overflow-hidden">
                        {/* Connection status */}
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-background">
                            <div className="size-9 rounded-full bg-foreground flex items-center justify-center shrink-0">
                                <svg
                                    className="size-4 text-background"
                                    viewBox="21 16 80 80"
                                    fill="currentColor"
                                >
                                    <path d="M23.775 58.77a3278.85 3278.85 0 0 1 39.27-16.223c18.698-7.454 21.3-8.542 23.828-8.58a4.995 4.995 0 0 1 2.977 1.103c1.058.9 1.38 1.47 1.47 1.972.083.503.075 2.07-.015 2.963-1.013 10.207-4.86 33.78-7.088 45.225-.945 4.837-2.805 6.457-4.605 6.615-3.907.345-6.877-2.475-10.664-4.86-5.925-3.728-7.905-5.1-13.65-8.737-6.653-4.2-3.916-5.663-.128-9.436.99-.982 17.415-15.974 17.662-17.34.21-1.2.286-1.357-.254-1.897-.548-.54-1.2-.473-1.62-.383-.6.128-9.645 5.85-27.15 17.176-2.685 1.777-5.115 2.64-7.298 2.595-2.4-.053-7.027-1.305-10.462-2.378-4.223-1.32-7.575-2.01-7.275-4.245.15-1.163 1.814-2.355 5.002-3.57Z" fill="#FFF" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-semibold ${hasError ? "text-red-600" : "text-foreground"}`}>
                                    {hasError ? "Проблема с подключением" : "Telegram подключён"}
                                </p>
                                <p className={`text-[11px] mt-0.5 leading-relaxed ${hasError ? "text-red-500" : "text-muted-foreground"}`}>
                                    {hasError ? data.lastError : "Аккаунт готов к работе"}
                                </p>
                            </div>
                            <div className={`size-2 rounded-full shrink-0 ${hasError ? "bg-red-500" : "bg-emerald-500"}`} />
                        </div>

                        {/* Scan toggle */}
                        <div className="flex items-center justify-between px-4 py-3.5 bg-background">
                            <div>
                                <p className="text-[13px] font-medium text-foreground">Искать лидов</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {isScanPaused ? "Приостановлено" : "Активно"}
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={!isScanPaused}
                                onClick={() => {
                                    if (isScanPaused) {
                                        pauseMutation.mutate();
                                    } else {
                                        setShowPauseConfirm(true);
                                    }
                                }}
                                disabled={pauseMutation.isPending}
                                className={`relative inline-flex h-[26px] w-[46px] items-center rounded-full transition-colors shrink-0 ${
                                    !isScanPaused ? "bg-primary" : "bg-muted-foreground/25"
                                } ${pauseMutation.isPending ? "opacity-50" : ""}`}
                            >
                                <span
                                    className={`inline-block size-[22px] rounded-full bg-white shadow-sm transition-transform ${
                                        !isScanPaused ? "translate-x-[22px]" : "translate-x-[2px]"
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Change account */}
                        <button
                            type="button"
                            onClick={() => setChangingUser(true)}
                            className="flex items-center justify-between w-full px-4 py-3.5 bg-background text-left hover:bg-muted/40 transition-colors"
                        >
                            <p className="text-[13px] font-medium text-foreground">Сменить аккаунт</p>
                            <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>

                    <ConfirmModal
                        open={showPauseConfirm}
                        title="Приостановить поиск лидов?"
                        description="Сканирование чатов будет остановлено. Вы сможете возобновить его в любой момент."
                        confirmLabel="Приостановить"
                        cancelLabel="Отмена"
                        onConfirm={() => {
                            setShowPauseConfirm(false);
                            pauseMutation.mutate();
                        }}
                        onCancel={() => setShowPauseConfirm(false)}
                    />
                </>
            ) : (
                <div className="flex flex-col items-center">
                    {changingUser && (
                        <button
                            onClick={() => setChangingUser(false)}
                            className="self-start mb-2 text-[13px] text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            ← Назад
                        </button>
                    )}
                    <TelegramConnectFlow
                        tenantId={tenantId}
                        phoneOnly
                        onSuccess={(ss: string) => {
                            if (ss) onChange("stringSession", ss);
                            queryClient.invalidateQueries({ queryKey: ["settings"] });
                            setChangingUser(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
}

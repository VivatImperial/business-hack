import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import {
    ExclamationTriangleIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { settingsMutations, settingsQueries } from "@/lib/queries/settings";
import { promptsQueries } from "@/lib/queries/prompts";
import { getRouteApi } from "@tanstack/react-router";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import type {
    PromptStepWithAssistant,
    SettingsData,
} from "@/features/settings/types";
import type { PromptsStepsResponse } from "@/lib/api/generated/schemas";
import { usePromptsEditor } from "@/shared/lib/use-prompts-editor";
import { PromptsEditor } from "@/shared/ui/prompts-editor";
import { MobileTelegramTab } from "./mobile-telegram-tab";

const appRoute = getRouteApi("/_app");

export function MobileSettingsPage() {
    const queryClient = useQueryClient();
    const { tenantId } = appRoute.useRouteContext();
    const { data: settings } = useSuspenseQuery(
        settingsQueries.detail(tenantId!),
    );

    const promptsEditor = usePromptsEditor(tenantId!);
    const activeStep = promptsEditor.activeStep;

    const { data: promptsDataRaw } = useSuspenseQuery(
        promptsQueries.list(tenantId!),
    );
    const promptsData = promptsDataRaw as PromptsStepsResponse;
    const steps: PromptStepWithAssistant[] = (promptsData?.steps ??
        []) as PromptStepWithAssistant[];

    const [activeTab, setActiveTab] = useState<string>("telegram");

    const [localData, setLocalData] = useState<SettingsData>(
        settings as SettingsData,
    );

    useEffect(() => {
        setLocalData(settings as SettingsData);
    }, [settings]);

    const updateMutation = useMutation({
        mutationFn: (data: Parameters<typeof settingsMutations.update>[1]) =>
            settingsMutations.update(tenantId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            snackbarStore.show("Сохранено");
        },
        onError: (err: unknown) => {
            const message = err instanceof Error ? err.message : "Ошибка";
            snackbarStore.showError(message);
        },
    });

    const settingsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const localDataRef = useRef(localData);

    useEffect(() => {
        localDataRef.current = localData;
    }, [localData]);

    useEffect(() => {
        const isDirty = JSON.stringify(localData) !== JSON.stringify(settings);
        if (!isDirty) return;
        if (settingsDebounceRef.current)
            clearTimeout(settingsDebounceRef.current);
        settingsDebounceRef.current = setTimeout(() => {
            updateMutation.mutate({ ...localDataRef.current });
        }, 500);
        return () => {
            if (settingsDebounceRef.current)
                clearTimeout(settingsDebounceRef.current);
        };
    }, [localData, settings, updateMutation]);

    const updateTelegram = (
        key: keyof SettingsData["telegram"],
        value: string,
    ) => {
        setLocalData((prev) => ({
            ...prev,
            telegram: { ...prev.telegram, [key]: value },
        }));
    };

    const safety = activeStep?.assistant?.safety;

    const allTabs = [
        { id: "telegram", label: "Telegram" },
        ...steps
            .filter((s: PromptStepWithAssistant) => s.criteriaEditable)
            .slice(0, 1)
            .map((s: PromptStepWithAssistant) => ({
                id: `prompt-${s.id}`,
                label: "Кого искать",
            })),
    ];

    return (
        <div className="flex flex-col gap-4">
            <h1 className="font-heading text-[22px] font-extrabold tracking-tight text-foreground">
                Настройки
            </h1>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
                {allTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`shrink-0 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                            activeTab === tab.id
                                ? "bg-foreground text-background"
                                : "bg-secondary text-muted-foreground"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "telegram" && (
                <MobileTelegramTab
                    data={
                        localData.telegram ?? {
                            apiId: "",
                            apiHash: "",
                            stringSession: "",
                        }
                    }
                    onChange={updateTelegram}
                    tenantId={tenantId!}
                />
            )}
            {activeStep && activeStep.criteriaEditable && activeTab.startsWith("prompt-") && (
                <div className="flex flex-col gap-4">
                    {/* Safety notice — compact inline */}
                    {safety &&
                        (safety.blocked || safety.status === "error") && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 text-[12px] text-muted-foreground">
                                {safety.blocked ? (
                                    <ExclamationCircleIcon className="size-4 shrink-0 text-red-500" />
                                ) : (
                                    <ExclamationTriangleIcon className="size-4 shrink-0 text-amber-500" />
                                )}
                                <span>
                                    {safety.blocked
                                        ? "Сканирование остановлено"
                                        : "Автопроверка недоступна"}
                                    . {safety.reason}
                                </span>
                            </div>
                        )}

                    <PromptsEditor editor={promptsEditor} hideStatusBanner />
                </div>
            )}
        </div>
    );
}

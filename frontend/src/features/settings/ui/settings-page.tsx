import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { KeyIcon } from "@heroicons/react/24/solid";
import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import { settingsQueries, settingsMutations } from "@/lib/queries/settings";
import { getRouteApi } from "@tanstack/react-router";
import { TabUnderline } from "@/shared/animations/tabs-animations";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { getDisplayError } from "@/shared/lib/get-display-error";
import type { SettingsData } from "@/features/settings/types";
import NiceModal from "@ebay/nice-modal-react";
import { StoryViewerModal } from "@/shared/stories/story-viewer-modal";
import { STORIES } from "@/shared/stories/stories-data";
import { GuideHelpButton } from "@/shared/layout/guide-help-button";
import { PromptsEditor } from "@/shared/ui/prompts-editor";
import { usePromptsEditor } from "@/shared/lib/use-prompts-editor";
import { TelegramTab } from "./telegram-tab";

const STATIC_TABS = [
    { id: "telegram", label: "Telegram API", icon: KeyIcon },
] as const;

const appRoute = getRouteApi("/_app");

export function SettingsPage() {
    const queryClient = useQueryClient();
    const { tenantId } = appRoute.useRouteContext();
    const { data: settings } = useSuspenseQuery(
        settingsQueries.detail(tenantId!),
    );

    // Prompts editor (hook owns query, state, save mutation, generate mutation).
    const promptsEditor = usePromptsEditor(tenantId!);
    const promptStep = promptsEditor.activeStep;

    const [activeTab, setActiveTabRaw] = useState<string>("telegram");

    const setActiveTab = useCallback((tab: string) => {
        setActiveTabRaw(tab);
        const storyMap: Record<string, string> = {
            sources: "integration",
        };
        const storyId = storyMap[tab];
        if (storyId) {
            const cookieKey = `story_seen_${tab}`;
            if (Cookies.get(cookieKey) !== "true") {
                Cookies.set(cookieKey, "true", { expires: 365, path: "/" });
                const index = STORIES.findIndex((s) => s.id === storyId);
                if (index >= 0) {
                    setTimeout(
                        () =>
                            NiceModal.show(StoryViewerModal, {
                                initialIndex: index,
                            }),
                        300,
                    );
                }
            }
        }
    }, []);

    // Local state for settings edits
    const [localData, setLocalData] = useState<SettingsData>(
        settings as SettingsData,
    );

    // Sync local state when settings change from server
    useEffect(() => {
        setLocalData(settings as SettingsData);
    }, [settings]);

    const updateMutation = useMutation({
        mutationFn: (data: Parameters<typeof settingsMutations.update>[1]) =>
            settingsMutations.update(tenantId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["settings", "detail", tenantId],
            });
            snackbarStore.show("Настройки сохранены");
        },
        onError: (err: unknown) => {
            snackbarStore.showError(
                getDisplayError(err, "Ошибка при сохранении настроек"),
            );
        },
    });

    // Debounced auto-save for settings
    const settingsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const localDataRef = useRef(localData);

    useEffect(() => {
        localDataRef.current = localData;
    });

    const flushSettingsSave = useCallback(() => {
        if (settingsDebounceRef.current) {
            clearTimeout(settingsDebounceRef.current);
            settingsDebounceRef.current = null;
        }
        const isDirty =
            JSON.stringify(localDataRef.current) !== JSON.stringify(settings);
        if (isDirty) {
            updateMutation.mutate({ ...localDataRef.current });
        }
    }, [settings, updateMutation]);

    useEffect(() => {
        const isSettingsDirty =
            JSON.stringify(localData) !== JSON.stringify(settings);
        if (!isSettingsDirty) return;

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

    // Flush pending save on page unload / navigation away
    const flushRef = useRef(flushSettingsSave);

    useEffect(() => {
        flushRef.current = flushSettingsSave;
    });

    useEffect(() => {
        const handleBeforeUnload = () => flushRef.current();
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            flushRef.current();
        };
    }, []);

    // Helpers for updating nested state
    const updateTelegram = (
        key: keyof SettingsData["telegram"],
        value: string,
    ) => {
        setLocalData((prev) => ({
            ...prev,
            telegram: { ...prev.telegram, [key]: value },
        }));
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                <div className="">
                    {/* Header & Tabs */}
                    <div className="pb-0 border-b border-border/40">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <h1 className="font-heading text-[26px] font-extrabold tracking-tight text-foreground">
                                        Настройки системы
                                    </h1>
                                    <GuideHelpButton section="setup" />
                                </div>
                                <p className="text-[14px] text-muted-foreground">
                                    Управление параметрами парсера,
                                    маршрутизацией и AI-моделями
                                </p>
                            </div>
                        </div>

                        {/* Tabs + safety notice inline */}
                        <div className="flex items-center gap-8">
                            {STATIC_TABS.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <Tooltip key={tab.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() =>
                                                    setActiveTab(tab.id)
                                                }
                                                className={`relative pb-4 text-[14px] font-medium transition-colors flex items-center gap-2 ${
                                                    activeTab === tab.id
                                                        ? "text-foreground"
                                                        : "text-muted-foreground hover:text-foreground/80"
                                                }`}
                                            >
                                                <Icon className="size-4" />
                                                {tab.label}
                                                {activeTab === tab.id && (
                                                    <TabUnderline />
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Настройки: {tab.label}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                            {promptStep && (
                                <Tooltip key={`prompt-${promptStep.id}`}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() =>
                                                setActiveTab(
                                                    `prompt-${promptStep.id}`,
                                                )
                                            }
                                            className={`relative pb-4 text-[14px] font-medium transition-colors ${
                                                activeTab ===
                                                `prompt-${promptStep.id}`
                                                    ? "text-foreground"
                                                    : "text-muted-foreground hover:text-foreground/80"
                                            }`}
                                        >
                                            Кого искать
                                            {activeTab ===
                                                `prompt-${promptStep.id}` && (
                                                <TabUnderline />
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Кого искать</TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="py-6">
                        {activeTab === "telegram" && (
                            <TelegramTab
                                data={
                                    localData.telegram ?? {
                                        apiId: "",
                                        apiHash: "",
                                        stringSession: "",
                                    }
                                }
                                onChange={updateTelegram}
                            />
                        )}
                        {activeTab.startsWith("prompt-") && (
                            <PromptsEditor editor={promptsEditor} />
                        )}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}

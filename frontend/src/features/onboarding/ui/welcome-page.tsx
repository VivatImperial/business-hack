import { useEffect, useMemo, useRef, useState } from "react";
import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { useNavigate, getRouteApi } from "@tanstack/react-router";
import { useMeasure } from "@uidotdev/usehooks";
import { ArrowLongRightIcon } from "@heroicons/react/24/solid";
import { settingsQueries, settingsMutations } from "@/lib/queries/settings";
import type { SettingsData } from "@/features/settings/types";
import type { UtmResolveData } from "@/features/admin/types";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { getDisplayError } from "@/shared/lib/get-display-error";
import { usePromptsEditor } from "@/shared/lib/use-prompts-editor";
import {
    motion,
    AnimatePresence,
    staggerContainerFast,
    springExpand,
} from "@/shared/animations/motion";
import { WelcomeStepper, type WelcomeStep } from "./welcome-stepper";
import { WelcomeDestinationStep } from "./welcome-destination-step";
import { WelcomeSourcesStep } from "./welcome-sources-step";
import { WelcomePromptStep } from "./welcome-prompt-step";
import { Spinner } from "@/shared/ui/spinner";

interface StepCopy {
    title: string;
    description: string;
}

const STEPS: WelcomeStep[] = [
    {
        id: "destination",
        label: "Куда писать",
        description: "Чат для клиентов",
    },
    {
        id: "sources",
        label: "Где искать",
        description: "Чаты и каналы",
    },
    {
        id: "prompt",
        label: "Кого искать",
        description: "Описание клиента",
    },
];

const COPY: Record<string, StepCopy> = {
    destination: {
        title: "Куда складывать клиентов",
        description:
            "Создадим в вашем Telegram приватный чат — туда будут приходить все найденные клиенты.",
    },
    sources: {
        title: "Где искать клиентов",
        description:
            "Добавьте чаты и каналы, в которых сидит ваша целевая аудитория. Главное — быть участником этих чатов.",
    },
    prompt: {
        title: "Кого считать клиентом",
        description:
            "Опишите своими словами, кого вы ищете: чем занимается, что заказывает, в каком регионе. Пульсар будет читать сообщения и присылать подходящих.",
    },
};

const welcomeRoute = getRouteApi("/_auth/welcome");

export function WelcomePage() {
    const { tenantId } = welcomeRoute.useRouteContext();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: settingsRaw } = useSuspenseQuery(
        settingsQueries.detail(tenantId!),
    );
    const settings = settingsRaw as SettingsData;

    const promptsEditor = usePromptsEditor(tenantId!);

    // Prefill from UTM data if present
    const utmApplied = useRef(false);
    const utmData = useRef<UtmResolveData | null>(null);
    useEffect(() => {
        if (utmApplied.current) return;
        const raw = sessionStorage.getItem("utm_pending");
        if (!raw) return;
        utmApplied.current = true;
        try {
            const parsed = JSON.parse(raw) as UtmResolveData;
            utmData.current = parsed;
            // Prefill prompt
            if (parsed.promptContent && promptsEditor.setCriteriaPrompt) {
                promptsEditor.setCriteriaPrompt(parsed.promptContent);
            }
        } catch {
            sessionStorage.removeItem("utm_pending");
        }
    }, [promptsEditor]);

    const hasDestination = !!settings.routing?.defaultChat;
    const sources = settings.sources ?? [];
    const hasPromptCriteria = !!(
        promptsEditor.activeStep?.criteriaPrompt &&
        promptsEditor.activeStep.criteriaPrompt.trim().length > 0
    );

    // Initial step skips already-completed steps so returning users land where they need to.
    const [stepIndex, setStepIndex] = useState(() => {
        if (!hasDestination) return 0;
        if (sources.length === 0) return 1;
        return 2;
    });
    const [completed, setCompleted] = useState<string[]>([]);
    const [finishing, setFinishing] = useState(false);

    // Auto-add UTM source chats when sources step is entered
    const utmSourcesAdded = useRef(false);
    useEffect(() => {
        if (stepIndex !== 1 || utmSourcesAdded.current || !utmData.current) return;
        const urls = utmData.current.chatUrls;
        if (!urls || urls.length === 0) return;
        utmSourcesAdded.current = true;
        Promise.allSettled(
            urls.map((url) => settingsMutations.addSource(tenantId!, url)),
        ).then(() => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
        });
    }, [stepIndex, tenantId, queryClient]);

    const currentStep = STEPS[stepIndex];
    const copy = COPY[currentStep.id];

    // Mark steps that already had data on entry as visually completed.
    const initialCompleted = useMemo(() => {
        const list: string[] = [];
        if (hasDestination) list.push("destination");
        if (sources.length > 0) list.push("sources");
        if (hasPromptCriteria) list.push("prompt");
        return list;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const completedIds = useMemo(
        () => Array.from(new Set([...initialCompleted, ...completed])),
        [initialCompleted, completed],
    );

    const finishOnboarding = () => {
        setFinishing(true);
        navigate({ to: "/dashboard" });
    };

    const advance = () => {
        if (stepIndex >= STEPS.length - 1) {
            finishOnboarding();
            return;
        }
        setStepIndex((i) => i + 1);
    };

    const markCompleteAndAdvance = (id: string) => {
        setCompleted((prev) => (prev.includes(id) ? prev : [...prev, id]));
        advance();
    };

    // Back is allowed from sources → destination (only if not already created).
    const minStep = hasDestination ? 1 : 0;
    const canGoBack = stepIndex > minStep;
    const handleBack = () => {
        if (!canGoBack) return;
        setStepIndex((i) => i - 1);
    };

    // Create-chat mutation lives at the page level so the primary action button
    // in the footer can drive it directly.
    const createChatMutation = useMutation({
        mutationFn: () => settingsMutations.createManagedDestination(tenantId!),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            snackbarStore.show(
                result.created
                    ? `Чат "${result.defaultChatTitle}" создан`
                    : `Чат уже настроен: ${result.defaultChatTitle}`,
            );
            markCompleteAndAdvance("destination");
        },
        onError: (err: Error) => {
            snackbarStore.showError(getDisplayError(err, "Не удалось создать чат"));
        },
    });

    // Per-step primary action shown below the divider.
    let primaryLabel = "";
    let primaryAction = () => {};
    let primaryLoading = false;

    if (currentStep.id === "destination") {
        if (hasDestination) {
            primaryLabel = "Далее";
            primaryAction = () => markCompleteAndAdvance("destination");
        } else {
            primaryLabel = "Создать чат";
            primaryLoading = createChatMutation.isPending;
            primaryAction = () => createChatMutation.mutate();
        }
    } else if (currentStep.id === "sources") {
        primaryLabel = "Далее";
        primaryAction = () => {
            if (sources.length > 0) {
                setCompleted((prev) =>
                    prev.includes("sources") ? prev : [...prev, "sources"],
                );
            }
            advance();
        };
    } else if (currentStep.id === "prompt") {
        primaryLabel = "Готово";
        primaryAction = () => {
            promptsEditor.flushPendingSave();
            sessionStorage.removeItem("utm_pending");
            finishOnboarding();
        };
    }

    const [contentRef, { height: contentHeight }] = useMeasure<HTMLDivElement>();

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Top bar for skip button */}
            <div className="flex w-full items-center justify-end p-6">
                <button
                    type="button"
                    onClick={finishOnboarding}
                    className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    Пропустить
                </button>
            </div>

            {/* Main content */}
            <div className="flex flex-1 items-start justify-center px-4 pt-4 pb-20 sm:pt-12">
                <div className="w-full max-w-[640px] flex flex-col items-center">
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={staggerContainerFast(0.08)}
                        className="flex flex-col items-center w-full"
                    >
                        {/* Stepper */}
                        <motion.div variants={springExpand} className="mb-10 w-full">
                            <WelcomeStepper
                                steps={STEPS}
                                currentStepId={currentStep.id}
                                completedStepIds={completedIds}
                            />
                        </motion.div>

                        {/* Header */}
                        <motion.div
                            variants={springExpand}
                            className="mb-8 flex flex-col items-center gap-3 text-center w-full"
                        >
                            <h1 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[32px]">
                                {copy.title}
                            </h1>
                            <p
                                className={`text-[15px] leading-relaxed text-muted-foreground ${
                                    currentStep.id === "prompt"
                                        ? "max-w-[640px]"
                                        : "max-w-[400px]"
                                }`}
                            >
                                {copy.description}
                            </p>
                        </motion.div>

                        {/* Height animated wrapper */}
                        <motion.div
                            animate={{ height: contentHeight ? contentHeight : "auto" }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="w-full overflow-hidden"
                        >
                            <div ref={contentRef} className="w-full flex flex-col items-center">
                                {/* Step content */}
                                <motion.div
                                    animate={{ maxWidth: currentStep.id === "prompt" ? 640 : 480 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="w-full relative"
                                >
                                    <AnimatePresence mode="popLayout">
                                        <motion.div
                                            key={currentStep.id}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -16 }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                            className="flex w-full flex-col items-center"
                                        >
                                            {currentStep.id === "destination" && (
                                                <WelcomeDestinationStep
                                                    defaultChat={
                                                        settings.routing?.defaultChat ??
                                                        ""
                                                    }
                                                    defaultChatTitle={
                                                        settings.routing
                                                            ?.defaultChatTitle
                                                    }
                                                />
                                            )}
                                            {currentStep.id === "sources" && (
                                                <WelcomeSourcesStep
                                                    tenantId={tenantId!}
                                                    sources={sources}
                                                />
                                            )}
                                            {currentStep.id === "prompt" && (
                                                <WelcomePromptStep
                                                    editor={promptsEditor}
                                                />
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </motion.div>

                                {/* Footer Actions */}
                                <motion.div 
                                    animate={{ maxWidth: currentStep.id === "prompt" ? 640 : 480 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="mt-10 flex w-full flex-col items-center gap-4"
                                >
                                    <button
                                        type="button"
                                        onClick={primaryAction}
                                        disabled={primaryLoading || finishing}
                                        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[16px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {primaryLoading || finishing ? (
                                            <Spinner className="size-5 animate-spin" />
                                        ) : (
                                            <>
                                                {primaryLabel}
                                                <ArrowLongRightIcon className="size-5" />
                                            </>
                                        )}
                                    </button>

                                    {/* Secondary Actions Row */}
                                    <div className="flex min-h-[40px] w-full items-center justify-center gap-6">
                                        {canGoBack && (
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                Назад
                                            </button>
                                        )}
                                        {currentStep.id === "destination" && !hasDestination && (
                                            <button
                                                type="button"
                                                onClick={advance}
                                                className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                Сделаю позже
                                            </button>
                                        )}
                                    </div>

                                    <p className="mt-2 text-center text-[13px] text-muted-foreground/60">
                                        Эти параметры можно будет изменить позже в Настройках
                                    </p>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

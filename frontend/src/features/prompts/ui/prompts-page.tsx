import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { InfoBanner } from "@/shared/ui/info-banner";
const brainImg = "/images/common/3d-brain-in-chat-bubble.webp";
import { useEffect, useState } from "react";
import { promptsQueries, promptsMutations } from "@/lib/queries/prompts";
import type { PromptsStepsResponse, PromptStep } from "@/lib/api/generated/schemas";
import { getRouteApi } from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { Spinner } from "@/shared/ui/spinner";

const appRoute = getRouteApi("/_app");

export function PromptsPage() {
    const queryClient = useQueryClient();
    const { tenantId } = appRoute.useRouteContext();
    const { data: dataRaw } = useSuspenseQuery(promptsQueries.list(tenantId!));
    const data = dataRaw as PromptsStepsResponse;
    const { steps } = data;

    // Find first editable step
    const editableSteps = steps.filter((s: PromptStep) => s.criteriaEditable);
    const activeStep = editableSteps[0] ?? steps[0];
    const activeStepId = activeStep?.id ?? 1;

    // Local editor state
    const [criteriaPrompt, setCriteriaPrompt] = useState("");

    // Sync local state when active step changes
    useEffect(() => {
        if (activeStep) {
            setCriteriaPrompt(activeStep.criteriaPrompt ?? "");
        }
    }, [activeStep]);

    const updateMutation = useMutation({
        mutationFn: (data: Parameters<typeof promptsMutations.update>[1]) =>
            promptsMutations.update(tenantId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["prompts"] });
            snackbarStore.show("Изменения сохранены");
        },
    });

    const handleSave = () => {
        updateMutation.mutate({
            id: activeStepId,
            criteriaPrompt: activeStep?.criteriaEditable
                ? criteriaPrompt
                : undefined,
        });
    };

    const isDirty = activeStep?.criteriaEditable
        ? criteriaPrompt !== (activeStep.criteriaPrompt ?? "")
        : false;

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                <div className="">
                    {/* Header */}
                    <div className="pb-6 border-b border-border/50">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <h1 className="page-heading">
                                    Настройки промптов
                                </h1>
                                <p className="text-[14px] text-muted-foreground">
                                    Управление критериями поиска лидов
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={handleSave}
                                            disabled={
                                                !isDirty ||
                                                updateMutation.isPending
                                            }
                                            className="rounded-xl h-10 px-5 bg-foreground text-background hover:bg-foreground/90 transition-all font-medium min-w-[120px]"
                                        >
                                            {updateMutation.isPending && (
                                                <Spinner className="mr-2 size-4 animate-spin" />
                                            )}
                                            Сохранить
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {!isDirty
                                            ? "Нет несохранённых изменений"
                                            : "Сохранить промпт"}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="py-8 flex flex-col-reverse lg:flex-row gap-8 items-start">
                        <div className="flex flex-col gap-10 flex-1">
                            {activeStep?.criteriaEditable && (
                                <section className="flex flex-col gap-3">
                                    <div>
                                        <h3 className="text-[15px] font-semibold text-foreground">
                                            Кого искать
                                        </h3>
                                        <p className="text-[14px] text-muted-foreground mt-0.5">
                                            Опиши целевые сообщения, важные
                                            признаки, что считать лидом и что
                                            исключать. Инструкции про треды,
                                            JSON и маршрутизацию система
                                            проигнорирует.
                                        </p>
                                    </div>
                                    <textarea
                                        value={criteriaPrompt}
                                        onChange={(e) =>
                                            setCriteriaPrompt(e.target.value)
                                        }
                                        rows={10}
                                        className="w-full rounded-2xl bg-muted/30 border-transparent px-5 py-4 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:bg-background focus:border-border focus:ring-1 focus:ring-border transition-all resize-y outline-none"
                                        placeholder="Например: ищем монтаж отопления в частных домах Новосибирска; вакансии и рекламу пропускать..."
                                    />
                                </section>
                            )}
                        </div>

                        {activeStep && (
                            <div className="w-full lg:w-[320px] shrink-0">
                                <InfoBanner
                                    layout="vertical"
                                    title="Критерии поиска"
                                    description="Нейросеть анализирует каждое сообщение из подключённых чатов по вашим критериям. Опишите, кого считать лидом — система сделает остальное."
                                    image={brainImg}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}

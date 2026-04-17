import { useEffect, useMemo, useRef, useState } from "react";
import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";
import Cookies from "js-cookie";
import { promptsQueries, promptsMutations } from "@/lib/queries/prompts";
import type { PromptsStepsResponse } from "@/lib/api/generated/schemas";
import type {
    PromptAssistantUsage,
    PromptStepWithAssistant,
} from "@/features/settings/types";
import { snackbarStore } from "@/shared/lib/snackbar-store";

const SAVE_DEBOUNCE_MS = 2000;
const AUTO_IMPROVE_COOKIE_KEY = "prompt_auto_improved";

/**
 * Encapsulates the criteria-prompt editor state used by the settings tab and
 * the welcome onboarding step. Handles fetching, debounced auto-save, AI
 * "improve" generation, and accept/reject/revert flow.
 */
export function usePromptsEditor(tenantId: number) {
    const queryClient = useQueryClient();
    const { data: promptsDataRaw } = useSuspenseQuery(
        promptsQueries.list(tenantId),
    );
    // The settings UI only ever exposes the first criteria-editable step,
    // so the hook targets that one as well.
    const activeStep = useMemo(() => {
        const promptsData = promptsDataRaw as PromptsStepsResponse;
        const steps = (promptsData?.steps ?? []) as PromptStepWithAssistant[];
        return steps.find((s) => s.criteriaEditable) ?? null;
    }, [promptsDataRaw]);

    const [criteriaPrompt, setCriteriaPrompt] = useState("");
    const [assistantUsageOverride, setAssistantUsageOverride] =
        useState<PromptAssistantUsage | null>(null);
    const [generatedResult, setGeneratedResult] = useState<string | null>(null);
    const [preImprovePrompt, setPreImprovePrompt] = useState<string | null>(
        null,
    );

    // Sync local criteriaPrompt from server when activeStep changes (or first load).
    const syncedStepIdRef = useRef<number | null>(null);
    useEffect(() => {
        if (!activeStep) return;
        if (syncedStepIdRef.current === activeStep.id) return;
        syncedStepIdRef.current = activeStep.id;
        setCriteriaPrompt(activeStep.criteriaPrompt ?? "");
        setAssistantUsageOverride(null);
        setGeneratedResult(null);
        setPreImprovePrompt(null);
    }, [activeStep]);

    // Generate mutation defined first because the update mutation calls into it.
    const generatePromptMutation = useMutation({
        mutationFn: (prompt: string) =>
            promptsMutations.generate(tenantId, prompt),
        onMutate: (prompt) => {
            setPreImprovePrompt(prompt);
        },
        onSuccess: (result) => {
            setAssistantUsageOverride(result.usage);
            setCriteriaPrompt(result.generatedPrompt);
            setGeneratedResult(null);
            if (result.safety.blocked) {
                snackbarStore.showError(
                    "Промпт содержит рискованную формулировку",
                );
            } else {
                snackbarStore.show("Промпт улучшен");
            }
        },
        onError: (err: unknown) => {
            const message =
                err instanceof Error
                    ? err.message
                    : "Не удалось улучшить промпт";
            snackbarStore.showError(message);
        },
    });

    const promptUpdateMutation = useMutation({
        mutationFn: (data: Parameters<typeof promptsMutations.update>[1]) =>
            promptsMutations.update(tenantId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["prompts"] });
            queryClient.invalidateQueries({
                queryKey: ["settings", "detail", tenantId],
            });
            snackbarStore.show("Промпт сохранён");

            // Auto-improve once on first save (cookie-gated, project-wide).
            if (
                Cookies.get(AUTO_IMPROVE_COOKIE_KEY) !== "true" &&
                activeStep?.criteriaEditable
            ) {
                const text = criteriaPrompt || activeStep.criteriaPrompt || "";
                if (text.trim()) {
                    Cookies.set(AUTO_IMPROVE_COOKIE_KEY, "true", {
                        expires: 365,
                        path: "/",
                    });
                    generatePromptMutation.mutate(text);
                }
            }
        },
        onError: (err: unknown) => {
            const message =
                err instanceof Error
                    ? err.message
                    : "Ошибка при сохранении промпта";
            snackbarStore.showError(message);
        },
    });

    // Debounced auto-save when criteriaPrompt diverges from server value.
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!activeStep || !activeStep.criteriaEditable) return;
        if (criteriaPrompt === (activeStep.criteriaPrompt ?? "")) return;
        if (generatePromptMutation.isPending) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            promptUpdateMutation.mutate({
                id: activeStep.id,
                criteriaPrompt,
            });
        }, SAVE_DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [
        criteriaPrompt,
        activeStep,
        promptUpdateMutation,
        generatePromptMutation.isPending,
    ]);

    const acceptGenerated = () => {
        if (generatedResult) {
            setPreImprovePrompt(criteriaPrompt);
            setCriteriaPrompt(generatedResult);
            setGeneratedResult(null);
        }
    };

    const rejectGenerated = () => {
        setGeneratedResult(null);
    };

    const revertPrompt = () => {
        if (preImprovePrompt !== null) {
            setCriteriaPrompt(preImprovePrompt);
            setPreImprovePrompt(null);
        }
    };

    const generate = () =>
        generatePromptMutation.mutate(
            criteriaPrompt || activeStep?.criteriaPrompt || "",
        );

    const flushPendingSave = () => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        if (
            activeStep?.criteriaEditable &&
            criteriaPrompt !== (activeStep.criteriaPrompt ?? "")
        ) {
            promptUpdateMutation.mutate({
                id: activeStep.id,
                criteriaPrompt,
            });
        }
    };

    return {
        activeStep,
        criteriaPrompt,
        setCriteriaPrompt,
        generate,
        generateDisabled: Boolean(
            (assistantUsageOverride ?? activeStep?.assistant?.usage)
                ?.remaining === 0,
        ),
        generateLoading: generatePromptMutation.isPending,
        generatedResult,
        acceptGenerated,
        rejectGenerated,
        canRevert: preImprovePrompt !== null,
        revertPrompt,
        usage: assistantUsageOverride ?? activeStep?.assistant?.usage ?? null,
        flushPendingSave,
    };
}

export type UsePromptsEditorReturn = ReturnType<typeof usePromptsEditor>;

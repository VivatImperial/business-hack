import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";

import { adminUtmQueries } from "@/lib/queries/admin";
import { Button } from "@/shared/ui/button";
import { AdminUtmPromptStep } from "./admin-utm-prompt-step";
import { AdminUtmPresetStep } from "./admin-utm-preset-step";
import { AdminUtmResultStep } from "./admin-utm-result-step";

const STEPS = [
    { id: "prompt", label: "Промпт" },
    { id: "preset", label: "Чаты" },
    { id: "result", label: "Ссылка" },
] as const;

export function AdminUtmPage() {
    const [stepIndex, setStepIndex] = useState(0);
    const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
    const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);

    const { data: promptTemplates } = useQuery(adminUtmQueries.promptTemplates());
    const { data: chatPresets } = useQuery(adminUtmQueries.chatPresets());

    const selectedPromptName = useMemo(
        () => promptTemplates?.find((t) => t.id === selectedPromptId)?.name ?? "",
        [promptTemplates, selectedPromptId],
    );

    const selectedPresetName = useMemo(
        () => chatPresets?.find((p) => p.id === selectedPresetId)?.name ?? "",
        [chatPresets, selectedPresetId],
    );

    const currentStep = STEPS[stepIndex];

    const canAdvance =
        (stepIndex === 0 && selectedPromptId !== null) ||
        (stepIndex === 1 && selectedPresetId !== null);

    return (
        <div className="relative flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <Link
                    to="/admin/utm"
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
                >
                    <ArrowLeftIcon className="size-3.5" />
                    Все ссылки
                </Link>
                <h1 className="font-heading text-[26px] font-extrabold tracking-tight text-foreground">
                    Новая UTM-ссылка
                </h1>
                <p className="text-[14px] text-muted-foreground">
                    Выберите шаблон промпта и пресет чатов для генерации ссылки.
                </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-1">
                {STEPS.map((step, idx) => {
                    const isCompleted = idx < stepIndex;
                    const isCurrent = idx === stepIndex;
                    return (
                        <div key={step.id} className="flex items-center gap-1 flex-1">
                            <button
                                type="button"
                                onClick={() => {
                                    if (idx < stepIndex) setStepIndex(idx);
                                }}
                                disabled={idx > stepIndex}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all w-full ${
                                    isCurrent
                                        ? "bg-primary text-primary-foreground"
                                        : isCompleted
                                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                          : "bg-secondary text-muted-foreground"
                                }`}
                            >
                                <span
                                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                        isCurrent
                                            ? "bg-white/20 text-primary-foreground"
                                            : isCompleted
                                              ? "bg-emerald-500 text-white"
                                              : "bg-muted-foreground/10 text-muted-foreground"
                                    }`}
                                >
                                    {isCompleted ? (
                                        <CheckIcon className="size-3.5" />
                                    ) : (
                                        idx + 1
                                    )}
                                </span>
                                {step.label}
                            </button>
                            {idx < STEPS.length - 1 && (
                                <div className="h-px w-4 bg-border shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step content */}
            <div className="min-h-[300px]">
                {currentStep.id === "prompt" && (
                    <AdminUtmPromptStep
                        selectedId={selectedPromptId}
                        onSelect={setSelectedPromptId}
                    />
                )}
                {currentStep.id === "preset" && (
                    <AdminUtmPresetStep
                        selectedId={selectedPresetId}
                        onSelect={setSelectedPresetId}
                    />
                )}
                {currentStep.id === "result" && selectedPromptId && selectedPresetId && (
                    <AdminUtmResultStep
                        promptTemplateId={selectedPromptId}
                        chatPresetId={selectedPresetId}
                        promptTemplateName={selectedPromptName}
                        chatPresetName={selectedPresetName}
                    />
                )}
            </div>

            {/* Navigation */}
            {stepIndex < 2 && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                        {stepIndex > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-10 rounded-xl px-5 text-[14px]"
                                onClick={() => setStepIndex((i) => i - 1)}
                            >
                                Назад
                            </Button>
                        )}
                    </div>
                    <Button
                        type="button"
                        className="h-10 rounded-xl px-6 text-[14px]"
                        disabled={!canAdvance}
                        onClick={() => setStepIndex((i) => i + 1)}
                    >
                        Далее
                    </Button>
                </div>
            )}

            {stepIndex === 2 && (
                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-10 rounded-xl px-5 text-[14px]"
                        onClick={() => setStepIndex(0)}
                    >
                        Начать заново
                    </Button>
                    <Link to="/admin/utm">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-xl px-5 text-[14px]"
                        >
                            К списку ссылок
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}

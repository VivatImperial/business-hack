import { useRef, useEffect, useCallback } from "react";
import {
    ArrowPathIcon,
    XMarkIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@/shared/ui/button";
import type {
    PromptAssistantUsage,
    PromptSafetyVerdict,
    PromptStepWithAssistant,
} from "@/features/settings/types";
import { Spinner } from "@/shared/ui/spinner";

const MIN_TEXTAREA_HEIGHT = 200;

function GradientSparklesIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={className}
        >
            <defs>
                <linearGradient
                    id="sparkles-grad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="#3b82f6">
                        <animate
                            attributeName="stop-color"
                            values="#3b82f6;#06b6d4;#3b82f6"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </stop>
                    <stop offset="50%" stopColor="#06b6d4">
                        <animate
                            attributeName="stop-color"
                            values="#06b6d4;#8b5cf6;#06b6d4"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </stop>
                    <stop offset="100%" stopColor="#3b82f6">
                        <animate
                            attributeName="stop-color"
                            values="#3b82f6;#06b6d4;#3b82f6"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </stop>
                </linearGradient>
            </defs>
            <path
                fill="url(#sparkles-grad)"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
            />
        </svg>
    );
}

function StatusBanner({ safety }: { safety?: PromptSafetyVerdict | null }) {
    let Icon: typeof CheckCircleIcon;
    let iconColor: string;
    let title: string;
    let description: string;

    if (safety?.blocked) {
        Icon = ExclamationCircleIcon;
        iconColor = "text-red-500";
        title = "Сканирование остановлено";
        description = safety.reason;
    } else if (safety?.status === "error") {
        Icon = ExclamationTriangleIcon;
        iconColor = "text-amber-500";
        title = "Автопроверка недоступна";
        description = safety.reason;
    } else {
        Icon = CheckCircleIcon;
        iconColor = "text-blue-500";
        title = "Критерии поиска";
        description =
            "Нейросеть анализирует каждое сообщение из подключённых чатов по вашим критериям. Опишите, кого считать лидом — система сделает остальное.";
    }

    return (
        <div className="rounded-2xl bg-muted/30 p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <Icon className={`size-5 shrink-0 ${iconColor}`} />
                <h4 className="text-[14px] font-semibold text-foreground">
                    {title}
                </h4>
            </div>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}

export function PromptsTab({
    activeStep,
    criteriaPrompt,
    onCriteriaPromptChange,
    onGeneratePrompt,
    generateDisabled,
    generateLoading,
    generatedResult,
    onAcceptGenerated,
    onRejectGenerated,
    canRevert,
    onRevertPrompt,
    usage,
}: {
    activeStep: PromptStepWithAssistant;
    criteriaPrompt: string;
    onCriteriaPromptChange: (v: string) => void;
    onGeneratePrompt: () => void;
    generateDisabled: boolean;
    generateLoading: boolean;
    generatedResult?: string | null;
    onAcceptGenerated: () => void;
    onRejectGenerated: () => void;
    canRevert: boolean;
    onRevertPrompt: () => void;
    usage?: PromptAssistantUsage | null;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const autoResize = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.max(el.scrollHeight, MIN_TEXTAREA_HEIGHT)}px`;
    }, []);

    useEffect(() => {
        autoResize();
    }, [criteriaPrompt, autoResize]);

    const hasText = criteriaPrompt.trim().length > 0;
    const showConfirmBar = Boolean(generatedResult);

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-8 animate-in fade-in duration-200 items-start">
            <div className="flex flex-col gap-6 flex-1">
                {activeStep.criteriaEditable && (
                    <section className="flex flex-col gap-3">
                        {/* Textarea wrapper with controls on top */}
                        <div className="rounded-2xl bg-muted/30 transition-all focus-within:bg-background focus-within:ring-1 focus-within:ring-border">
                            {/* Top toolbar */}
                            <div className="flex items-center justify-between px-4 py-2 border-b border-border/20">
                                <span className="text-[14px] font-semibold">
                                    Опишите своими словами кого искать
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {canRevert && (
                                        <button
                                            type="button"
                                            onClick={onRevertPrompt}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                        >
                                            <ArrowPathIcon className="size-3.5" />
                                            Вернуть
                                        </button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onGeneratePrompt}
                                        disabled={
                                            generateDisabled ||
                                            generateLoading ||
                                            !hasText
                                        }
                                        className="h-10 px-5 gap-2 rounded-xl border-dashed text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors [&_svg]:size-6"
                                    >
                                        {generateLoading ? (
                                            <Spinner className="size-6 animate-spin" />
                                        ) : (
                                            <GradientSparklesIcon className="size-6" />
                                        )}
                                        {generateLoading
                                            ? "Улучшаем..."
                                            : "Улучшить промпт"}
                                        {usage ? (
                                            <span className="text-[11px] font-normal text-muted-foreground/60 tabular-nums">
                                                {usage.remaining}/{usage.limit}
                                            </span>
                                        ) : null}
                                    </Button>
                                </div>
                            </div>

                            <textarea
                                ref={textareaRef}
                                value={criteriaPrompt}
                                onChange={(e) =>
                                    onCriteriaPromptChange(e.target.value)
                                }
                                className="w-full bg-transparent px-5 pt-4 pb-5 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 transition-all resize-none outline-none"
                                style={{
                                    minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
                                }}
                                placeholder="Например: ищем монтаж отопления в частных домах Новосибирска; вакансии, оффтоп и рекламу пропускать."
                            />
                        </div>

                        {/* Confirmation bar when generated result is ready */}
                        {showConfirmBar && (
                            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <span className="text-[13px] text-foreground font-medium">
                                    Текст улучшен. Заменить?
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={onRejectGenerated}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                    >
                                        <XMarkIcon className="size-3.5" />
                                        Отмена
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onAcceptGenerated}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-foreground text-background text-[12px] font-medium hover:bg-foreground/90 transition-colors"
                                    >
                                        <CheckIcon className="size-3.5" />
                                        Заменить
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>

            <div className="w-full lg:w-[320px] shrink-0">
                <StatusBanner safety={activeStep.assistant?.safety} />
            </div>
        </div>
    );
}

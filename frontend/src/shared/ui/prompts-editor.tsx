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
    PromptSafetyVerdict,
    PromptStepWithAssistant,
} from "@/features/settings/types";
import type { UsePromptsEditorReturn } from "@/shared/lib/use-prompts-editor";

import { motion, AnimatePresence } from "@/shared/animations/motion";
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

interface PromptsEditorProps {
    /** State + actions returned from `usePromptsEditor(tenantId)`. */
    editor: UsePromptsEditorReturn;
    /** Override the rendered step (e.g. when settings exposes a non-default tab). */
    activeStep?: PromptStepWithAssistant;
    /** Hide the side status banner — useful in narrow contexts (onboarding card). */
    hideStatusBanner?: boolean;
    className?: string;
}

export function PromptsEditor({
    editor,
    activeStep: stepOverride,
    hideStatusBanner,
    className,
}: PromptsEditorProps) {
    const activeStep = stepOverride ?? editor.activeStep;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const autoResize = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.max(el.scrollHeight, MIN_TEXTAREA_HEIGHT)}px`;
    }, []);

    useEffect(() => {
        autoResize();
    }, [editor.criteriaPrompt, autoResize]);

    if (!activeStep) return null;

    const hasText = editor.criteriaPrompt.trim().length > 0;
    const showConfirmBar = Boolean(editor.generatedResult);
    const wrapperClass = hideStatusBanner
        ? "flex flex-col gap-6 animate-in fade-in duration-200 items-start"
        : "flex flex-col-reverse lg:flex-row gap-8 animate-in fade-in duration-200 items-start";

    return (
        <div className={`${wrapperClass} ${className ?? ""}`.trim()}>
            <div className="flex flex-col px-1 gap-6 flex-1 w-full">
                {activeStep.criteriaEditable && (
                    <section className="flex flex-col gap-3">
                        <div className="rounded-xl md:rounded-2xl bg-muted/30 transition-all focus-within:bg-background focus-within:ring-1 focus-within:ring-border">
                            <div className="flex flex-row items-center justify-between px-3 md:px-4 py-2 border-b border-border/20">
                                <span className="text-[11px] text-muted-foreground/50 md:text-[14px] md:font-semibold md:text-foreground">
                                    {editor.canRevert ? (
                                        <button
                                            type="button"
                                            disabled={editor.generateLoading}
                                            onClick={editor.revertPrompt}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-white transition-colors"
                                        >
                                            <ArrowPathIcon className="size-3.5" />
                                            Вернуть
                                        </button>
                                    ) : (
                                        <>
                                            <span className="md:hidden">
                                                Кого искать
                                            </span>
                                            <span className="hidden md:inline">
                                                Опишите своими словами кого
                                                искать
                                            </span>
                                        </>
                                    )}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={editor.generate}
                                        disabled={
                                            editor.generateDisabled ||
                                            editor.generateLoading ||
                                            !hasText
                                        }
                                        className="h-9 md:h-10 px-3.5 md:px-5 gap-1.5 md:gap-2 rounded-xl border-dashed text-[13px] md:text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors [&_svg]:size-4 md:[&_svg]:size-6"
                                    >
                                        {editor.generateLoading ? (
                                            <Spinner className="size-4 md:size-6 animate-spin" />
                                        ) : (
                                            <GradientSparklesIcon className="size-4 md:size-6" />
                                        )}
                                        {editor.generateLoading
                                            ? "Улучшаем..."
                                            : "Улучшить промпт"}
                                        {editor.usage ? (
                                            <span className="text-[10px] md:text-[11px] font-normal text-muted-foreground/60 tabular-nums">
                                                {editor.usage.remaining}/
                                                {editor.usage.limit}
                                            </span>
                                        ) : null}
                                    </Button>
                                </div>
                            </div>

                            <textarea
                                ref={textareaRef}
                                value={editor.criteriaPrompt}
                                onChange={(e) =>
                                    editor.setCriteriaPrompt(e.target.value)
                                }
                                className="w-full bg-transparent px-4 md:px-5 pt-3 md:pt-4 pb-4 md:pb-5 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 transition-all resize-none outline-none"
                                style={{
                                    minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
                                }}
                                placeholder="Например: ищем монтаж отопления в частных домах Новосибирска; вакансии, оффтоп и рекламу пропускать."
                            />
                        </div>

                        <AnimatePresence>
                            {showConfirmBar && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-between gap-2 md:gap-3 rounded-xl bg-muted/40 px-3 md:px-4 py-2.5 md:py-3"
                            >
                                <span className="text-[13px] text-foreground font-medium">
                                    <span className="md:hidden">
                                        Заменить текст?
                                    </span>
                                    <span className="hidden md:inline">
                                        Текст улучшен. Заменить?
                                    </span>
                                </span>
                                <div className="flex items-center gap-1 md:gap-1.5">
                                    <button
                                        type="button"
                                        onClick={editor.rejectGenerated}
                                        className="flex items-center gap-1 px-2.5 md:px-3 py-1.5 rounded-xl text-[12px] font-medium text-muted-foreground active:text-foreground md:hover:text-foreground md:hover:bg-muted/60 transition-colors"
                                    >
                                        <XMarkIcon className="size-3.5" />
                                        <span className="md:hidden">Нет</span>
                                        <span className="hidden md:inline">
                                            Отмена
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={editor.acceptGenerated}
                                        className="flex items-center gap-1 px-2.5 md:px-3 py-1.5 rounded-xl bg-foreground text-background text-[12px] font-medium md:hover:bg-foreground/90 transition-colors"
                                    >
                                        <CheckIcon className="size-3.5" />
                                        Заменить
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </section>
                )}
            </div>

            {!hideStatusBanner && (
                <div className="w-full lg:w-[320px] shrink-0">
                    <StatusBanner safety={activeStep.assistant?.safety} />
                </div>
            )}
        </div>
    );
}

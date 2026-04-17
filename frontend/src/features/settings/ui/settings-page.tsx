import { useEffect, useState } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { InformationCircleIcon, ChatBubbleLeftRightIcon, AdjustmentsHorizontalIcon, CircleStackIcon } from "@heroicons/react/24/solid";
import { useQueryClient } from "@tanstack/react-query";

import {
    useGetSettingsApiV1AdminSettingsGet as useGetSettings,
    useUpdateSettingsApiV1AdminSettingsPut as useUpdateSettings,
    getGetSettingsApiV1AdminSettingsGetQueryKey as getGetSettingsQueryKey,
} from "@/lib/api/generated/admin-settings/admin-settings";
import type { AssistantSettingsResponse as AssistantSettings } from "@/lib/api/generated/schemas";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";

function formInitial(settings: AssistantSettings | undefined): AssistantSettings {
    return {
        tone_of_voice: settings?.tone_of_voice ?? "",
        confidence_threshold: settings?.confidence_threshold ?? 0.5,
        top_k: settings?.top_k ?? 5,
        use_articles: settings?.use_articles ?? true,
    };
}

export function SettingsPage() {
    const qc = useQueryClient();
    const { show, showError } = useSnackbar();
    const settingsQuery = useGetSettings();
    const settings =
        settingsQuery.data?.status === 200
            ? settingsQuery.data.data
            : undefined;

    const [form, setForm] = useState<AssistantSettings>(() =>
        formInitial(settings),
    );
    const [editingTone, setEditingTone] = useState(false);

    useEffect(() => {
        if (settings) {
            setForm(formInitial(settings));
        }
    }, [settings]);

    const updateMutation = useUpdateSettings({
        mutation: {
            onSuccess: () => {
                show("Настройки сохранены");
                qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
                setEditingTone(false);
            },
            onError: (err) => {
                showError(
                    err instanceof Error
                        ? err.message
                        : "Не удалось сохранить настройки",
                );
            },
        },
    });

    const save = (next: AssistantSettings) => {
        updateMutation.mutate({ data: next });
    };

    const setUseArticles = (value: boolean) => {
        const next = { ...form, use_articles: value };
        setForm(next);
        save(next);
    };

    if (settingsQuery.isLoading) {
        return (
            <div className="flex flex-col gap-6 p-6 md:p-10 max-w-[1400px] w-full mx-auto">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-16 rounded-xl" />
                    <Skeleton className="h-16 rounded-xl" />
                    <Skeleton className="h-16 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-6 md:p-10 max-w-[1400px] w-full mx-auto animate-fade-in-up">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-foreground">Настройка</h1>
                <p className="text-sm text-muted-foreground">
                    Управление поведением и параметрами AI-ассистента
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Tone of voice */}
                    <section className="flex flex-col gap-4 bg-card rounded-2xl p-6 ring-1 ring-border shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <ChatBubbleLeftRightIcon className="size-5" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-base font-medium text-foreground">
                                        Tone of Voice
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Инструкция для формирования стиля ответов
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (editingTone) {
                                        save(form);
                                    } else {
                                        setEditingTone(true);
                                    }
                                }}
                                disabled={updateMutation.isPending}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-navy-800 transition-colors disabled:opacity-50"
                            >
                                {editingTone ? "Сохранить" : "Изменить"}
                                <PencilSquareIcon className="size-4" />
                            </button>
                        </div>
                        <div className="relative">
                            <textarea
                                id="tone"
                                value={form.tone_of_voice}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, tone_of_voice: e.target.value }))
                                }
                                placeholder="Пиши в дружелюбном стиле, но без понебратства"
                                disabled={!editingTone || updateMutation.isPending}
                                className={cn(
                                    "w-full min-h-[120px] resize-none rounded-xl p-4 text-[15px] leading-relaxed transition-colors",
                                    editingTone 
                                        ? "bg-background ring-1 ring-border focus:ring-2 focus:ring-primary outline-none" 
                                        : "bg-secondary/50 text-muted-foreground cursor-default outline-none"
                                )}
                            />
                        </div>
                    </section>

                    {/* Threshold / Top K */}
                    <section className="flex flex-col gap-6 bg-card rounded-2xl p-6 ring-1 ring-border shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <AdjustmentsHorizontalIcon className="size-5" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-base font-medium text-foreground">
                                    Параметры генерации
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Настройка точности и вариативности ответов
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <NumericField
                                label="Порог отсечения"
                                hint="Минимальная уверенность (0..1), чтобы ассистент ответил."
                                value={form.confidence_threshold}
                                min={0}
                                max={1}
                                step={0.01}
                                formatDisplay={(v) => v.toFixed(2)}
                                disabled={updateMutation.isPending}
                                onCommit={(v) => {
                                    const next = { ...form, confidence_threshold: v };
                                    setForm(next);
                                    save(next);
                                }}
                            />

                            <NumericField
                                label="Top K"
                                hint="Сколько кандидатов брать из поиска."
                                value={form.top_k}
                                min={1}
                                max={50}
                                step={1}
                                formatDisplay={(v) => String(Math.round(v))}
                                disabled={updateMutation.isPending}
                                onCommit={(v) => {
                                    const next = { ...form, top_k: Math.round(v) };
                                    setForm(next);
                                    save(next);
                                }}
                            />
                        </div>
                    </section>
                </div>

                {/* Sidebar settings */}
                <div className="flex flex-col gap-6">
                    <section className="flex flex-col gap-4 bg-card rounded-2xl p-6 ring-1 ring-border shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <CircleStackIcon className="size-5" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-base font-medium text-foreground">
                                    База знаний
                                </h2>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 mt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                    <span>Использовать статьи</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                                            >
                                                <InformationCircleIcon className="size-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Использовать базу знаний при поиске ответов.
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => setUseArticles(true)}
                                    disabled={updateMutation.isPending}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                        form.use_articles
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                            : "border-border bg-background hover:border-muted-foreground/30",
                                    )}
                                >
                                    <div className={cn(
                                        "size-4 rounded-full border flex items-center justify-center shrink-0",
                                        form.use_articles ? "border-primary" : "border-muted-foreground/40"
                                    )}>
                                        {form.use_articles && <div className="size-2 rounded-full bg-primary" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn("text-sm font-medium", form.use_articles ? "text-primary" : "text-foreground")}>
                                            Включено
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Ассистент ищет ответы в статьях
                                        </span>
                                    </div>
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setUseArticles(false)}
                                    disabled={updateMutation.isPending}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                        !form.use_articles
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                            : "border-border bg-background hover:border-muted-foreground/30",
                                    )}
                                >
                                    <div className={cn(
                                        "size-4 rounded-full border flex items-center justify-center shrink-0",
                                        !form.use_articles ? "border-primary" : "border-muted-foreground/40"
                                    )}>
                                        {!form.use_articles && <div className="size-2 rounded-full bg-primary" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn("text-sm font-medium", !form.use_articles ? "text-primary" : "text-foreground")}>
                                            Выключено
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Ответы только на базе тикетов
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

interface NumericFieldProps {
    label: string;
    hint: string;
    value: number;
    min: number;
    max: number;
    step: number;
    disabled?: boolean;
    formatDisplay: (v: number) => string;
    onCommit: (v: number) => void;
}

function NumericField({
    label,
    hint,
    value,
    min,
    max,
    step,
    disabled,
    formatDisplay,
    onCommit,
}: NumericFieldProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(() => formatDisplay(value));

    useEffect(() => {
        if (!editing) {
            setDraft(formatDisplay(value));
        }
    }, [value, editing, formatDisplay]);

    const commit = () => {
        const parsed = Number(draft.replace(",", "."));
        if (Number.isNaN(parsed)) {
            setDraft(formatDisplay(value));
            setEditing(false);
            return;
        }
        const clamped = Math.min(max, Math.max(min, parsed));
        onCommit(clamped);
        setEditing(false);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>{label}</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                            <InformationCircleIcon className="size-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>{hint}</TooltipContent>
                </Tooltip>
            </div>
            <div className="relative">
                <Input
                    inputMode="decimal"
                    disabled={disabled}
                    value={editing ? draft : formatDisplay(value)}
                    onFocus={() => setEditing(true)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.currentTarget.blur();
                        }
                        if (e.key === "Escape") {
                            setDraft(formatDisplay(value));
                            setEditing(false);
                            e.currentTarget.blur();
                        }
                    }}
                    onChange={(e) => setDraft(e.target.value)}
                    className="h-14 bg-card pr-12"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none text-xs">
                    {min.toString()}–{max.toString()}
                    <span className="sr-only">{step}</span>
                </div>
            </div>
        </div>
    );
}

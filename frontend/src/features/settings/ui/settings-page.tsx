import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
    useGetSettingsApiV1AdminSettingsGet as useGetSettings,
    useUpdateSettingsApiV1AdminSettingsPut as useUpdateSettings,
    getGetSettingsApiV1AdminSettingsGetQueryKey as getGetSettingsQueryKey,
} from "@/lib/api/generated/admin-settings/admin-settings";
import type { AssistantSettingsResponse as AssistantSettings } from "@/lib/api/generated/schemas";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
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
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (settings && !isDirty) {
            setForm(formInitial(settings));
        }
    }, [settings, isDirty]);

    const updateMutation = useUpdateSettings({
        mutation: {
            onSuccess: () => {
                show("Настройки сохранены");
                qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
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

    useEffect(() => {
        if (!isDirty) return;
        const timer = setTimeout(() => {
            updateMutation.mutate({ data: form });
            setIsDirty(false);
        }, 1000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form, isDirty]);

    const setUseArticles = (value: boolean) => {
        const next = { ...form, use_articles: value };
        setForm(next);
        updateMutation.mutate({ data: next });
        setIsDirty(false);
    };

    if (settingsQuery.isLoading) {
        return (
            <div className="flex flex-col gap-6 p-6 md:p-10 max-w-[1400px] w-full mx-auto">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <Skeleton className="h-[600px] max-w-[800px] rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6 md:p-10 max-w-[1400px] w-full mx-auto animate-fade-in-up">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-foreground">Настройка</h1>
                <p className="text-sm text-muted-foreground">
                    Управление поведением и параметрами AI-ассистента
                </p>
            </div>

            <div className="flex flex-col gap-8 max-w-[800px] bg-card rounded-2xl p-6 md:p-8 shadow-card">
                {/* Tone of voice */}
                <section className="flex flex-col gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-base font-medium text-foreground">
                            Tone of Voice
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Инструкция для формирования стиля ответов
                        </p>
                    </div>
                    <div className="relative">
                        <textarea
                            id="tone"
                            value={form.tone_of_voice}
                            onChange={(e) => {
                                setForm((s) => ({ ...s, tone_of_voice: e.target.value }));
                                setIsDirty(true);
                            }}
                            placeholder="Пиши в дружелюбном стиле, но без понебратства"
                            disabled={updateMutation.isPending}
                            className="w-full min-h-[120px] resize-none rounded-xl p-4 text-[15px] leading-relaxed transition-colors bg-background ring-1 ring-border focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                </section>

                <div className="h-px w-full bg-border" />

                {/* Threshold / Top K */}
                <section className="flex flex-col gap-6">
                    <div className="flex flex-col">
                        <h2 className="text-base font-medium text-foreground">
                            Параметры генерации
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Настройка точности и вариативности ответов
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <NumericField
                            label="Порог отсечения"
                            hint="Минимальная уверенность (0..1), чтобы ассистент ответил."
                            value={form.confidence_threshold}
                            min={0}
                            max={1}
                            formatDisplay={(v) => v.toFixed(2)}
                            disabled={updateMutation.isPending}
                            onCommit={(v) => {
                                setForm((s) => ({ ...s, confidence_threshold: v }));
                                setIsDirty(true);
                            }}
                        />

                        <NumericField
                            label="Top K"
                            hint="Сколько кандидатов брать из поиска."
                            value={form.top_k}
                            min={1}
                            max={50}
                            formatDisplay={(v) => String(Math.round(v))}
                            disabled={updateMutation.isPending}
                            onCommit={(v) => {
                                setForm((s) => ({ ...s, top_k: Math.round(v) }));
                                setIsDirty(true);
                            }}
                        />
                    </div>
                </section>

                <div className="h-px w-full bg-border" />

                {/* Sidebar settings */}
                <section className="flex flex-col gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-base font-medium text-foreground">
                            База знаний
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Использовать базу знаний при поиске ответов
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setUseArticles(true)}
                            disabled={updateMutation.isPending}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
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
                                "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
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
                </section>
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

    const commit = (currentDraft: string) => {
        const parsed = Number(currentDraft.replace(",", "."));
        if (Number.isNaN(parsed) || currentDraft.trim() === "") {
            return;
        }
        const clamped = Math.min(max, Math.max(min, parsed));
        onCommit(clamped);
    };

    useEffect(() => {
        if (editing) {
            const timer = setTimeout(() => {
                commit(draft);
            }, 750);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft, editing]);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {min.toString()}–{max.toString()}
                    </span>
                </div>
                <span className="text-xs text-muted-foreground">{hint}</span>
            </div>
            <div className="relative">
                <Input
                    inputMode="decimal"
                    disabled={disabled}
                    value={editing ? draft : formatDisplay(value)}
                    onFocus={() => setEditing(true)}
                    onBlur={() => {
                        commit(draft);
                        setEditing(false);
                    }}
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
                    className="h-12 bg-background"
                />
            </div>
        </div>
    );
}

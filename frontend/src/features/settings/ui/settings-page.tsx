import { useEffect, useMemo, useState } from "react";
import { CheckIcon } from "@heroicons/react/24/solid";
import type { AssistantSettingsResponse as AssistantSettings } from "@/lib/api/generated/schemas";
import { Input } from "@/shared/ui/input";
import { cn } from "@/lib/utils";

const SETTINGS_DRAFT_KEY = "admin-settings-draft";

function formInitial(
    settings: AssistantSettings | undefined,
): AssistantSettings {
    return {
        tone_of_voice: settings?.tone_of_voice ?? "",
        confidence_threshold: settings?.confidence_threshold ?? 0.5,
        top_k: settings?.top_k ?? 5,
        use_articles: settings?.use_articles ?? true,
    };
}

export function SettingsPage() {
    const [form, setForm] = useState<AssistantSettings>(() =>
        formInitial(undefined),
    );
    const [isLoaded, setIsLoaded] = useState(false);
    const [savePulse, setSavePulse] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        try {
            const raw = window.localStorage.getItem(SETTINGS_DRAFT_KEY);
            if (!raw) {
                setIsLoaded(true);
                return;
            }
            const parsed = JSON.parse(raw) as Partial<AssistantSettings>;
            setForm({
                tone_of_voice:
                    typeof parsed.tone_of_voice === "string"
                        ? parsed.tone_of_voice
                        : "",
                confidence_threshold:
                    typeof parsed.confidence_threshold === "number"
                        ? parsed.confidence_threshold
                        : 0.5,
                top_k:
                    typeof parsed.top_k === "number" ? parsed.top_k : 5,
                use_articles:
                    typeof parsed.use_articles === "boolean"
                        ? parsed.use_articles
                        : true,
            });
        } catch {
            // Ignore corrupted local draft and fall back to defaults.
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded || typeof window === "undefined") {
            return;
        }
        window.localStorage.setItem(SETTINGS_DRAFT_KEY, JSON.stringify(form));
        setSavePulse(true);
        const timer = window.setTimeout(() => setSavePulse(false), 1200);
        return () => window.clearTimeout(timer);
    }, [form, isLoaded]);

    const disabledNotice = useMemo(
        () =>
            "В целях безопасности синхронизация с backend отключена. Изменения сохраняются только локально в браузере и не влияют на production pipeline.",
        [],
    );

    const setUseArticles = (value: boolean) => {
        setForm((current) => ({ ...current, use_articles: value }));
    };

    const saveBadge = (() => {
        if (!isLoaded) {
            return (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--brand-text-dim)]">
                    <span className="size-1.5 animate-pulse rounded-full bg-[var(--brand-accent)]" />
                    Загружаем черновик…
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-emerald-600">
                <CheckIcon
                    className={cn("size-3.5", savePulse && "animate-pulse")}
                />
                Локальный черновик
            </span>
        );
    })();

    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-6 md:p-10">
            <header className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-heading text-3xl font-semibold tracking-tight text-[var(--brand-ink)] md:text-[34px]">
                        Настройки
                    </h1>
                    {saveBadge}
                </div>
                <p className="text-[14px] text-[var(--brand-text-dim)]">
                    Управление поведением и параметрами AI-ассистента.
                </p>
            </header>

            <div className="max-w-[820px] rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <div className="font-semibold">Настройки отключены от backend</div>
                <div className="mt-1">{disabledNotice}</div>
            </div>

            <div className="flex max-w-[820px] flex-col gap-8 rounded-2xl border border-[var(--brand-border)] bg-white p-6 md:p-8">
                {/* Tone of voice */}
                <Section
                    title="Tone of Voice"
                    description="Инструкция для формирования стиля ответов."
                >
                    <textarea
                        id="tone"
                        value={form.tone_of_voice}
                        onChange={(e) => {
                            setForm((s) => ({
                                ...s,
                                tone_of_voice: e.target.value,
                            }));
                        }}
                        placeholder="Пиши дружелюбно, но без панибратства"
                        className="w-full min-h-[120px] resize-none rounded-xl border border-[var(--brand-border)] bg-white px-4 py-3 text-[15px] leading-relaxed text-[var(--brand-ink)] outline-none transition-colors placeholder:text-[var(--brand-text-dim)]/60 focus:border-[var(--brand-accent)]"
                    />
                </Section>

                <Divider />

                {/* Generation params */}
                <Section
                    title="Параметры генерации"
                    description="Точность и вариативность ответов."
                >
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <NumericField
                            label="Порог отсечения"
                            hint="Минимальная уверенность (0..1), чтобы ассистент ответил"
                            value={form.confidence_threshold}
                            min={0}
                            max={1}
                            formatDisplay={(v) => v.toFixed(2)}
                            onCommit={(v) => {
                                setForm((s) => ({
                                    ...s,
                                    confidence_threshold: v,
                                }));
                            }}
                        />

                        <NumericField
                            label="Top K"
                            hint="Сколько кандидатов брать из поиска"
                            value={form.top_k}
                            min={1}
                            max={50}
                            formatDisplay={(v) => String(Math.round(v))}
                            onCommit={(v) => {
                                setForm((s) => ({
                                    ...s,
                                    top_k: Math.round(v),
                                }));
                            }}
                        />
                    </div>
                </Section>

                <Divider />

                {/* KB toggle */}
                <Section
                    title="База знаний"
                    description="Использовать базу знаний при поиске ответов."
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <RadioCard
                            selected={form.use_articles}
                            onClick={() => setUseArticles(true)}
                            title="Включено"
                            description="Ассистент ищет ответы и в статьях KB"
                        />
                        <RadioCard
                            selected={!form.use_articles}
                            onClick={() => setUseArticles(false)}
                            title="Выключено"
                            description="Только история обращений"
                        />
                    </div>
                </Section>
            </div>
        </div>
    );
}

/* ─── Sub-components ─── */

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-col">
                <h2 className="font-heading text-[16px] font-semibold text-[var(--brand-ink)]">
                    {title}
                </h2>
                {description && (
                    <p className="text-[13px] text-[var(--brand-text-dim)]">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}

function Divider() {
    return <div className="h-px w-full bg-[var(--brand-border)]" />;
}

interface RadioCardProps {
    selected: boolean;
    onClick: () => void;
    title: string;
    description: string;
    disabled?: boolean;
}

function RadioCard({
    selected,
    onClick,
    title,
    description,
    disabled,
}: RadioCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                selected
                    ? "border-[var(--brand-accent)] bg-[var(--brand-accent-soft)]"
                    : "border-[var(--brand-border)] bg-white hover:border-[var(--brand-sage-deep)]",
                disabled && "cursor-not-allowed opacity-60",
            )}
        >
            <span
                className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                    selected
                        ? "border-[var(--brand-accent)]"
                        : "border-[var(--brand-border)]",
                )}
            >
                {selected && (
                    <span className="size-2 rounded-full bg-[var(--brand-accent)]" />
                )}
            </span>
            <span className="flex flex-col">
                <span
                    className={cn(
                        "text-[14px] font-medium",
                        selected
                            ? "text-[var(--brand-accent-deep)]"
                            : "text-[var(--brand-ink)]",
                    )}
                >
                    {title}
                </span>
                <span className="text-[12px] text-[var(--brand-text-dim)]">
                    {description}
                </span>
            </span>
        </button>
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
                    <span className="text-[14px] font-medium text-[var(--brand-ink)]">
                        {label}
                    </span>
                    <span className="inline-flex items-center rounded-md !border border-[var(--brand-border)] bg-[var(--brand-cream)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--brand-text-dim)]">
                        {min}–{max}
                    </span>
                </div>
                <span className="text-[12px] text-[var(--brand-text-dim)]">
                    {hint}
                </span>
            </div>
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
                className="h-11 !border border-[var(--brand-border)] bg-white focus:border-[var(--brand-accent)]"
            />
        </div>
    );
}

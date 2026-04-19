import { useRouter } from "@tanstack/react-router";
import { XMarkIcon, InboxIcon } from "@heroicons/react/24/solid";
import { Route as AppealsRoute } from "@/routes/_app.appeals";

import {
    useListAppealsApiV1AdminAppealsGet as useListAppeals,
    useTakeAppealApiV1AdminAppealsAppealIdTakePost as useTakeAppeal,
    useCloseAppealApiV1AdminAppealsAppealIdClosePost as useCloseAppeal,
    getListAppealsApiV1AdminAppealsGetQueryKey as getListAppealsQueryKey,
} from "@/lib/api/generated/admin-appeals/admin-appeals";
import {
    AppealListItemResponseScope as AppealScopeFilter,
    AppealListItemResponseStatus as AppealStatus,
} from "@/lib/api/generated/schemas";
import type {
    AppealListItemResponse as GeneratedAppealListItem,
    ListAppealsApiV1AdminAppealsGetParams as ListAppealsParams,
} from "@/lib/api/generated/schemas";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { useSnackbar } from "@/hooks/use-snackbar";
import { useQueryClient } from "@tanstack/react-query";
import { AppealCard } from "@/features/appeals/ui/appeal-card";
import { ApiError } from "@/lib/api/client";
import { motion } from "@/shared/animations/motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";

type AppealListItem = GeneratedAppealListItem & {
    rating_request_sent?: boolean;
};

const SCOPE_TABS: Array<{ key: string; label: string }> = [
    { key: "all", label: "Все" },
    { key: AppealScopeFilter.assistant, label: "Ассистент" },
    { key: AppealScopeFilter.ticket, label: "Оператор" },
];

type StatusKey = "all" | "open" | "in_progress" | "closed";
const STATUS_TABS: Array<{ key: StatusKey; label: string }> = [
    { key: "all", label: "Все" },
    { key: "open", label: "Открытые" },
    { key: "in_progress", label: "В работе" },
    { key: "closed", label: "Закрытые" },
];

type AppealsSearchInput = ReturnType<typeof AppealsRoute.useSearch>;

function statusFromSearch(search: AppealsSearchInput): {
    filterStatus: StatusKey;
} {
    if (search.status === AppealStatus.open) return { filterStatus: "open" };
    if (search.status === AppealStatus.in_progress)
        return { filterStatus: "in_progress" };
    if (search.status === AppealStatus.closed)
        return { filterStatus: "closed" };
    return { filterStatus: "all" };
}

export function AppealsPage() {
    const router = useRouter();
    const navigate = AppealsRoute.useNavigate();
    const search = AppealsRoute.useSearch();
    const qc = useQueryClient();
    const { show, showError } = useSnackbar();

    const scope = search.scope ?? "all";
    const { filterStatus } = statusFromSearch(search);

    const params: ListAppealsParams = {
        scope: scope === "all" ? undefined : scope,
        date_from: search.date_from,
        date_to: search.date_to,
    };
    if (filterStatus === "in_progress") {
        params.status = AppealStatus.in_progress;
    } else if (filterStatus === "closed") {
        params.status = AppealStatus.closed;
    }

    const appealsQuery = useListAppeals(params);
    const items: AppealListItem[] =
        appealsQuery.data?.status === 200 ? appealsQuery.data.data.items : [];

    // Client-side filter for "open" — API only accepts in_progress/closed filter.
    const filteredItems =
        filterStatus === "open"
            ? items.filter((it) => it.status === AppealStatus.open)
            : items;

    const takeMutation = useTakeAppeal({
        mutation: {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: getListAppealsQueryKey() });
                show("Обращение взято в работу");
            },
            onError: (err) => {
                if (err instanceof ApiError && err.status === 409) {
                    showError("Обращение уже закрыто");
                    return;
                }
                showError(
                    err instanceof Error
                        ? err.message
                        : "Не удалось взять обращение",
                );
            },
        },
    });

    const closeMutation = useCloseAppeal({
        mutation: {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: getListAppealsQueryKey() });
                show("Обращение закрыто, запрос оценки отправлен");
            },
            onError: (err) => {
                showError(
                    err instanceof Error
                        ? err.message
                        : "Не удалось закрыть обращение",
                );
            },
        },
    });

    const setScope = (next: string) => {
        navigate({
            search: (prev) => ({ ...prev, scope: next }),
            replace: true,
        });
    };

    const setStatus = (next: StatusKey) => {
        navigate({
            search: (prev) => ({
                ...prev,
                status:
                    next === "open"
                        ? AppealStatus.open
                        : next === "in_progress"
                          ? AppealStatus.in_progress
                          : next === "closed"
                            ? AppealStatus.closed
                            : undefined,
            }),
            replace: true,
        });
    };

    const resetFilters = () => {
        navigate({ search: {}, replace: true });
    };

    const hasActiveFilters = scope !== "all" || search.status;

    // Counts for the header — quick visual summary
    const total = items.length;
    const openCount = items.filter((i) => i.status === AppealStatus.open).length;

    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-6 md:p-10">
            <header className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-heading text-3xl font-semibold tracking-tight text-[var(--brand-ink)] md:text-[34px]">
                        Обращения
                    </h1>
                    {!appealsQuery.isLoading && total > 0 && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-[12px] font-medium text-[var(--brand-text-dim)]">
                            Всего{" "}
                            <span className="font-semibold text-[var(--brand-ink)]">
                                {total}
                            </span>
                            {openCount > 0 && (
                                <>
                                    <span className="text-[var(--brand-border)]">
                                        ·
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="size-1.5 rounded-full bg-amber-400" />
                                        {openCount} открыто
                                    </span>
                                </>
                            )}
                        </span>
                    )}
                </div>
                <p className="text-[14px] text-[var(--brand-text-dim)]">
                    Очередь обращений сотрудников. Берите в работу и закрывайте
                    после ответа.
                </p>
            </header>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:gap-6">
                    <FilterGroup
                        label="Решает"
                        options={SCOPE_TABS}
                        value={scope}
                        onChange={setScope}
                    />
                    <FilterGroup
                        label="Статус"
                        options={STATUS_TABS}
                        value={filterStatus}
                        onChange={setStatus}
                    />
                </div>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--brand-border)] bg-white px-3 py-1.5 text-[13px] font-medium text-[var(--brand-text-dim)] transition-colors hover:border-[var(--brand-sage-deep)] hover:text-[var(--brand-ink)]"
                    >
                        Сбросить
                        <XMarkIcon className="size-3.5" />
                    </button>
                )}
            </div>

            {appealsQuery.isLoading ? (
                <AppealsSkeleton />
            ) : appealsQuery.isError ? (
                <AppealsError onRetry={() => router.invalidate()} />
            ) : filteredItems.length === 0 ? (
                <AppealsEmpty hasFilters={Boolean(hasActiveFilters)} />
            ) : (
                <AppealsList
                    items={filteredItems}
                    onTake={(id) => takeMutation.mutate({ appealId: id })}
                    onClose={(id) => closeMutation.mutate({ appealId: id })}
                    takingId={
                        takeMutation.isPending
                            ? takeMutation.variables?.appealId
                            : undefined
                    }
                    closingId={
                        closeMutation.isPending
                            ? closeMutation.variables?.appealId
                            : undefined
                    }
                    onGoToChat={(id) =>
                        router.navigate({
                            to: "/chat/$chatId",
                            params: { chatId: id },
                        })
                    }
                />
            )}
        </div>
    );
}

interface AppealsListProps {
    items: AppealListItem[];
    onTake: (id: string) => void;
    onClose: (id: string) => void;
    onGoToChat: (id: string) => void;
    takingId: string | undefined;
    closingId: string | undefined;
}

/**
 * List with @formkit/auto-animate — items smoothly reflow on filter change.
 * No motion wrappers per item, no AnimatePresence orchestration — the library
 * handles FLIP-style transitions via a single ref.
 */
function AppealsList({
    items,
    onTake,
    onClose,
    onGoToChat,
    takingId,
    closingId,
}: AppealsListProps) {
    const [parent] = useAutoAnimate<HTMLDivElement>({
        duration: 220,
        easing: "ease-out",
    });

    return (
        <div ref={parent} className="flex flex-col gap-3">
            {items.map((item) => (
                <AppealCard
                    key={item.id}
                    item={item}
                    onTake={() => onTake(item.id)}
                    onClose={() => onClose(item.id)}
                    onGoToChat={() => onGoToChat(item.id)}
                    isTaking={takingId === item.id}
                    isClosing={closingId === item.id}
                />
            ))}
        </div>
    );
}

/* ─── Sub-components ─── */

interface FilterGroupProps<V extends string> {
    label: string;
    options: ReadonlyArray<{ key: V; label: string }>;
    value: V;
    onChange: (v: V) => void;
}

function FilterGroup<V extends string>({
    label,
    options,
    value,
    onChange,
}: FilterGroupProps<V>) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-text-dim)]">
                {label}
            </span>
            <div className="relative inline-flex w-fit items-center gap-1 rounded-xl border border-[var(--brand-border)] bg-white p-1">
                {options.map((opt) => {
                    const isActive = value === opt.key;
                    return (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => onChange(opt.key)}
                            className={cn(
                                "relative z-10 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                                isActive
                                    ? "text-white"
                                    : "text-[var(--brand-text-dim)] hover:text-[var(--brand-ink)]",
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId={`filter-${label}`}
                                    className="absolute inset-0 -z-10 rounded-lg bg-[var(--brand-dark)]"
                                    transition={{
                                        type: "spring",
                                        bounce: 0.18,
                                        duration: 0.45,
                                    }}
                                />
                            )}
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function AppealsSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-[var(--brand-border)] bg-white p-5 md:p-6"
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <div className="h-6 w-20 animate-shimmer rounded-full" />
                            <div className="h-6 w-24 animate-shimmer rounded-full" />
                            <div className="h-6 w-28 animate-shimmer rounded-full" />
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="flex flex-col gap-2">
                                <div className="h-5 w-32 animate-shimmer rounded-md" />
                                <div className="h-4 w-40 animate-shimmer rounded-md" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-10 w-28 animate-shimmer rounded-lg" />
                                <div className="h-10 w-36 animate-shimmer rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface AppealsErrorProps {
    onRetry: () => void;
}

function AppealsError({ onRetry }: AppealsErrorProps) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--brand-border)] bg-white p-10 text-center">
            <p className="text-[14px] text-[var(--brand-text-dim)]">
                Не удалось загрузить обращения.
            </p>
            <Button
                variant="outline"
                onClick={onRetry}
                className="border-[var(--brand-border)] bg-white text-[var(--brand-text)]"
            >
                Повторить
            </Button>
        </div>
    );
}

function AppealsEmpty({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-cream)] p-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[var(--brand-accent-soft)] text-[var(--brand-accent)]">
                <InboxIcon className="size-5" />
            </span>
            <p className="font-heading text-[16px] font-semibold text-[var(--brand-ink)]">
                {hasFilters
                    ? "Нет обращений по выбранным фильтрам"
                    : "Очередь пуста"}
            </p>
            <p className="max-w-sm text-[13px] text-[var(--brand-text-dim)]">
                {hasFilters
                    ? "Сбросьте фильтры или выберите другой статус."
                    : "Новые обращения появятся здесь, как только сотрудники напишут ассистенту."}
            </p>
        </div>
    );
}

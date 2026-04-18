import { useRouter } from "@tanstack/react-router";
import { XMarkIcon } from "@heroicons/react/24/solid";
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
    AppealListItemResponse as AppealListItem,
    ListAppealsApiV1AdminAppealsGetParams as ListAppealsParams,
} from "@/lib/api/generated/schemas";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import { useSnackbar } from "@/hooks/use-snackbar";
import { useQueryClient } from "@tanstack/react-query";
import { AppealCard } from "@/features/appeals/ui/appeal-card";
import { ApiError } from "@/lib/api/client";

const SCOPE_TABS: Array<{ key: string; label: string }> = [
    { key: "all", label: "Все" },
    { key: AppealScopeFilter.assistant, label: "Ассистент" },
    { key: AppealScopeFilter.ticket, label: "Менеджер" },
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

    // Client-side filter for "open" because the API only accepts in_progress/closed as filter
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
                show("Обращение закрыто");
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

    return (
        <div className="flex flex-col gap-6 p-6 md:p-10 max-w-[1400px] w-full mx-auto animate-fade-in-up">
            <h1 className="text-2xl font-semibold text-foreground">
                Обращения
            </h1>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:gap-6">
                    <FilterGroup
                        label="Оператор"
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
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Сбросить
                        <XMarkIcon className="size-4" />
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {appealsQuery.isLoading ? (
                    <>
                        <div className="rounded-2xl bg-card p-5 md:p-6 shadow-card">
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-20 rounded-md" />
                                    <Skeleton className="h-6 w-24 rounded-md" />
                                    <Skeleton className="h-6 w-28 rounded-md" />
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-10 w-32 rounded-lg" />
                                        <Skeleton className="h-10 w-36 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-card p-5 md:p-6 shadow-card">
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-24 rounded-md" />
                                    <Skeleton className="h-6 w-20 rounded-md" />
                                    <Skeleton className="h-6 w-32 rounded-md" />
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-4 w-36" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-10 w-32 rounded-lg" />
                                        <Skeleton className="h-10 w-36 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-card p-5 md:p-6 shadow-card">
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-16 rounded-md" />
                                    <Skeleton className="h-6 w-28 rounded-md" />
                                    <Skeleton className="h-6 w-24 rounded-md" />
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-5 w-28" />
                                        <Skeleton className="h-4 w-44" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-10 w-32 rounded-lg" />
                                        <Skeleton className="h-10 w-36 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : appealsQuery.isError ? (
                    <div className="rounded-2xl bg-card p-8 shadow-card flex flex-col items-center gap-3 text-center">
                        <p className="text-muted-foreground">
                            Не удалось загрузить обращения.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => router.invalidate()}
                        >
                            Повторить
                        </Button>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="rounded-2xl bg-card p-12 shadow-card text-center">
                        <p className="text-muted-foreground">
                            Нет обращений по выбранным фильтрам
                        </p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <AppealCard
                            key={item.id}
                            item={item}
                            onTake={() =>
                                takeMutation.mutate({ appealId: item.id })
                            }
                            onClose={() =>
                                closeMutation.mutate({ appealId: item.id })
                            }
                            isTaking={
                                takeMutation.isPending &&
                                takeMutation.variables?.appealId === item.id
                            }
                            isClosing={
                                closeMutation.isPending &&
                                closeMutation.variables?.appealId === item.id
                            }
                            onGoToChat={() =>
                                router.navigate({
                                    to: "/chat/$chatId",
                                    params: { chatId: item.id },
                                })
                            }
                        />
                    ))
                )}
            </div>
        </div>
    );
}

import { motion } from "framer-motion";

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
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {label}
            </span>
            <div className="inline-flex items-center gap-1 p-1 bg-card rounded-xl ring-1 ring-border shadow-sm w-fit relative">
                {options.map((opt) => {
                    const isActive = value === opt.key;
                    return (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => onChange(opt.key)}
                            className={cn(
                                "relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors z-10",
                                isActive
                                    ? "text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId={`filter-${label}`}
                                    className="absolute inset-0 bg-primary rounded-lg -z-10"
                                    transition={{
                                        type: "spring",
                                        bounce: 0.2,
                                        duration: 0.6,
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

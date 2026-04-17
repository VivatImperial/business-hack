import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    UserGroupIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    ChevronUpIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/solid";

import { adminQueries } from "@/lib/queries/admin";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";

import { sessionStatusLabel } from "@/features/admin/lib/admin-utils";
import { useAdminActions, type AdminSortBy } from "@/features/admin/lib/use-admin-actions";
import {
    LifecycleStatusBadge,
    SessionStatusBadge,
} from "./admin-status-badges";

const LIFECYCLE_OPTIONS = [
    { value: "all", label: "Все статусы" },
    { value: "registered", label: "Зарегистрирован" },
    { value: "qr_connected_no_chats", label: "QR подключен" },
    { value: "destination_missing", label: "Нет destination" },
    { value: "quota_exhausted", label: "Квота исчерпана" },
    { value: "scanning", label: "Сканирует" },
    { value: "backoff", label: "Бэкофф" },
    { value: "setup_incomplete", label: "Настройка не завершена" },
];

const SESSION_OPTIONS = [
    { value: "all", label: "Все сессии" },
    { value: "no_session", label: "Нет сессии" },
    { value: "healthy", label: "Здоровая" },
    { value: "leased", label: "Арендована" },
    { value: "backoff", label: "Бэкофф" },
    { value: "inactive", label: "Неактивная" },
];

const SORT_OPTIONS: { value: AdminSortBy; label: string }[] = [
    { value: "name", label: "Имя" },
    { value: "messages", label: "Сообщения" },
    { value: "leads", label: "Лиды" },
    { value: "conversion", label: "Конверсия" },
    { value: "quota", label: "Остаток квоты" },
];

function sortLabel(sortBy: AdminSortBy): string {
    return SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? sortBy;
}

export function AdminClientsListPage() {
    const { data, isFetching, refetch } = useQuery(adminQueries.clients());
    const clients = useMemo(() => data?.items ?? [], [data]);

    const {
        search,
        setSearch,
        lifecycleFilter,
        setLifecycleFilter,
        sessionFilter,
        setSessionFilter,
        sortBy,
        setSortBy,
        sortDir,
        setSortDir,
        hasActiveFilters,
        resetFilters,
        setLimitsDrafts,
        filteredClients,
        updateLimitsMutation,
        openTenant,
        getDraft,
    } = useAdminActions(clients);

    return (
        <div className="relative flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="font-heading text-[26px] font-extrabold tracking-tight text-foreground">
                        Клиенты
                    </h1>
                    <p className="text-[14px] text-muted-foreground">
                        Управление клиентами, лимиты и быстрые переходы.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 shrink-0 rounded-xl px-4 w-full sm:w-auto"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    {isFetching ? <Spinner className="size-4 animate-spin mr-2" /> : null}
                    Обновить
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-20" />
                    <Input
                        placeholder="Поиск: имя, slug, владелец…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-56 rounded-xl bg-secondary pl-9 pr-3.5 text-[13px] font-medium placeholder:text-muted-foreground/40 transition-all duration-200 hover:bg-secondary/80 focus:bg-secondary/80"
                    />
                </div>

                <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
                    <SelectTrigger
                        className={`h-9 w-[180px] border-transparent bg-secondary px-3 py-1 text-[13px] font-medium transition-all duration-200 focus:ring-0 focus:ring-offset-0 ${
                            lifecycleFilter !== "all"
                                ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {LIFECYCLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sessionFilter} onValueChange={setSessionFilter}>
                    <SelectTrigger
                        className={`h-9 w-[160px] border-transparent bg-secondary px-3 py-1 text-[13px] font-medium transition-all duration-200 focus:ring-0 focus:ring-offset-0 ${
                            sessionFilter !== "all"
                                ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SESSION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={sortBy}
                    onValueChange={(v) => {
                        const valid: AdminSortBy[] = ["name", "messages", "leads", "conversion", "quota"];
                        if (valid.includes(v as AdminSortBy)) {
                            setSortBy(v as AdminSortBy);
                        }
                    }}
                >
                    <SelectTrigger
                        className={`h-9 w-[170px] border-transparent bg-secondary px-3 py-1 text-[13px] font-medium transition-all duration-200 focus:ring-0 focus:ring-offset-0 ${
                            sortBy !== "name"
                                ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Сорт:</span>
                            {sortLabel(sortBy)}
                        </span>
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <button
                    type="button"
                    className="inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-[13px] font-medium bg-secondary text-muted-foreground transition-all duration-200 hover:bg-secondary/80 hover:text-foreground"
                    onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                    title={sortDir === "asc" ? "По возрастанию" : "По убыванию"}
                >
                    {sortDir === "asc" ? (
                        <ChevronUpIcon className="size-4" />
                    ) : (
                        <ChevronDownIcon className="size-4" />
                    )}
                </button>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground"
                    >
                        <XMarkIcon className="size-3" />
                        Сбросить
                    </button>
                )}
            </div>

            {/* Client Cards */}
            <div className="flex flex-col gap-4">
                {filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                        <UserGroupIcon className="mb-3 size-10 text-muted-foreground/30" />
                        <p className="text-[14px] font-medium text-foreground">
                            Клиенты не найдены
                        </p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                            Измените поисковый запрос.
                        </p>
                    </div>
                ) : (
                    filteredClients.map((client) => {
                        const draft = getDraft(client);
                        const limitsDirty =
                            draft.totalQuota !== String(client.totalQuota) ||
                            draft.creditLimit !== String(client.creditLimit);

                        return (
                            <div
                                key={client.tenantId}
                                className="rounded-2xl border border-gray-200 bg-card shadow-sm shadow-black/2"
                            >
                                {/* Card Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-heading text-[15px] font-bold tracking-tight text-foreground">
                                                {client.tenantName}
                                            </h3>
                                            <div className="flex items-center gap-1.5">
                                                <SessionStatusBadge
                                                    status={client.session.sessionStatus}
                                                    label={sessionStatusLabel(client.session.sessionStatus)}
                                                />
                                                <LifecycleStatusBadge lifecycle={client.lifecycle} />
                                            </div>
                                        </div>
                                        <div className="text-[12px] text-muted-foreground">
                                            Владелец: <span className="font-medium text-foreground">{client.ownerUsername || "не назначен"}</span>
                                            {" · "}участников: {client.memberCount}
                                            {client.session.telegramUsername && (
                                                <>
                                                    {" · "}
                                                    <span className="font-medium text-foreground">@{client.session.telegramUsername}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="h-8 rounded-xl px-4 text-[13px] shrink-0"
                                        onClick={() => openTenant(client.tenantId, "/dashboard")}
                                    >
                                        Перейти в клиента
                                    </Button>
                                </div>

                                {/* Card Body */}
                                <div className="flex flex-col lg:flex-row">
                                    {/* Stats Grid */}
                                    <div className="flex-1 px-5 py-4">
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
                                            <div>
                                                <div className="text-[11px] font-medium text-muted-foreground mb-1">Сессий</div>
                                                <div className="text-[16px] font-bold text-foreground">{client.session.totalSessions}</div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-medium text-muted-foreground mb-1">Бэкофф</div>
                                                <div className="text-[16px] font-bold text-foreground">{client.session.backoffSessions}</div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-medium text-muted-foreground mb-1">Чаты</div>
                                                <div className="text-[16px] font-bold text-foreground">{client.sourceChatsCount}</div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-medium text-muted-foreground mb-1">Сообщения</div>
                                                <div className="text-[16px] font-bold text-foreground">{client.metrics.messages30d}</div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-medium text-muted-foreground mb-1">Лиды</div>
                                                <div className="text-[16px] font-bold text-foreground">{client.metrics.leads30d}</div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-medium text-muted-foreground mb-1">Конверсия</div>
                                                <div className="text-[16px] font-bold text-foreground">{client.metrics.conversionRate30d}%</div>
                                            </div>
                                        </div>

                                        {/* Destination + Quota row */}
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 pt-3 border-t border-gray-100 text-[12px]">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-muted-foreground">Destination:</span>
                                                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-medium ${client.destinationConfigured ? "bg-emerald-100 text-foreground dark:bg-emerald-950/40" : "bg-amber-100 text-foreground dark:bg-amber-950/40"}`}>
                                                    {client.destinationConfigured ? "Подключен" : "Не подключен"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-muted-foreground">Остаток квоты:</span>
                                                <span className="font-bold text-foreground">{client.remainingQuota}</span>
                                            </div>
                                        </div>

                                        {/* Error / Hint */}
                                        {client.session.lastError && (
                                            <div className="mt-3 rounded-xl bg-red-50/50 px-3.5 py-2.5 text-[12px] text-foreground border border-red-100">
                                                {client.session.lastError}
                                            </div>
                                        )}
                                        {client.lifecycle.hint && (
                                            <div className="mt-3 rounded-xl bg-amber-50/50 px-3.5 py-2.5 text-[12px] text-foreground border border-amber-100">
                                                {client.lifecycle.hint}
                                            </div>
                                        )}

                                        {/* Top Chats */}
                                        {client.topChats.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Топ чатов (30 дней)</div>
                                                <div className="space-y-1 text-[12px]">
                                                    {client.topChats.map(chat => (
                                                        <div key={chat.title} className="flex justify-between gap-4">
                                                            <span className="truncate text-muted-foreground">{chat.title}</span>
                                                            <span className="shrink-0 font-medium text-foreground">{chat.leads30d} / {chat.messages30d}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Limits Sidebar */}
                                    <div className="w-full lg:w-[240px] shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 px-5 py-4">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Лимиты</div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[11px] text-muted-foreground mb-1 block">Общая квота</label>
                                                <Input
                                                    value={draft.totalQuota}
                                                    onChange={(e) => setLimitsDrafts(prev => ({ ...prev, [client.tenantId]: { ...draft, totalQuota: e.target.value } }))}
                                                    className="h-8 text-[13px] bg-background"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] text-muted-foreground mb-1 block">Кредитный лимит</label>
                                                <Input
                                                    value={draft.creditLimit}
                                                    onChange={(e) => setLimitsDrafts(prev => ({ ...prev, [client.tenantId]: { ...draft, creditLimit: e.target.value } }))}
                                                    className="h-8 text-[13px] bg-background"
                                                />
                                            </div>
                                            <div className="text-[11px] flex justify-between">
                                                <span className="text-muted-foreground">Использовано:</span>
                                                <span className="font-medium text-foreground">{client.usedQuota} / {client.totalQuota}</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-8 text-[12px]"
                                                disabled={!limitsDirty || updateLimitsMutation.isPending}
                                                onClick={() => updateLimitsMutation.mutate({ tenantId: client.tenantId, totalQuota: Number(draft.totalQuota) || 0, creditLimit: Number(draft.creditLimit) || 0 })}
                                            >
                                                {updateLimitsMutation.isPending ? <Spinner className="mr-1.5 size-3" /> : null}
                                                Сохранить
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

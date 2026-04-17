import {
    CheckIcon,
    ArrowDownTrayIcon,
    } from "@heroicons/react/24/solid";
import { GuideHelpButton } from "@/shared/layout/guide-help-button";
import { useCallback, useEffect, useState } from "react";
import type {
    DateRangeFilter,
    LeadRecord,
    LeadsListParams,
} from "@/features/leads/types";
import { LEADS_LIST_DEFAULTS } from "@/features/leads/types";
import { normalizeLeadsListParams } from "@/lib/queries/leads";
import { getRouteApi } from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { LeadDetailSheet } from "./lead-detail-sheet";
import { KanbanBoard } from "./kanban-board";
import { LeadsToolbar } from "./leads-toolbar";
import { motion, LayoutGroup } from "@/shared/animations/motion";
import { PERIOD_PRESETS } from "@/lib/constants";
import { useLeadsQuery } from "@/features/leads/lib/use-leads-query";
import { useLeadsActions } from "@/features/leads/lib/use-leads-actions";
import { Spinner } from "@/shared/ui/spinner";

/** Default filters for Kanban: period=today by default */
export const KANBAN_DEFAULTS: Required<LeadsListParams> = {
    ...LEADS_LIST_DEFAULTS,
    period: "7d",
    status: "all", // we show all statuses across columns
};

const appRoute = getRouteApi("/_app");

export function LeadsPage() {
    const { tenantId } = appRoute.useRouteContext();
    const [filters, setFilters] =
        useState<Required<LeadsListParams>>(KANBAN_DEFAULTS);
    const [activeLead, setActiveLead] = useState<LeadRecord | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const {
        leads,
        total,
        availableTags,
        availableSources,
        isFetching,
        isFetchingNextPage,
        sentinelRef,
        invalidateLeadsList,
    } = useLeadsQuery(tenantId!, filters);

    const {
        exportMutation,
        handleSetInProgress,
        handleExport,
        handleSetAction,
    } = useLeadsActions(tenantId!, filters, invalidateLeadsList);

    useEffect(() => {
        if (!feedback) return;
        const timer = setTimeout(() => setFeedback(null), 4000);
        return () => clearTimeout(timer);
    }, [feedback]);

    useEffect(() => {
        if (!activeLead || leads.length === 0) return;
        const fresh = leads.find((l: LeadRecord) => l.id === activeLead.id);
        if (fresh) setActiveLead(fresh);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leads]);

    const patchFilters = (patch: Partial<LeadsListParams>) => {
        setFilters((prev) => normalizeLeadsListParams({ ...prev, ...patch }));
    };

    const resetFilters = () => {
        setFilters(KANBAN_DEFAULTS);
        setActiveLead(null);
        setSheetOpen(false);
    };

    const handleSelectLead = useCallback((lead: LeadRecord) => {
        setActiveLead(lead);
        setSheetOpen(true);
    }, []);

    const onExport = async () => {
        const msg = await handleExport();
        if (msg) setFeedback(msg);
    };

    const showOverlay = isFetching && !isFetchingNextPage && leads.length > 0;

    return (
        <TooltipProvider>
            <div className="relative min-w-full flex flex-col gap-6">
                {/* Loading overlay */}
                {showOverlay && (
                    <div className="fixed right-6 top-6 z-30">
                        <div className="flex items-center gap-2 rounded-xl bg-card/90 px-3 py-2 shadow-lg backdrop-blur-sm">
                            <Spinner className="size-4 animate-spin text-blue-500" />
                            <span className="text-[14px] font-medium text-muted-foreground">
                                Обновление...
                            </span>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="font-heading text-[26px] font-extrabold tracking-tight text-foreground">
                                Лиды
                            </h1>
                            <GuideHelpButton section="leads" />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[13px] font-medium text-muted-foreground">
                                {total.toLocaleString("ru-RU")} найдено
                            </span>
                            {feedback && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 animate-in fade-in slide-in-from-left-1 duration-200">
                                    <CheckIcon className="size-3" />
                                    {feedback}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <LayoutGroup>
                            <div className="flex items-center gap-0.5 rounded-xl bg-secondary p-1">
                                {PERIOD_PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        className="relative h-7 px-3.5 text-[13px] font-medium rounded-xl transition-colors"
                                        onClick={() =>
                                            patchFilters({
                                                period: preset.value as DateRangeFilter,
                                                page: 1,
                                            })
                                        }
                                    >
                                        {filters.period === preset.value && (
                                            <motion.div
                                                layoutId="leads-header-period"
                                                className="absolute inset-0 bg-card rounded-xl shadow-sm shadow-black/6"
                                                transition={{
                                                    type: "spring",
                                                    bounce: 0.15,
                                                    duration: 0.5,
                                                }}
                                            />
                                        )}
                                        <span
                                            className={`relative z-10 transition-colors duration-200 ${
                                                filters.period === preset.value
                                                    ? "text-foreground"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {preset.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </LayoutGroup>
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-2 h-7 px-3 gap-1.5 rounded-xl border-dashed text-[13px] font-medium text-muted-foreground hover:text-foreground"
                            onClick={() => {
                                void onExport();
                            }}
                            disabled={exportMutation.isPending}
                        >
                            {exportMutation.isPending ? (
                                <Spinner className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            )}
                            Экспорт
                        </Button>
                    </div>
                </div>

                {/* Toolbar (filters only, no status tabs) */}
                <LeadsToolbar
                    filters={filters}
                    availableTags={availableTags}
                    availableSources={availableSources}
                    onFiltersChange={patchFilters}
                    onResetFilters={resetFilters}
                />

                {/* Kanban Board */}
                <KanbanBoard
                    leads={leads}
                    onSelectLead={handleSelectLead}
                    onSetAction={(leadId, action) => {
                        void handleSetAction(leadId, action);
                    }}
                    onStatusChange={(leadId, action) => {
                        void handleSetAction(leadId, action);
                    }}
                    onCopyAndOpen={(lead) => {
                        const username = lead.telegramUsername
                            ?.replace(/^@/, "")
                            ?.trim();
                        if (username) {
                            window.open(`https://t.me/${username}`, "_blank");
                        }
                        void handleSetInProgress(lead.id);
                    }}
                />

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-1" />

                {isFetchingNextPage && (
                    <div className="flex justify-center py-6">
                        <Spinner className="size-5 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* First load */}
                {isFetching && leads.length === 0 && (
                    <div className="flex justify-center py-20">
                        <Spinner className="size-6 animate-spin text-blue-500" />
                    </div>
                )}

                {/* Detail Sheet */}
                <LeadDetailSheet
                    lead={activeLead}
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    onSetInProgress={(leadId) => {
                        void handleSetInProgress(leadId);
                    }}
                    onSetAction={(leadId, action) => {
                        void handleSetAction(leadId, action);
                    }}
                />
            </div>
        </TooltipProvider>
    );
}

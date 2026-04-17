import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { BASE_URL } from "@/lib/api/client";
import type { LeadRecord, LeadsListParams, LeadsListResponse } from "@/features/leads/types";
import { leadsMutations } from "@/lib/queries/leads";
import type { LeadAction } from "@/lib/queries/leads";
import { snackbarStore } from "@/shared/lib/snackbar-store";

export function useLeadsActions(
    tenantId: number,
    filters: Required<LeadsListParams>,
    invalidateLeadsList: () => void,
) {
    const queryClient = useQueryClient();
    const [, setPendingActions] = useState<Set<number>>(new Set());

    const addPending = (id: number) =>
        setPendingActions((prev) => new Set(prev).add(id));
    const removePending = (id: number) =>
        setPendingActions((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

    const setInProgressMutation = useMutation({
        mutationFn: (data: { id: number }) =>
            leadsMutations.setInProgress(tenantId, data),
        onMutate: ({ id }) => {
            queryClient.cancelQueries({ queryKey: ["leads"] });

            const previousData = queryClient.getQueriesData<InfiniteData<LeadsListResponse>>({
                queryKey: ["leads"],
            });

            queryClient.setQueriesData(
                { queryKey: ["leads"] },
                (old: InfiniteData<LeadsListResponse> | undefined) => {
                    if (!old?.pages) return old;

                    return {
                        ...old,
                        pages: old.pages.map((page: LeadsListResponse) => ({
                            ...page,
                            leads: page.leads.map((lead) =>
                                lead.id === id
                                    ? { ...lead, status: "in_progress" as const, isFavorite: false }
                                    : lead,
                            ),
                        })),
                    };
                },
            );

            return { previousData };
        },
        onSuccess: () => {
            snackbarStore.show("Лид взят в работу");
        },
        onError: (_err, _vars, context) => {
            if (context?.previousData) {
                for (const [queryKey, data] of context.previousData) {
                    queryClient.setQueryData(queryKey, data);
                }
            }
            snackbarStore.showError("Не удалось взять лид в работу");
        },
        onSettled: () => {
            invalidateLeadsList();
        },
    });

    const setActionMutation = useMutation({
        mutationFn: (data: { id: number; action: LeadAction }) =>
            leadsMutations.setAction(tenantId, data),
        onMutate: ({ id, action }) => {
            queryClient.cancelQueries({ queryKey: ["leads"] });

            const previousData = queryClient.getQueriesData<InfiniteData<LeadsListResponse>>({
                queryKey: ["leads"],
            });

            queryClient.setQueriesData(
                { queryKey: ["leads"] },
                (old: InfiniteData<LeadsListResponse> | undefined) => {
                    if (!old?.pages) return old;

                    const updateLead = (lead: LeadRecord) => {
                        if (lead.id !== id) return lead;

                        let newStatus = lead.status;
                        let newIsFavorite = lead.isFavorite;

                        if (action === "in_progress") {
                            newStatus = "in_progress";
                            newIsFavorite = false;
                        } else if (action === "favorite") {
                            if (
                                newStatus === "in_progress" ||
                                newStatus === "rejected"
                            ) {
                                newStatus = "viewed";
                            }
                            newIsFavorite = true;
                        } else if (action === "rejected") {
                            newStatus = "rejected";
                            newIsFavorite = false;
                        } else if (action === "none") {
                            if (
                                newStatus === "in_progress" ||
                                newStatus === "rejected"
                            ) {
                                newStatus = "viewed";
                            }
                            newIsFavorite = false;
                        }

                        return {
                            ...lead,
                            status: newStatus,
                            isFavorite: newIsFavorite,
                        };
                    };

                    return {
                        ...old,
                        pages: old.pages.map((page: LeadsListResponse) => ({
                            ...page,
                            leads: page.leads.map(updateLead),
                        })),
                    };
                },
            );

            return { previousData };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousData) {
                for (const [queryKey, data] of context.previousData) {
                    queryClient.setQueryData(queryKey, data);
                }
            }
            snackbarStore.showError("Не удалось изменить статус");
        },
        onSettled: () => {
            invalidateLeadsList();
        },
    });

    const exportMutation = useMutation({
        mutationFn: (data: Parameters<typeof leadsMutations.export>[1]) =>
            leadsMutations.export(tenantId, data),
    });

    const handleSetInProgress = async (leadId: number) => {
        addPending(leadId);
        try {
            await setInProgressMutation.mutateAsync({ id: leadId });
        } finally {
            removePending(leadId);
        }
    };

    const handleExport = async () => {
        try {
            const response = (await exportMutation.mutateAsync({
                filters,
            })) as {
                downloadUrl?: string;
                filename?: string;
                exportedCount?: number;
            };
            if (response.downloadUrl) {
                const token = Cookies.get("auth_token");
                const downloadUrl = response.downloadUrl.startsWith("http")
                    ? response.downloadUrl
                    : `${BASE_URL}${response.downloadUrl}`;
                const res = await fetch(downloadUrl, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) throw new Error("Ошибка загрузки файла");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = response.filename || "leads.xlsx";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
            snackbarStore.show(`Экспорт: ${response.exportedCount ?? 0} лидов`);
            return `Экспорт: ${response.exportedCount ?? 0} лидов`;
        } catch (err) {
            snackbarStore.showError(err instanceof Error ? err.message : "Ошибка экспорта");
            return null;
        }
    };

    const handleSetAction = async (leadId: number, action: LeadAction) => {
        addPending(leadId);
        try {
            await setActionMutation.mutateAsync({ id: leadId, action });
            const labels: Record<LeadAction, string> = {
                in_progress: "Лид взят в работу",
                favorite: "Добавлен в избранное",
                rejected: "Лид отклонён",
                none: "Статус сброшен",
            };
            snackbarStore.show(labels[action]);
        } finally {
            removePending(leadId);
        }
    };

    return {
        setInProgressMutation,
        setActionMutation,
        exportMutation,
        handleSetInProgress,
        handleExport,
        handleSetAction,
    };
}

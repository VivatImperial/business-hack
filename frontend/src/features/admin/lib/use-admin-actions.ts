import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setTenantId, setAdminImpersonating } from "@/lib/auth";
import {
    adminMutations,
    type AdminClientSummary,
} from "@/lib/queries/admin";
import { snackbarStore } from "@/shared/lib/snackbar-store";

export type AdminSortBy = "name" | "messages" | "leads" | "conversion" | "quota";
export type AdminSortDir = "asc" | "desc";

export function useAdminActions(clients: AdminClientSummary[]) {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [lifecycleFilter, setLifecycleFilter] = useState("all");
    const [sessionFilter, setSessionFilter] = useState("all");
    const [sortBy, setSortBy] = useState<AdminSortBy>("name");
    const [sortDir, setSortDir] = useState<AdminSortDir>("asc");
    const [limitsDrafts, setLimitsDrafts] = useState<
        Record<number, { totalQuota: string; creditLimit: string }>
    >({});

    const hasActiveFilters =
        lifecycleFilter !== "all" ||
        sessionFilter !== "all" ||
        sortBy !== "name" ||
        sortDir !== "asc";

    const resetFilters = () => {
        setSearch("");
        setLifecycleFilter("all");
        setSessionFilter("all");
        setSortBy("name");
        setSortDir("asc");
    };

    const filteredClients = useMemo(() => {
        let result = clients;

        const q = search.trim().toLowerCase();
        if (q) {
            result = result.filter((client) =>
                [
                    client.tenantName,
                    client.tenantSlug,
                    client.ownerUsername ?? "",
                ].some((value) => value.toLowerCase().includes(q)),
            );
        }

        if (lifecycleFilter !== "all") {
            result = result.filter(
                (client) => client.lifecycle.status === lifecycleFilter,
            );
        }

        if (sessionFilter !== "all") {
            result = result.filter(
                (client) => client.session.sessionStatus === sessionFilter,
            );
        }

        const sorted = [...result].sort((a, b) => {
            let cmp = 0;
            switch (sortBy) {
                case "name":
                    cmp = a.tenantName.localeCompare(b.tenantName, "ru");
                    break;
                case "messages":
                    cmp = a.metrics.messages30d - b.metrics.messages30d;
                    break;
                case "leads":
                    cmp = a.metrics.leads30d - b.metrics.leads30d;
                    break;
                case "conversion":
                    cmp = a.metrics.conversionRate30d - b.metrics.conversionRate30d;
                    break;
                case "quota":
                    cmp = a.remainingQuota - b.remainingQuota;
                    break;
            }
            return sortDir === "asc" ? cmp : -cmp;
        });

        return sorted;
    }, [clients, search, lifecycleFilter, sessionFilter, sortBy, sortDir]);

    const updateLimitsMutation = useMutation({
        mutationFn: ({
            tenantId,
            totalQuota,
            creditLimit,
        }: {
            tenantId: number;
            totalQuota: number;
            creditLimit: number;
        }) =>
            adminMutations.updateLimits(tenantId, {
                totalQuota,
                creditLimit,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin"] });
            snackbarStore.show("Лимиты обновлены");
        },
        onError: (error: Error) => {
            snackbarStore.showError(error.message || "Не удалось обновить лимиты");
        },
    });

    const openTenant = (tenantId: number, to: string) => {
        setTenantId(tenantId);
        setAdminImpersonating("1");
        window.location.href = to;
    };

    const getDraft = (client: AdminClientSummary) =>
        limitsDrafts[client.tenantId] ?? {
            totalQuota: String(client.totalQuota),
            creditLimit: String(client.creditLimit),
        };

    return {
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
        limitsDrafts,
        setLimitsDrafts,
        filteredClients,
        updateLimitsMutation,
        openTenant,
        getDraft,
    };
}

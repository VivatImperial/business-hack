import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { setTenantId, type TenantInfo } from "@/lib/auth";
import { authQueries } from "@/lib/queries/auth";
import { getRouteApi } from "@tanstack/react-router";

const appRoute = getRouteApi("/_app");

export function useTenantSwitcher() {
    const { tenantId: currentTenantId, token } = appRoute.useRouteContext();
    const queryClient = useQueryClient();
    const { data: tenants = [], isLoading: loading } = useQuery(
        authQueries.tenants(token),
    );

    const [open, setOpen] = useState(false);

    const currentTenant = tenants.find((t) => t.id === currentTenantId);

    const handleOpen = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            queryClient.invalidateQueries({ queryKey: ["auth", "tenants"] });
        }
    };

    const handleSelect = (tenant: TenantInfo) => {
        if (tenant.id === currentTenantId) {
            setOpen(false);
            return;
        }
        setTenantId(tenant.id);
        setOpen(false);
        window.location.href = "/dashboard";
    };

    return {
        open,
        handleOpen,
        tenants,
        loading,
        currentTenantId,
        currentTenant,
        handleSelect,
    };
}

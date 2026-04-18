import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/settings";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";
import { getGetSettingsApiV1AdminSettingsGetQueryOptions } from "@/lib/api/generated/admin-settings/admin-settings";

export const Route = createFileRoute("/_app/settings")({
    loader: async ({ context: { queryClient, role } }) => {
        if (role !== "admin") return;
        await queryClient
            .ensureQueryData(getGetSettingsApiV1AdminSettingsGetQueryOptions())
            .catch(() => undefined);
    },
    component: SettingsPage,
    errorComponent: RouteErrorFallback,
});

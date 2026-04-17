import { createFileRoute } from "@tanstack/react-router";
import { settingsQueries } from "@/lib/queries/settings";
import { promptsQueries } from "@/lib/queries/prompts";
import { SettingsPage, MobileSettingsPage } from "@/features/settings";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";
import { RoutePendingSkeleton } from "@/shared/ui/route-pending-skeleton";

export const Route = createFileRoute("/_app/settings")({
    loader: async ({ context: { queryClient, tenantId } }) => {
        if (!tenantId) return;
        await Promise.all([
            queryClient.ensureQueryData(settingsQueries.detail(tenantId)),
            queryClient.ensureQueryData(promptsQueries.list(tenantId)),
        ]);
    },
    component: SettingsRoute,
    errorComponent: RouteErrorFallback,
    pendingComponent: () => <RoutePendingSkeleton variant="settings" />,
});

function SettingsRoute() {
    const { isMobile } = Route.useRouteContext();
    if (isMobile) return <MobileSettingsPage />;
    return (
        <div className="flex flex-col h-full  md:min-h-[calc(100svh-240px)] rounded-xl bg-background p-8 relative">
            <SettingsPage />
        </div>
    );
}

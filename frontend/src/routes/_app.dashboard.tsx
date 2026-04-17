import { createFileRoute } from "@tanstack/react-router";
import { dashboardQueries } from "../lib/queries/dashboard";
import { leadsQueries } from "../lib/queries/leads";
import { DashboardPage, MobileDashboardPage } from "@/features/dashboard";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";
import { RoutePendingSkeleton } from "@/shared/ui/route-pending-skeleton";

export const Route = createFileRoute("/_app/dashboard")({
    loader: async ({ context: { queryClient, tenantId } }) => {
        if (!tenantId) return;
        await Promise.all([
            queryClient.ensureQueryData(dashboardQueries.stats(tenantId)),
            queryClient.ensureQueryData(
                leadsQueries.list(tenantId, { pageSize: 1, period: "today" }),
            ),
        ]);
    },
    component: IndexPage,
    errorComponent: RouteErrorFallback,
    pendingComponent: () => <RoutePendingSkeleton variant="dashboard" />,
});

function IndexPage() {
    const { tenantId, isMobile } = Route.useRouteContext();
    if (isMobile) return <MobileDashboardPage tenantId={tenantId!} />;
    return (
        <div className="flex flex-col h-full md:min-h-[calc(100svh-240px)] rounded-xl bg-background p-8 relative">
            <DashboardPage tenantId={tenantId!} />
        </div>
    );
}

import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { leadsQueries } from "../lib/queries/leads";
import { LeadsPage, KANBAN_DEFAULTS, MobileLeadsPage } from "@/features/leads";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";
import { RoutePendingSkeleton } from "@/shared/ui/route-pending-skeleton";

export const Route = createFileRoute("/_app/leads")({
    loader: async ({ context: { queryClient, tenantId } }) => {
        if (!tenantId) return;
        await queryClient.ensureInfiniteQueryData(
            leadsQueries.infiniteList(tenantId, KANBAN_DEFAULTS),
        );
    },
    component: LeadsRoute,
    errorComponent: RouteErrorFallback,
    pendingComponent: () => <RoutePendingSkeleton variant="leads" />,
});

function LeadsRoute() {
    const { tenantId, isMobile } = Route.useRouteContext();
    useSuspenseInfiniteQuery(
        leadsQueries.infiniteList(tenantId!, KANBAN_DEFAULTS),
    );
    if (isMobile) return <MobileLeadsPage />;
    return (
        <div className="flex flex-col h-full md:min-h-[calc(100svh-240px)] rounded-xl bg-background p-8 relative">
            <LeadsPage />
        </div>
    );
}

import { createFileRoute } from "@tanstack/react-router";
import { balanceQueries } from "@/lib/queries/balance";
import { BalancePage, MobileBalancePage } from "@/features/balance";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";
import { RoutePendingSkeleton } from "@/shared/ui/route-pending-skeleton";

export const Route = createFileRoute("/_app/balance")({
    loader: async ({ context: { queryClient, tenantId } }) => {
        if (!tenantId) return;
        await queryClient.ensureQueryData(balanceQueries.detail(tenantId));
    },
    component: BalanceRoute,
    errorComponent: RouteErrorFallback,
    pendingComponent: () => <RoutePendingSkeleton variant="balance" />,
});

function BalanceRoute() {
    const { isMobile } = Route.useRouteContext();
    if (isMobile) return <MobileBalancePage />;
    return (
        <div className="flex flex-col h-full  md:min-h-[calc(100svh-240px)] rounded-xl bg-background p-8 relative">
            <BalancePage />
        </div>
    );
}

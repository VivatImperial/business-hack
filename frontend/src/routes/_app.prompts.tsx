import { createFileRoute, redirect } from "@tanstack/react-router";

import { authQueries } from "@/lib/queries/auth";
import { AdminDashboardPage } from "@/features/admin";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";
import { RoutePendingSkeleton } from "@/shared/ui/route-pending-skeleton";

function PromptsRoute() {
    return (
        <div className="flex flex-col h-full md:min-h-[calc(100svh-240px)] rounded-2xl bg-background p-6 md:p-8 relative">
            <AdminDashboardPage />
        </div>
    );
}

export const Route = createFileRoute("/_app/prompts")({
    loader: async ({ context: { queryClient, token } }) => {
        if (!token) {
            throw redirect({ to: "/login" });
        }
        const me = await queryClient.ensureQueryData(authQueries.me(token));
        if (!me.canAccessAdmin) {
            throw redirect({ to: "/settings" });
        }
        return me;
    },
    component: PromptsRoute,
    errorComponent: RouteErrorFallback,
    pendingComponent: () => <RoutePendingSkeleton variant="admin" />,
});

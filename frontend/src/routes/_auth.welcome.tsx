import { createFileRoute } from "@tanstack/react-router";
import { settingsQueries } from "@/lib/queries/settings";
import { promptsQueries } from "@/lib/queries/prompts";
import { WelcomePage } from "@/features/onboarding";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";
import { RoutePendingSkeleton } from "@/shared/ui/route-pending-skeleton";

export const Route = createFileRoute("/_auth/welcome")({
    loader: async ({ context: { queryClient, tenantId } }) => {
        if (!tenantId) return;
        await Promise.all([
            queryClient.ensureQueryData(settingsQueries.detail(tenantId)),
            queryClient.ensureQueryData(promptsQueries.list(tenantId)),
        ]);
    },
    component: WelcomePage,
    errorComponent: RouteErrorFallback,
    pendingComponent: () => <RoutePendingSkeleton variant="settings" />,
});

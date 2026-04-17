import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { tagsQueries } from "../lib/queries/tags";
import { settingsQueries } from "@/lib/queries/settings";
import { TagsPage, MobileTagsPage } from "@/features/tags";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";
import { RoutePendingSkeleton } from "@/shared/ui/route-pending-skeleton";

export const Route = createFileRoute("/_app/my-chat")({
    loader: async ({ context: { queryClient, tenantId } }) => {
        if (!tenantId) return;
        await Promise.all([
            queryClient.ensureQueryData(tagsQueries.list(tenantId)),
            queryClient.ensureQueryData(settingsQueries.detail(tenantId)),
        ]);
    },
    component: TagsRoute,
    errorComponent: RouteErrorFallback,
    pendingComponent: () => <RoutePendingSkeleton variant="tags" />,
});

function TagsRoute() {
    const { tenantId, isMobile } = Route.useRouteContext();
    useSuspenseQuery(tagsQueries.list(tenantId!));
    useSuspenseQuery(settingsQueries.detail(tenantId!));
    if (isMobile) return <MobileTagsPage />;

    return (
        <div className="relative flex h-full min-w-0 flex-col rounded-xl bg-background p-4 md:min-h-[calc(100svh-240px)] md:p-8">
            <TagsPage />
        </div>
    );
}

import { createFileRoute } from "@tanstack/react-router";
import { settingsQueries } from "@/lib/queries/settings";
import { ChatsPage, MobileChatsPage } from "@/features/chats";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";
import { RoutePendingSkeleton } from "@/shared/ui/route-pending-skeleton";

export const Route = createFileRoute("/_app/chats")({
    loader: async ({ context: { queryClient, tenantId } }) => {
        if (!tenantId) return;
        await queryClient.ensureQueryData(settingsQueries.detail(tenantId));
    },
    component: ChatsRoute,
    errorComponent: RouteErrorFallback,
    pendingComponent: () => <RoutePendingSkeleton variant="chats" />,
});

function ChatsRoute() {
    const { isMobile } = Route.useRouteContext();
    if (isMobile) return <MobileChatsPage />;
    return (
        <div className="flex flex-col h-full  md:min-h-[calc(100svh-240px)] rounded-xl bg-background p-8 relative">
            <ChatsPage />
        </div>
    );
}

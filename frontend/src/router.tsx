import { createRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000 } },
    });
    return routerWithQueryClient(
        createRouter({
            routeTree,
            scrollRestoration: true,
            defaultPreload: "intent",
            context: {
                queryClient,
                tenantId: undefined as number | undefined,
                token: undefined as string | undefined,
                isMobile: false,
                dismissedBanners: undefined as string | undefined,
                sidebarTourSeen: false,
                issuesBannerCollapsed: false,
            },
        }),
        queryClient,
    );
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}

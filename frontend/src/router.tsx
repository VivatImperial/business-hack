import { createRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import type { AuthRole } from "@/lib/auth-role";

export function getRouter() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                retry: false,
            },
        },
    });
    return routerWithQueryClient(
        createRouter({
            routeTree,
            scrollRestoration: true,
            defaultPreload: "intent",
            context: {
                queryClient,
                token: undefined as string | undefined,
                role: undefined as AuthRole | undefined,
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

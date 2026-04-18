import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import {
    SidebarInset,
    SidebarProvider,
} from "@/shared/ui/sidebar";
import { AppSidebar } from "@/shared/layout/app-sidebar";
import { MobileBottomBar } from "@/shared/layout/mobile-bottom-bar";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";
import { ScrollToTop } from "@/shared/ui/scroll-to-top";

import { getMeApiV1AdminMeGetQueryOptions } from "@/lib/api/generated/admin-auth/admin-auth";
import { getMeApiV1ClientMeGetQueryOptions } from "@/lib/api/generated/client-auth/client-auth";
import { getListRequestsApiV1ClientRequestsGetQueryOptions } from "@/lib/api/generated/client-requests/client-requests";

const ADMIN_ONLY_PREFIXES = ["/dashboard", "/appeals", "/settings"];

function isAdminOnlyPath(pathname: string): boolean {
    return ADMIN_ONLY_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
}

export const Route = createFileRoute("/_app")({
    beforeLoad: ({ context, location }) => {
        if (!context.token) {
            throw redirect({ to: "/login" });
        }
        if (
            context.role === "client" &&
            isAdminOnlyPath(location.pathname)
        ) {
            throw redirect({ to: "/chat" });
        }
    },
    loader: async ({ context: { queryClient, role } }) => {
        // Prefetch profile + primary side data at the layout level so every
        // nested route already has it in the QueryCache.
        const prefetches =
            role === "admin"
                ? [queryClient.ensureQueryData(getMeApiV1AdminMeGetQueryOptions())]
                : [
                      queryClient.ensureQueryData(
                          getMeApiV1ClientMeGetQueryOptions(),
                      ),
                      queryClient.ensureQueryData(
                          getListRequestsApiV1ClientRequestsGetQueryOptions(),
                      ),
                  ];
        await Promise.all(prefetches.map((p) => p.catch(() => undefined)));
    },
    component: AppLayout,
    errorComponent: RouteErrorFallback,
});

function AppLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background pb-[60px] md:pb-0">
                <Outlet />
            </SidebarInset>
            <MobileBottomBar />
            <ScrollToTop />
        </SidebarProvider>
    );
}

import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import {
    SidebarInset,
    SidebarProvider,
} from "@/shared/ui/sidebar";
import { AppSidebar } from "@/shared/layout/app-sidebar";
import { MobileBottomBar } from "@/shared/layout/mobile-bottom-bar";
import { getMeApiV1AdminMeGetQueryOptions } from "@/lib/api/generated/admin-auth/admin-auth";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";

export const Route = createFileRoute("/_app")({
    beforeLoad: ({ context }) => {
        if (!context.token) {
            throw redirect({ to: "/login" });
        }
    },
    loader: async ({ context: { queryClient } }) => {
        await queryClient
            .ensureQueryData(getMeApiV1AdminMeGetQueryOptions())
            .catch(() => undefined);
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
        </SidebarProvider>
    );
}

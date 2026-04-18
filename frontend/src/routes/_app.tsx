import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import Cookies from "js-cookie";
import {
    SidebarInset,
    SidebarProvider,
} from "@/shared/ui/sidebar";
import { AppSidebar } from "@/shared/layout/app-sidebar";
import { MobileBottomBar } from "@/shared/layout/mobile-bottom-bar";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";

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
        const role = Cookies.get("auth_role");
        const pathname = location.pathname;

        // Client users may only access /chat
        if (role === "client" && isAdminOnlyPath(pathname)) {
            throw redirect({ to: "/chat" });
        }
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

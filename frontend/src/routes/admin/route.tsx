import {
    Outlet,
    createFileRoute,
    redirect,
    useRouterState,
    Link,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChartBarIcon, UserGroupIcon, LinkIcon } from "@heroicons/react/24/solid";

import { getToken } from "@/lib/auth";
import { authQueries } from "@/lib/queries/auth";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { ProfilePopover } from "@/shared/layout/profile-popover";

export const Route = createFileRoute("/admin")({
    beforeLoad: async ({
        context: { queryClient, token: contextToken },
        location,
    }) => {
        const token = contextToken ?? getToken();
        const isLoginPage = location.pathname === "/admin/login";

        if (!token) {
            if (!isLoginPage) {
                throw redirect({ to: "/admin/login" });
            }
            return { token: undefined };
        }

        try {
            const me = await queryClient.ensureQueryData(authQueries.me(token));
            if (me.canAccessAdmin) {
                if (isLoginPage) {
                    throw redirect({ to: "/admin" });
                }
                return { token };
            }
        } catch (e) {
            if (e && typeof e === "object" && "to" in e) throw e;
        }

        if (!isLoginPage) {
            throw redirect({ to: "/admin/login" });
        }
        return { token };
    },
    component: AdminLayout,
});

const navItems = [
    {
        title: "Дэшборд",
        to: "/admin" as const,
        icon: ChartBarIcon,
    },
    {
        title: "Клиенты",
        to: "/admin/clients" as const,
        icon: UserGroupIcon,
    },
    {
        title: "UTM-ссылки",
        to: "/admin/utm" as const,
        icon: LinkIcon,
    },
];

function getInitials(name: string): string {
    return name
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0].toUpperCase())
        .join("");
}

function AdminSidebar() {
    const routerState = useRouterState();
    const currentPath = routerState.location.pathname;
    const { token } = Route.useRouteContext();
    const { data } = useQuery(authQueries.me(token));
    const displayName = data?.displayName || data?.username || "admin";
    const avatarUrl = data?.avatarUrl;
    const initials = getInitials(displayName) || "A";

    return (
        <Sidebar>
            <SidebarHeader className="px-4 pt-5 pb-2">
                <div className="flex items-center px-2 gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
                        A
                    </div>
                    <span className="font-heading font-extrabold text-lg tracking-tight">
                        Админка
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-2 pt-4">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const isActive =
                                    item.to === "/admin"
                                        ? currentPath === "/admin" ||
                                          currentPath === "/admin/"
                                        : currentPath.startsWith(item.to);

                                return (
                                    <SidebarMenuItem
                                        key={item.to}
                                        className="relative"
                                    >
                                        {isActive && (
                                            <div className="absolute inset-0 rounded-xl bg-primary z-0" />
                                        )}
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className={
                                                isActive
                                                    ? "hover:bg-transparent!"
                                                    : ""
                                            }
                                        >
                                            <Link
                                                to={item.to}
                                                className={`relative z-10 ${
                                                    isActive
                                                        ? "text-white! font-semibold!"
                                                        : ""
                                                }`}
                                            >
                                                <item.icon
                                                    className={`h-4 w-4 ${isActive ? "" : "text-muted-foreground/60"}`}
                                                />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="mt-auto px-2 pb-4 border-t border-border/40 pt-3">
                <SidebarMenu>
                    <SidebarMenuItem className="mt-2">
                        <ProfilePopover
                            trigger={
                                <SidebarMenuButton tooltip="Профиль">
                                    <Avatar className="size-8 -ml-1.5">
                                        {avatarUrl && (
                                            <AvatarImage
                                                src={avatarUrl}
                                                alt={displayName}
                                            />
                                        )}
                                        <AvatarFallback className="bg-blue-500/10 text-blue-500 text-[10px] font-semibold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{displayName}</span>
                                </SidebarMenuButton>
                            }
                        />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

function AdminLayout() {
    const routerState = useRouterState();
    const isLoginPage = routerState.location.pathname === "/admin/login";

    if (isLoginPage) {
        return <Outlet />;
    }

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset className="bg-background rounded-xl m-4">
                <main className="mx-auto w-full flex-1 px-4 py-6 md:px-8 md:py-8">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

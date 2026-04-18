import { Link, getRouteApi, useRouterState } from "@tanstack/react-router";
import {
    ChartBarIcon,
    Cog6ToothIcon,
    InboxIcon,
    PlusIcon,
} from "@heroicons/react/24/solid";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { ProfilePopover } from "@/shared/layout/profile-popover";
import { useListRequestsApiV1ClientRequestsGet } from "@/lib/api/generated/client-requests/client-requests";
import { cn } from "@/lib/utils";

const appRoute = getRouteApi("/_app");

const ADMIN_NAV_ITEMS = [
    { to: "/dashboard", label: "Дашборд", icon: ChartBarIcon },
    { to: "/appeals", label: "Обращения", icon: InboxIcon },
    { to: "/settings", label: "Настройка", icon: Cog6ToothIcon },
] as const;

function isChatNewRoute(pathname: string) {
    return pathname === "/chat" || pathname === "/chat/";
}

export function AppSidebar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const { role } = appRoute.useRouteContext();
    const isAdmin = role === "admin";

    const requestsQuery = useListRequestsApiV1ClientRequestsGet(undefined, {
        query: {
            enabled: !isAdmin,
            staleTime: 30_000,
        },
    });
    const sessions =
        requestsQuery.data?.status === 200 ? requestsQuery.data.data.items : [];

    return (
        <Sidebar className="border-r-0">
            <SidebarHeader className="px-4 pb-4 pt-6">
                <Link
                    to={isAdmin ? "/dashboard" : "/chat"}
                    className="group flex items-center gap-2.5 text-sidebar-primary transition-opacity hover:opacity-90"
                >
                    <img
                        src="/images/layout/logo.png"
                        alt="Балтийский Берег"
                        className="w-10 rounded-xl object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                    <span className="font-heading text-[15px] font-semibold tracking-tight text-white">
                        Балтийский Берег
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="gap-2 px-3">
                {isAdmin && (
                    <SidebarGroup className="p-0">
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {ADMIN_NAV_ITEMS.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname.startsWith(
                                        item.to,
                                    );
                                    return (
                                        <SidebarMenuItem key={item.to}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                className={cn(
                                                    "h-10 text-[14px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                    isActive &&
                                                        "bg-sidebar-accent text-sidebar-accent-foreground",
                                                )}
                                            >
                                                <Link to={item.to}>
                                                    <Icon className="size-4" />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {!isAdmin && (
                    <SidebarGroup className="mt-2 p-0">
                        <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/60">
                            Чат с ассистентом
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isChatNewRoute(pathname)}
                                        className={cn(
                                            "h-10 text-[14px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                            isChatNewRoute(pathname) &&
                                                "bg-sidebar-accent text-sidebar-accent-foreground",
                                        )}
                                    >
                                        <Link to="/chat">
                                            <PlusIcon className="size-4" />
                                            <span>Новый чат</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                {requestsQuery.isLoading ? (
                                    <SidebarLoadingRows />
                                ) : sessions.length === 0 ? (
                                    <p className="px-3 py-2 text-[12px] text-sidebar-foreground/50">
                                        Новых обращений пока нет.
                                    </p>
                                ) : (
                                    sessions.slice(0, 30).map((session) => {
                                        const isActive = pathname.includes(
                                            `/chat/${session.id}`,
                                        );
                                        const title =
                                            session.title ||
                                            session.description?.slice(0, 60) ||
                                            "Обращение";
                                        const dotClass =
                                            session.status === "closed"
                                                ? "bg-emerald-500"
                                                : session.status ===
                                                    "in_progress"
                                                  ? "bg-sidebar-primary"
                                                  : "bg-amber-400";
                                        return (
                                            <SidebarMenuItem key={session.id}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    size="sm"
                                                    className={cn(
                                                        "h-9 text-[13px] text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                        isActive &&
                                                            "bg-sidebar-accent text-sidebar-accent-foreground",
                                                        session.status ===
                                                            "closed" &&
                                                            "opacity-70",
                                                    )}
                                                >
                                                    <Link
                                                        to="/chat/$chatId"
                                                        params={{
                                                            chatId: session.id,
                                                        }}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "size-2 shrink-0 rounded-full ring-2 ring-sidebar-accent/40",
                                                                dotClass,
                                                            )}
                                                            aria-hidden
                                                        />
                                                        <span className="truncate">
                                                            {title}
                                                        </span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })
                                )}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="px-3 pb-4">
                <ProfilePopover />
            </SidebarFooter>
        </Sidebar>
    );
}

function SidebarLoadingRows() {
    return (
        <div className="flex flex-col gap-2 px-1 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="h-8 rounded-md bg-sidebar-accent/40"
                    style={{
                        animation: `soft-pulse 1.8s ease-in-out ${i * 0.2}s infinite`,
                    }}
                />
            ))}
        </div>
    );
}

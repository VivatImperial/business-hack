import { Link, useRouterState } from "@tanstack/react-router";
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
import { getRole } from "@/lib/auth";

const ADMIN_NAV_ITEMS = [
    { to: "/dashboard", label: "Дашборд", icon: ChartBarIcon },
    { to: "/appeals", label: "Обращения", icon: InboxIcon },
    { to: "/settings", label: "Настройка", icon: Cog6ToothIcon },
] as const;

export function AppSidebar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const isAdmin = getRole() === "admin";

    const requestsQuery = useListRequestsApiV1ClientRequestsGet(undefined, {
        query: {
            enabled: !isAdmin,
            staleTime: 30_000,
        },
    });
    const sessions =
        requestsQuery.data?.status === 200
            ? requestsQuery.data.data.items
            : [];

    return (
        <Sidebar className="border-r-0">
            <SidebarHeader className="px-4 pt-6 pb-4">
                <Link
                    to="/dashboard"
                    className="flex items-center gap-3 pl-2' text-sidebar-primary hover:opacity-90 transition-opacity"
                >
                    <img
                        src="/images/layout/logo.webp"
                        alt="Балтийский Берег"
                        className="h-12 w-auto rounded-xl"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-3 gap-2">
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
                                                    "h-11 text-[14px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                    isActive &&
                                                        "bg-sidebar-accent text-sidebar-accent-foreground",
                                                )}
                                            >
                                                <Link to={item.to}>
                                                    <Icon className="size-5" />
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
                    <SidebarGroup className="p-0 mt-2">
                        <SidebarGroupLabel className="px-3 text-sidebar-foreground/70">
                            Чат с ассистентом
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={
                                            pathname === "/chat" ||
                                            pathname === "/chat/"
                                        }
                                        className={cn(
                                            "h-10 text-[14px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                            (pathname === "/chat" ||
                                                pathname === "/chat/") &&
                                                "bg-sidebar-accent text-sidebar-accent-foreground",
                                        )}
                                    >
                                        <Link to="/chat">
                                            <PlusIcon className="size-4" />
                                            <span>Новый чат</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                {sessions.slice(0, 30).map((session) => {
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
                                            : session.status === "in_progress"
                                              ? "bg-sidebar-primary"
                                              : "bg-amber-400";
                                    return (
                                        <SidebarMenuItem key={session.id}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                size="sm"
                                                className={cn(
                                                    "h-9 text-[13px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                    isActive &&
                                                        "bg-sidebar-accent text-sidebar-accent-foreground",
                                                    session.status === "closed" &&
                                                        "opacity-70",
                                                )}
                                            >
                                                <Link
                                                    to="/chat/$chatId"
                                                    params={{ chatId: session.id }}
                                                >
                                                    <span
                                                        className={cn(
                                                            "size-2 shrink-0 rounded-full",
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
                                })}
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

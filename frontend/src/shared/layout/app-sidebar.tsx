import { Link, useRouterState } from "@tanstack/react-router";
import {
    ChartBarIcon,
    Cog6ToothIcon,
    InboxIcon,
    KeyIcon,
    PlusIcon,
    ChatBubbleLeftRightIcon,
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
import { useChatSessions } from "@/features/chat/lib/chat-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { to: "/dashboard", label: "Дашборд", icon: ChartBarIcon },
    { to: "/appeals", label: "Обращения", icon: InboxIcon },
    { to: "/settings", label: "Настройка", icon: Cog6ToothIcon },
    { to: "/access", label: "Доступы", icon: KeyIcon },
] as const;

export function AppSidebar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const { sessions } = useChatSessions();

    return (
        <Sidebar className="border-r-0">
            <SidebarHeader className="px-4 pt-6 pb-4">
                <Link
                    to="/dashboard"
                    className="flex items-center gap-3 text-sidebar-primary hover:opacity-90 transition-opacity"
                >
                    <img
                        src="/images/layout/logo.webp"
                        alt="Балтийский Берег"
                        className="h-12 w-auto"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-3 gap-2">
                <SidebarGroup className="p-0">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname.startsWith(item.to);
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

                            {sessions.slice(0, 20).map((session) => {
                                const isActive = pathname.includes(
                                    `/chat/${session.id}`,
                                );
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
                                            )}
                                        >
                                            <Link
                                                to="/chat/$chatId"
                                                params={{ chatId: session.id }}
                                            >
                                                <ChatBubbleLeftRightIcon className="size-4" />
                                                <span className="truncate">
                                                    {session.title ||
                                                        "Новый чат"}
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="px-3 pb-4">
                <ProfilePopover />
            </SidebarFooter>
        </Sidebar>
    );
}

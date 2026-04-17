import { Link, useRouterState } from "@tanstack/react-router";
import {
    ChartBarIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
    Cog6ToothIcon,
    TagIcon,
    UserGroupIcon,
    WalletIcon,
} from "@heroicons/react/24/solid";
const logoSrc = "/images/common/logo.webp";
const managerSrc = "/images/common/manager.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
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
import { ManagerPopover } from "@/shared/layout/manager-popover";
import { ProfilePopover } from "@/shared/layout/profile-popover";
import { authQueries } from "@/lib/queries/auth";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

const navItems = [
    {
        title: "Статистика",
        to: "/dashboard" as const,
        icon: ChartBarIcon,
        tourId: "dashboard",
    },
    {
        title: "Лиды",
        to: "/leads" as const,
        icon: UserGroupIcon,
        tourId: "leads",
    },
    {
        title: "Чаты",
        to: "/chats" as const,
        icon: ChatBubbleLeftRightIcon,
        tourId: "chats",
    },
    {
        title: "Мой чат",
        to: "/my-chat" as const,
        icon: TagIcon,
        tourId: "my-chat",
    },
    {
        title: "Баланс",
        to: "/balance" as const,
        icon: WalletIcon,
        tourId: "balance",
    },
    {
        title: "Настройки",
        to: "/settings" as const,
        icon: Cog6ToothIcon,
        tourId: "settings",
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

const appRoute = getRouteApi("/_app");

export function AppSidebar({ disabled }: { disabled?: boolean }) {
    const routerState = useRouterState();
    const currentPath = routerState.location.pathname;
    const { token } = appRoute.useRouteContext();
    const { data } = useQuery(authQueries.me(token));
    const displayName = data?.displayName || data?.username || "user";
    const avatarUrl = data?.avatarUrl;
    const initials = getInitials(displayName) || "U";
    const effectiveNavItems = navItems;

    return (
        <Sidebar>
            <SidebarHeader className="px-4 pt-5 pb-2">
                <Link
                    to="/dashboard"
                    className={`flex items-center px-2 gap-2 ${disabled ? "pointer-events-none opacity-50" : ""}`}
                >
                    <img
                        src={logoSrc}
                        alt="Пульсар"
                        className="size-7 rounded-full"
                    />
                    <span className="font-pixel text-lg tracking-wide">
                        Пульсар
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-2 pt-4">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {effectiveNavItems.map((item) => {
                                const isActive =
                                    item.to === "/dashboard"
                                        ? currentPath === "/dashboard"
                                        : currentPath.startsWith(item.to);

                                return (
                                    <SidebarMenuItem
                                        key={item.to}
                                        className="relative"
                                        data-tour-target={
                                            "tourId" in item
                                                ? item.tourId
                                                : undefined
                                        }
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
                                            disabled={
                                                disabled &&
                                                item.to !== "/settings"
                                            }
                                        >
                                            <Link
                                                to={item.to}
                                                className={`relative z-10 ${
                                                    isActive
                                                        ? "text-white! font-semibold!"
                                                        : ""
                                                } ${
                                                    disabled &&
                                                    item.to !== "/settings"
                                                        ? "pointer-events-none opacity-50"
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
                    <SidebarMenuItem data-tour-target="guide">
                        <SidebarMenuButton
                            asChild
                            tooltip="Руководство"
                            size="sm"
                            isActive={currentPath === "/guide"}
                        >
                            <Link to="/guide">
                                <span className="flex size-5 items-center justify-center shrink-0">
                                    <BookOpenIcon className="h-4 w-4 text-muted-foreground/60" />
                                </span>
                                <span className="font-medium">Руководство</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem data-tour-target="manager">
                        <ManagerPopover
                            trigger={
                                <SidebarMenuButton
                                    tooltip="Ваш менеджер"
                                    size="sm"
                                >
                                    <img
                                        src={managerSrc}
                                        alt="Менеджер"
                                        className="size-5 shrink-0 rounded-full object-cover"
                                    />
                                    <span className="font-medium">
                                        Ваш менеджер
                                    </span>
                                </SidebarMenuButton>
                            }
                        />
                    </SidebarMenuItem>
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

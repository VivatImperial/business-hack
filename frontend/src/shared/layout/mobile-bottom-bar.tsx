import { Link, getRouteApi, useRouterState } from "@tanstack/react-router";
import {
    ChartBarIcon,
    Cog6ToothIcon,
    InboxIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    UserCircleIcon,
    ChevronLeftIcon,
} from "@heroicons/react/24/solid";

import { ProfilePopover } from "@/shared/layout/profile-popover";
import { cn } from "@/lib/utils";

const appRoute = getRouteApi("/_app");

type IconComp = React.ComponentType<{ className?: string }>;

const ADMIN_NAV_ITEMS: ReadonlyArray<{
    to: "/dashboard" | "/appeals" | "/settings";
    label: string;
    icon: IconComp;
}> = [
    { to: "/dashboard", label: "Дашборд", icon: ChartBarIcon },
    { to: "/appeals", label: "Обращения", icon: InboxIcon },
    { to: "/settings", label: "Настройка", icon: Cog6ToothIcon },
];

/**
 * Fat filled icon chip — single element for the mobile bottom bar.
 * Active state = dark navy background + white icon, inactive = soft chip.
 */
function IconChip({
    Icon,
    active,
    label,
}: {
    Icon: IconComp;
    active: boolean;
    label: string;
}) {
    return (
        <span
            aria-label={label}
            className={cn(
                "flex size-11 items-center justify-center rounded-2xl transition-colors",
                active
                    ? "bg-[var(--brand-dark)] text-white"
                    : "bg-[var(--brand-cream)] text-[var(--brand-text-dim)] hover:bg-[var(--brand-sage-deep)] hover:text-[var(--brand-dark)]",
            )}
        >
            <Icon className="size-6" />
        </span>
    );
}

export function MobileBottomBar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const { role } = appRoute.useRouteContext();
    const isAdmin = role === "admin";

    const isNewChatRoute = pathname === "/chat" || pathname === "/chat/";
    const isInSessionChat =
        pathname.startsWith("/chat/") && !isNewChatRoute;

    if (isAdmin) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--brand-border)] bg-background px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
                {ADMIN_NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.to);
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className="flex items-center justify-center"
                        >
                            <IconChip
                                Icon={item.icon}
                                active={isActive}
                                label={item.label}
                            />
                        </Link>
                    );
                })}
                <ProfilePopover
                    trigger={
                        <button
                            type="button"
                            className="flex items-center justify-center"
                            aria-label="Профиль"
                        >
                            <IconChip
                                Icon={UserCircleIcon}
                                active={false}
                                label="Профиль"
                            />
                        </button>
                    }
                />
            </div>
        );
    }

    /* Client: sessions sheet + new-chat + profile */
    if (isInSessionChat) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-[var(--brand-border)] bg-background px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
                <Link
                    to="/chat"
                    className="flex items-center justify-center gap-2 text-[var(--brand-dark)]"
                >
                    <IconChip
                        Icon={ChevronLeftIcon}
                        active={false}
                        label="Назад"
                    />
                    <span className="text-sm font-medium">Назад к чатам</span>
                </Link>
                <ProfilePopover
                    trigger={
                        <button
                            type="button"
                            className="flex items-center justify-center"
                            aria-label="Профиль"
                        >
                            <IconChip
                                Icon={UserCircleIcon}
                                active={false}
                                label="Профиль"
                            />
                        </button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--brand-border)] bg-background px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
            <Link to="/chat" className="flex items-center justify-center">
                <IconChip
                    Icon={ChatBubbleOvalLeftEllipsisIcon}
                    active={isNewChatRoute}
                    label="Мои чаты"
                />
            </Link>

            <ProfilePopover
                trigger={
                    <button
                        type="button"
                        className="flex items-center justify-center"
                        aria-label="Профиль"
                    >
                        <IconChip
                            Icon={UserCircleIcon}
                            active={false}
                            label="Профиль"
                        />
                    </button>
                }
            />
        </div>
    );
}

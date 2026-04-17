import { createPortal } from "react-dom";
import { Link, useRouterState } from "@tanstack/react-router";
import {
    Cog6ToothIcon,
    BookOpenIcon,
    ArrowRightStartOnRectangleIcon,
    XMarkIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { removeToken, removeTenantId } from "@/lib/auth";
import { authQueries } from "@/lib/queries/auth";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { MANAGER_CONTACT_URL } from "@/shared/config/contact";
const managerSrc = "/images/common/manager.png";

const TG_MANAGER = MANAGER_CONTACT_URL;

function getInitials(name: string): string {
    return name
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0].toUpperCase())
        .join("");
}

const appRoute = getRouteApi("/_app");

const MENU_ITEMS = [
    { title: "Настройки", to: "/settings" as const, icon: Cog6ToothIcon },
    { title: "Руководство", to: "/guide" as const, icon: BookOpenIcon },
] as const;

export function MobileMoreSheet({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { token } = appRoute.useRouteContext();
    const { data } = useQuery(authQueries.me(token));
    const displayName = data?.displayName || data?.username || "user";
    const avatarUrl = data?.avatarUrl;
    const initials = getInitials(displayName) || "U";
    const routerState = useRouterState();
    const currentPath = routerState.location.pathname;

    const handleLogout = () => {
        removeToken();
        removeTenantId();
        window.location.href = "/login";
    };

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex flex-col justify-end bg-black/40 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="bg-popover rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 safe-area-bottom"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                    <h3 className="text-[16px] font-semibold text-foreground">
                        Ещё
                    </h3>
                    <button
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                </div>

                {/* Profile card */}
                <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                    <Avatar className="size-10">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                        <AvatarFallback className="bg-blue-500/10 text-blue-500 text-sm font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-foreground truncate">
                            {displayName}
                        </p>
                    </div>
                </div>

                {/* Menu items */}
                <div className="px-4 pb-2">
                    {MENU_ITEMS.map((item) => {
                        const isActive = currentPath.startsWith(item.to);
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors ${
                                    isActive
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-foreground hover:bg-muted/50"
                                }`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="flex-1 text-[15px] font-medium">
                                    {item.title}
                                </span>
                                <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40" />
                            </Link>
                        );
                    })}

                    {/* Manager link */}
                    <a
                        href={TG_MANAGER}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-foreground hover:bg-muted/50 transition-colors"
                    >
                        <Avatar className="size-5">
                            <AvatarImage src={managerSrc} alt="Менеджер" />
                            <AvatarFallback className="text-[10px]">
                                ЕГ
                            </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-[15px] font-medium">
                            Ваш менеджер
                        </span>
                        <ChevronRightIcon className="size-4 text-muted-foreground/40" />
                    </a>
                </div>

                {/* Logout */}
                <div className="px-4 pb-5 pt-1">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/60 px-4 py-3 text-[14px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                        <ArrowRightStartOnRectangleIcon className="size-4" />
                        Выйти
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
    ChartBarIcon,
    Cog6ToothIcon,
    InboxIcon,
    PlusIcon,
    QueueListIcon,
    UserCircleIcon,
} from "@heroicons/react/24/solid";

import { useListRequestsApiV1ClientRequestsGet } from "@/lib/api/generated/client-requests/client-requests";
import { ProfilePopover } from "@/shared/layout/profile-popover";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/shared/ui/sheet";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/lib/utils";
import { getRole } from "@/lib/auth";

const ADMIN_NAV_ITEMS = [
    { to: "/dashboard", label: "Дашборд", icon: ChartBarIcon },
    { to: "/appeals", label: "Обращения", icon: InboxIcon },
    { to: "/settings", label: "Настройка", icon: Cog6ToothIcon },
] as const;

function barItemClass(isActive: boolean) {
    return cn(
        "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 transition-colors min-w-0",
        isActive
            ? "text-primary"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
    );
}

export function MobileBottomBar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const isAdmin = getRole() === "admin";
    const [sessionsOpen, setSessionsOpen] = useState(false);

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

    const isNewChatRoute =
        pathname === "/chat" || pathname === "/chat/";
    const isInSessionChat =
        pathname.startsWith("/chat/") && pathname !== "/chat" && pathname !== "/chat/";

    if (isAdmin) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-border bg-background px-2 pb-[env(safe-area-inset-bottom)] pt-2 md:hidden">
                {ADMIN_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.to);

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={barItemClass(isActive)}
                        >
                            <Icon className="size-5 shrink-0" />
                            <span className="text-[10px] font-medium leading-none truncate max-w-full">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
                <ProfilePopover
                    trigger={
                        <button
                            type="button"
                            className={barItemClass(false)}
                        >
                            <UserCircleIcon className="size-5 shrink-0" />
                            <span className="text-[10px] font-medium leading-none">
                                Профиль
                            </span>
                        </button>
                    }
                />
            </div>
        );
    }

    /* Client: новый чат + список сессий + профиль */
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-border bg-background px-2 pb-[env(safe-area-inset-bottom)] pt-2 md:hidden">
            <Sheet open={sessionsOpen} onOpenChange={setSessionsOpen}>
                <SheetTrigger asChild>
                    <button
                        type="button"
                        className={barItemClass(isInSessionChat)}
                    >
                        <QueueListIcon className="size-5 shrink-0" />
                        <span className="text-[10px] font-medium leading-none">
                            Мои чаты
                        </span>
                    </button>
                </SheetTrigger>
                <SheetContent
                    side="bottom"
                    className="flex max-h-[85vh] flex-col gap-0 rounded-t-2xl p-0"
                >
                    <SheetHeader className="border-b border-border px-4 pb-3 pt-4 text-left">
                        <SheetTitle className="text-base">Мои чаты</SheetTitle>
                    </SheetHeader>
                    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
                        <SheetClose asChild>
                            <Link
                                to="/chat"
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors",
                                    isNewChatRoute
                                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                        : "hover:bg-accent",
                                )}
                                onClick={() => setSessionsOpen(false)}
                            >
                                <PlusIcon className="size-5 shrink-0" />
                                Новый чат
                            </Link>
                        </SheetClose>

                        {requestsQuery.isLoading ? (
                            <div className="flex flex-col gap-2 px-1 py-2">
                                <Skeleton className="h-11 w-full rounded-xl" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                                Пока нет обращений. Начните новый чат.
                            </p>
                        ) : (
                            sessions.slice(0, 50).map((session) => {
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
                                          ? "bg-primary"
                                          : "bg-amber-400";
                                return (
                                    <SheetClose asChild key={session.id}>
                                        <Link
                                            to="/chat/$chatId"
                                            params={{ chatId: session.id }}
                                            className={cn(
                                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                                                isActive
                                                    ? "bg-accent text-accent-foreground"
                                                    : "hover:bg-accent/70",
                                                session.status === "closed" &&
                                                    "opacity-80",
                                            )}
                                            onClick={() =>
                                                setSessionsOpen(false)
                                            }
                                        >
                                            <span
                                                className={cn(
                                                    "size-2 shrink-0 rounded-full",
                                                    dotClass,
                                                )}
                                                aria-hidden
                                            />
                                            <span className="line-clamp-2 min-w-0 flex-1">
                                                {title}
                                            </span>
                                        </Link>
                                    </SheetClose>
                                );
                            })
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <Link
                to="/chat"
                className={barItemClass(isNewChatRoute)}
            >
                <PlusIcon className="size-5 shrink-0" />
                <span className="text-[10px] font-medium leading-none">
                    Новый чат
                </span>
            </Link>

            <ProfilePopover
                trigger={
                    <button
                        type="button"
                        className={barItemClass(false)}
                    >
                        <UserCircleIcon className="size-5 shrink-0" />
                        <span className="text-[10px] font-medium leading-none">
                            Профиль
                        </span>
                    </button>
                }
            />
        </div>
    );
}

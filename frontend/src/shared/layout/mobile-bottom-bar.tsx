import { Link, useRouterState } from "@tanstack/react-router";
import {
    ChartBarIcon,
    Cog6ToothIcon,
    InboxIcon,
    KeyIcon,
    ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { to: "/dashboard", label: "Дашборд", icon: ChartBarIcon },
    { to: "/appeals", label: "Обращения", icon: InboxIcon },
    { to: "/chat", label: "Чат", icon: ChatBubbleLeftRightIcon },
    { to: "/settings", label: "Настройка", icon: Cog6ToothIcon },
    { to: "/access", label: "Доступы", icon: KeyIcon },
] as const;

export function MobileBottomBar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-border bg-background px-2 pb-[env(safe-area-inset-bottom)] pt-2 md:hidden">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.to);
                
                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 py-1 px-2 rounded-lg transition-colors",
                            isActive 
                                ? "text-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                    >
                        <Icon className="size-5" />
                        <span className="text-[10px] font-medium leading-none">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}

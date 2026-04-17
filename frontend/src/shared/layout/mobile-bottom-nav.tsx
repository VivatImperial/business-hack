import { Link, useRouterState } from "@tanstack/react-router";
import { ChartBarIcon, ChatBubbleLeftRightIcon, TagIcon, WalletIcon, Bars3Icon } from "@heroicons/react/24/solid";
import { useState, useMemo } from "react";
import { MobileMoreSheet } from "./mobile-more-sheet";
import { motion } from "@/shared/animations/motion";

const NAV_ITEMS = [
    { title: "Главная", to: "/dashboard" as const, icon: ChartBarIcon },
    { title: "Чаты", to: "/chats" as const, icon: ChatBubbleLeftRightIcon },
    { title: "Мой чат", to: "/my-chat" as const, icon: TagIcon },
    { title: "Баланс", to: "/balance" as const, icon: WalletIcon },
] as const;

const MORE_PATHS = ["/settings", "/guide", "/prompts"];

export function MobileBottomNav({ disabled }: { disabled?: boolean }) {
    const routerState = useRouterState();
    const currentPath = routerState.location.pathname;
    const [moreOpen, setMoreOpen] = useState(false);

    const isMoreActive = MORE_PATHS.some((p) => currentPath.startsWith(p));

    const activeIndex = useMemo(() => {
        const idx = NAV_ITEMS.findIndex((item) =>
            item.to === "/dashboard"
                ? currentPath === "/dashboard"
                : currentPath.startsWith(item.to),
        );
        if (idx >= 0) return idx;
        if (isMoreActive) return NAV_ITEMS.length; // "More" tab index
        return -1;
    }, [currentPath, isMoreActive]);

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/40 safe-area-bottom">
                <div className="relative flex items-center justify-around h-[56px] px-1">
                    {NAV_ITEMS.map((item, index) => {
                        const isActive = activeIndex === index;
                        const isDisabled =
                            disabled && (item.to as string) !== "/settings";
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`relative flex flex-col items-center justify-center gap-[3px] flex-1 h-full z-10 ${
                                    isDisabled
                                        ? "pointer-events-none opacity-30"
                                        : ""
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-x-1 top-1 bottom-1 rounded-2xl bg-primary"
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 32,
                                        }}
                                    />
                                )}
                                <item.icon
                                    className={`relative z-10 h-5 w-5 ${
                                        isActive
                                            ? "text-white"
                                            : "text-muted-foreground"
                                    }`}
                                />
                                <span
                                    className={`relative z-10 text-[10px] leading-none ${
                                        isActive
                                            ? "text-white font-semibold"
                                            : "text-muted-foreground font-medium"
                                    }`}
                                >
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More tab */}
                    <button
                        onClick={() => setMoreOpen(true)}
                        className="relative flex flex-col items-center justify-center gap-[3px] flex-1 h-full z-10"
                    >
                        {isMoreActive && (
                            <motion.div
                                layoutId="nav-pill"
                                className="absolute inset-x-1 top-1 bottom-1 rounded-2xl bg-primary"
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 32,
                                }}
                            />
                        )}
                        <Bars3Icon
                            className={`relative z-10 h-5 w-5 ${
                                isMoreActive ? "text-white" : "text-muted-foreground"
                            }`}
                        />
                        <span
                            className={`relative z-10 text-[10px] leading-none ${
                                isMoreActive
                                    ? "text-white font-semibold"
                                    : "text-muted-foreground font-medium"
                            }`}
                        >
                            Ещё
                        </span>
                    </button>
                </div>
            </nav>

            <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
        </>
    );
}

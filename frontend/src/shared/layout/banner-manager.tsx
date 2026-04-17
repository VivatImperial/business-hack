import { useState } from "react";
import Cookies from "js-cookie";
import { Link, useRouterState } from "@tanstack/react-router";
import { XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import {
    ExclamationCircleIcon,
    CurrencyDollarIcon,
    InboxArrowDownIcon,
} from "@heroicons/react/24/solid";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { renderIssueMessage } from "@/features/settings/lib/issues";
import type { Banner } from "./banner-types";

const COLLAPSED_COOKIE = "issues_banner_collapsed";

const iconConfig = {
    default: {
        text: "text-blue-500",
        Icon: InboxArrowDownIcon,
    },
    warning: {
        text: "text-amber-500",
        Icon: CurrencyDollarIcon,
    },
    error: {
        text: "text-red-500",
        Icon: ExclamationCircleIcon,
    },
} as const;

function IssuesBanner({
    banner,
    issues,
    text,
    Icon,
    onDismiss,
    initialCollapsed = false,
}: {
    banner: Banner;
    issues: Banner["issues"] & object;
    text: string;
    Icon: React.ComponentType<{ className?: string }>;
    onDismiss: (id: string) => void;
    initialCollapsed?: boolean;
}) {
    const [collapsed, setCollapsed] = useState(initialCollapsed ?? false);

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        Cookies.set(COLLAPSED_COOKIE, next ? "1" : "0", { path: "/", sameSite: "lax", expires: 30 });
    };

    return (
        <TooltipProvider>
            <div className="relative rounded-2xl bg-background border border-border/40 px-4 py-3 sm:px-5 sm:py-3.5">
                {/* Header row — always visible */}
                <button
                    type="button"
                    onClick={toggle}
                    className="flex w-full items-center gap-3 text-left"
                >
                    <div className={`shrink-0 flex items-center justify-center size-8 rounded-full ${text}`}>
                        <Icon className="size-8" />
                    </div>
                    <h3 className="flex-1 text-[15px] font-semibold text-foreground leading-tight">
                        {banner.title}
                    </h3>
                    <ChevronDownIcon
                        className={`size-4 text-muted-foreground transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
                    />
                </button>

                {/* Expandable issues list */}
                {!collapsed && (
                    <ul className="flex flex-col gap-1 mt-2 ml-11">
                        {issues.map((issue) => (
                            <li
                                key={issue.code}
                                className="text-[14px] text-muted-foreground leading-relaxed [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-border hover:[&_a]:decoration-foreground [&_a]:transition-colors"
                            >
                                {renderIssueMessage(issue)}
                            </li>
                        ))}
                    </ul>
                )}

                {banner.isDismissible && (
                    <button
                        onClick={() => onDismiss(banner.id)}
                        className="absolute top-3 right-3 p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                        aria-label="Закрыть"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                )}
            </div>
        </TooltipProvider>
    );
}

function BannerCard({
    banner,
    onDismiss,
    issuesInitialCollapsed = false,
}: {
    banner: Banner;
    onDismiss: (id: string) => void;
    issuesInitialCollapsed?: boolean;
}) {
    const { text, Icon } = iconConfig[banner.variant];
    const currentPath = useRouterState({
        select: (s) => s.location.pathname,
    });
    const isOnTargetPage = banner.action
        ? currentPath === banner.action.to
        : false;

    // Issues banner — collapsible
    if (banner.issues) {
        const issues = banner.issues;
        return (
            <IssuesBanner
                banner={banner}
                issues={issues}
                text={text}
                Icon={Icon}
                onDismiss={onDismiss}
                initialCollapsed={issuesInitialCollapsed}
            />
        );
    }

    // Standard card banner (balance, leads, etc.)
    return (
        <div className="relative rounded-2xl bg-background border border-border/40 px-4 py-4 sm:px-5 sm:py-4 flex items-start gap-3.5 sm:gap-4">
            <div
                className={`shrink-0 mt-0.5 flex items-center justify-center size-8 rounded-full ${text}`}
            >
                <Icon className="size-4" />
            </div>

            <div
                className={`flex-1 min-w-0 flex flex-col gap-1.5 ${banner.isDismissible ? "pr-6" : ""}`}
            >
                <h3 className="text-[15px] font-semibold text-foreground leading-tight">
                    {banner.title}
                </h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                    {banner.description as string}
                </p>
                {banner.action &&
                    (isOnTargetPage ? (
                        <span className="mt-1 inline-flex items-center justify-center rounded-xl bg-blue-500/50 text-white/70 px-4 py-2 text-[13px] font-semibold w-fit cursor-default">
                            {banner.action.label}
                        </span>
                    ) : (
                        <Link
                            to={banner.action.to}
                            className="mt-1 inline-flex items-center justify-center rounded-xl bg-blue-500 text-white px-4 py-2 text-[13px] font-semibold hover:bg-blue-500/90 transition-colors w-fit active:scale-[0.97]"
                        >
                            {banner.action.label}
                        </Link>
                    ))}
            </div>

            {banner.isDismissible && (
                <button
                    onClick={() => onDismiss(banner.id)}
                    className="absolute top-3 right-3 p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                    aria-label="Закрыть"
                >
                    <XMarkIcon className="size-4" />
                </button>
            )}
        </div>
    );
}

export function BannerManager({
    banners,
    onDismiss,
    issuesBannerCollapsed: initialCollapsed = false,
}: {
    banners: Banner[];
    onDismiss: (id: string) => void;
    issuesBannerCollapsed?: boolean;
}) {
    if (banners.length === 0) return null;

    // Show only the highest-priority banner (first in queue)
    const active = banners[0];

    return (
        <div className="pt-4 md:pt-0 pb-2 md:pb-6">
            <BannerCard key={active.id} banner={active} onDismiss={onDismiss} issuesInitialCollapsed={initialCollapsed} />
        </div>
    );
}

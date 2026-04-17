import { Outlet } from "@tanstack/react-router";
import { MobileHeader } from "./mobile-header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { BannerManager } from "./banner-manager";
import type { Banner } from "./banner-types";

export function MobileLayout({
    disabled,
    banners = [],
    onDismissBanner,
    issuesBannerCollapsed = false,
}: {
    disabled?: boolean;
    banners?: Banner[];
    onDismissBanner?: (id: string) => void;
    issuesBannerCollapsed?: boolean;
}) {
    return (
        <div className="flex flex-col min-h-dvh bg-background">
            <MobileHeader />
            <main className="flex-1 px-4 py-3 pb-20 relative">
                <BannerManager
                    banners={banners}
                    onDismiss={onDismissBanner ?? (() => {})}
                    issuesBannerCollapsed={issuesBannerCollapsed}
                />
                <Outlet />
            </main>
            <MobileBottomNav disabled={disabled} />
        </div>
    );
}

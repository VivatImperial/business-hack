import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

export const getAuthState = createServerFn({ method: "GET" }).handler(
    async () => {
        const token = getCookie("auth_token");
        const tenantId = getCookie("tenant_id");
        const dismissedBanners = getCookie("dismissed_banners");
        const sidebarTourSeen = getCookie("sidebar_tour_seen");
        const issuesBannerCollapsed = getCookie("issues_banner_collapsed");
        return {
            isAuthenticated: Boolean(token && tenantId),
            token: token || undefined,
            tenantId: tenantId ? Number(tenantId) : undefined,
            dismissedBanners: dismissedBanners || undefined,
            sidebarTourSeen: sidebarTourSeen === "1",
            issuesBannerCollapsed: issuesBannerCollapsed === "1",
        };
    },
);

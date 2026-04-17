import {
    Outlet,
    HeadContent,
    Scripts,
    createRootRouteWithContext,
    redirect,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { getTenantId, getToken } from "@/lib/auth";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@/shared/styles/globals.css";

import NiceModal from "@ebay/nice-modal-react";
import { GlobalSnackbar } from "@/shared/ui/snackbar";

import { getAuthState } from "@/lib/server-fns/auth";
import { getDeviceType } from "@/lib/server-fns/device";

const MOBILE_UA_RE =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export const Route = createRootRouteWithContext<{
    queryClient: QueryClient;
    tenantId: number | undefined;
    token: string | undefined;
    isMobile: boolean;
    dismissedBanners: string | undefined;
    sidebarTourSeen: boolean;
    issuesBannerCollapsed: boolean;
}>()({
    beforeLoad: async ({ location }) => {
        const authPaths = [
            "/login",
            "/register",
            "/auth/oauth/callback",
            "/admin/login",
        ];
        const publicPaths = ["/", "/guide"];
        const isAuthPage = authPaths.some((p) =>
            location.pathname.startsWith(p),
        );
        const isPublicPage = publicPaths.includes(location.pathname);

        let tenantId: number | undefined;
        let token: string | undefined;
        let isMobile = false;
        let dismissedBanners: string | undefined;
        let sidebarTourSeen = false;
        let issuesBannerCollapsed = false;

        if (typeof document !== "undefined") {
            tenantId = getTenantId();
            token = getToken();
            isMobile =
                MOBILE_UA_RE.test(navigator.userAgent) ||
                window.innerWidth < 768;
            dismissedBanners = Cookies.get("dismissed_banners");
            sidebarTourSeen = Cookies.get("sidebar_tour_seen") === "1";
            issuesBannerCollapsed = Cookies.get("issues_banner_collapsed") === "1";
        } else {
            try {
                const [state, device] = await Promise.all([
                    getAuthState(),
                    getDeviceType(),
                ]);
                tenantId = state.tenantId;
                token = state.token;
                isMobile = device.isMobile;
                dismissedBanners = state.dismissedBanners;
                sidebarTourSeen = state.sidebarTourSeen;
                issuesBannerCollapsed = state.issuesBannerCollapsed;
            } catch {
                // cookies unavailable on server
            }
        }

        const isAdminPath = location.pathname.startsWith("/admin");
        const isUtmPath = location.pathname.startsWith("/utm");
        const isAuth = !!token && !!tenantId;

        if (typeof document !== "undefined") {
            console.log("[__root] beforeLoad:", { path: location.pathname, hasToken: !!token, hasTenant: !!tenantId, isAdminPath, isAuthPage, isPublicPage });
        }

        // Admin paths handle their own auth in admin/route.tsx — skip root guard
        // UTM paths handle their own redirect logic in utm/$code.tsx — skip root guard
        if (isAdminPath || isUtmPath) {
            // no-op: let child layout handle redirects
        } else if (!isAuthPage && !isPublicPage && !isAuth) {
            throw redirect({ to: "/login" });
        } else if (isAuthPage && isAuth) {
            throw redirect({ to: "/dashboard" });
        }

        return { tenantId, token, isMobile, dismissedBanners, sidebarTourSeen, issuesBannerCollapsed };
    },
    component: RootLayout,
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
        ],
        links: [
            { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
            {
                rel: "icon",
                type: "image/png",
                sizes: "32x32",
                href: "/favicon-32x32.png",
            },
            {
                rel: "icon",
                type: "image/png",
                sizes: "16x16",
                href: "/favicon-16x16.png",
            },
            {
                rel: "apple-touch-icon",
                sizes: "180x180",
                href: "/apple-touch-icon.png",
            },
            { rel: "manifest", href: "/manifest.json" },
        ],
    }),
});

function RootLayout() {
    const { queryClient } = Route.useRouteContext();

    return (
        <html lang="ru">
            <head>
                <HeadContent />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=108377825','ym');ym(108377825,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`,
                    }}
                />
                {/* Inline critical CSS to prevent FOUC — must match globals.css @theme inline + :root */}
                <style
                    dangerouslySetInnerHTML={{
                        __html: `:root{--sidebar-width:300px;--background:oklch(0.995 0.002 245);--foreground:oklch(0.155 0.014 250);--primary:#2AABEE;--primary-foreground:oklch(1 0 0);--secondary:oklch(0.955 0.008 245);--secondary-foreground:oklch(0.18 0.012 250);--muted:oklch(0.955 0.008 245);--muted-foreground:oklch(0.46 0.02 250);--accent:oklch(0.945 0.012 245);--accent-foreground:oklch(0.155 0.014 250);--border:oklch(0.915 0.012 245);--input:oklch(0.935 0.008 245);--ring:#2AABEE;--card:oklch(1 0.002 245);--card-foreground:oklch(0.155 0.014 250);--popover:oklch(1 0.002 245);--popover-foreground:oklch(0.155 0.014 250);--destructive:oklch(0.58 0.22 18);--destructive-foreground:oklch(1 0 0);--radius-xl:0.625rem;--radius-2xl:0.75rem;--radius-3xl:1rem;--font-sans:"Inter",system-ui,-apple-system,sans-serif;--font-heading:"Onest","Inter",system-ui,-apple-system,sans-serif;--color-background:var(--background);--color-foreground:var(--foreground);--color-primary:var(--primary);--color-primary-foreground:var(--primary-foreground);--color-secondary:var(--secondary);--color-secondary-foreground:var(--secondary-foreground);--color-muted:var(--muted);--color-muted-foreground:var(--muted-foreground);--color-accent:var(--accent);--color-accent-foreground:var(--accent-foreground);--color-destructive:var(--destructive);--color-destructive-foreground:var(--destructive-foreground);--color-border:var(--border);--color-input:var(--input);--color-ring:var(--ring);--color-card:var(--card);--color-card-foreground:var(--card-foreground);--color-popover:var(--popover);--color-popover-foreground:var(--popover-foreground);--color-blue-50:#F0F9FF;--color-blue-100:#E0F2FE;--color-blue-200:#BAE6FD;--color-blue-300:#7DD3FC;--color-blue-400:#38BDF8;--color-blue-500:#2AABEE;--color-blue-600:#0284C7;--color-blue-700:#0369A1;--color-blue-800:#075985;--color-blue-900:#0C4A6E;--color-sidebar:var(--sidebar-background);--color-sidebar-foreground:var(--sidebar-foreground);--color-sidebar-primary:var(--sidebar-primary);--color-sidebar-primary-foreground:var(--sidebar-primary-foreground);--color-sidebar-accent:var(--sidebar-accent);--color-sidebar-accent-foreground:var(--sidebar-accent-foreground);--color-sidebar-border:var(--sidebar-border);--color-sidebar-ring:var(--sidebar-ring);--sidebar-background:oklch(0.975 0.008 245);--sidebar-foreground:oklch(0.38 0.02 250);--sidebar-primary:#2AABEE;--sidebar-primary-foreground:oklch(1 0 0);--sidebar-accent:oklch(0.94 0.012 245);--sidebar-accent-foreground:oklch(0.14 0.012 250);--sidebar-border:oklch(0.92 0.008 245);--sidebar-ring:#2AABEE}body{background-color:oklch(0.975 0.008 245);color:var(--foreground)}`,
                    }}
                />
            </head>
            <body className="font-sans antialiased">
                <QueryClientProvider client={queryClient}>
                    <NiceModal.Provider>
                        <Outlet />
                        <GlobalSnackbar />
                    </NiceModal.Provider>
                </QueryClientProvider>
                <Scripts />
                <noscript>
                    <div>
                        <img
                            src="https://mc.yandex.ru/watch/108377825"
                            style={{ position: "absolute", left: "-9999px" }}
                            alt=""
                        />
                    </div>
                </noscript>
            </body>
        </html>
    );
}

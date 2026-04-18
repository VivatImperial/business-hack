import {
    Outlet,
    HeadContent,
    Scripts,
    createRootRouteWithContext,
    redirect,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import NiceModal from "@ebay/nice-modal-react";

import { getAuthToken } from "@/lib/auth-token";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@/shared/styles/globals.css";

import { NotFoundPage } from "@/shared/ui/not-found-page";

import { GlobalSnackbar } from "@/shared/ui/snackbar";

interface RootRouteContext {
    queryClient: QueryClient;
    token: string | undefined;
}

const AUTH_PATHS = ["/login", "/register", "/admin/login"];
const PUBLIC_PATHS = ["/"];

function isAuthPath(pathname: string): boolean {
    return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.includes(pathname);
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
    beforeLoad: ({ location }) => {
        const token = getAuthToken();

        const isAuth = !!token;
        const pathname = location.pathname;
        const isLanding = isPublicPath(pathname);
        const isAuthPage = isAuthPath(pathname);
        const isApp = !isLanding && !isAuthPage;

        if (isApp && !isAuth) {
            throw redirect({ to: "/login" });
        }
        if (isAuthPage && isAuth) {
            throw redirect({ to: "/dashboard" });
        }

        return { token };
    },
    component: RootLayout,
    notFoundComponent: NotFoundPage,
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            {
                name: "description",
                content:
                    "Внутренний AI-ассистент технической поддержки «Балтийского Берега». Обучен на 104 000 тикетах и базе знаний компании. Отвечает сотрудникам за секунды, показывает источники, работает в изолированном контуре.",
            },
            { title: "AI-ассистент сервис-деска — Балтийский Берег" },
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
            </head>
            <body>
                <QueryClientProvider client={queryClient}>
                    <NiceModal.Provider>
                        <Outlet />
                        <GlobalSnackbar />
                    </NiceModal.Provider>
                </QueryClientProvider>
                <Scripts />
            </body>
        </html>
    );
}

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
import { getAuthRole, type AuthRole } from "@/lib/auth-role";

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
    role: AuthRole | undefined;
}

const AUTH_PATHS = ["/login", "/register", "/admin/login"];
const PUBLIC_PATHS = ["/"];

function isAuthPath(pathname: string): boolean {
    return AUTH_PATHS.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
}

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.includes(pathname);
}

/* ─── SEO constants ─── */

const SITE_URL = "https://bereg.website";
const SITE_TITLE = "AI-ассистент сервис-деска — Балтийский Берег";
const SITE_DESCRIPTION =
    "Внутренний AI-ассистент технической поддержки «Балтийского Берега». Обучен на 104 000 тикетах и базе знаний компании. Отвечает сотрудникам за секунды, показывает источники, работает в изолированном контуре.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

const JSON_LD_ORG = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Балтийский Берег",
    url: SITE_URL,
    logo: `${SITE_URL}/images/layout/logo.png`,
    sameAs: ["https://github.com/VivatImperial/business-hack"],
    contactPoint: [
        {
            "@type": "ContactPoint",
            email: "it@baltbereg.ru",
            contactType: "technical support",
            availableLanguage: ["Russian"],
        },
    ],
};

const JSON_LD_SOFTWARE = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AI-ассистент сервис-деска",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    inLanguage: "ru",
    isAccessibleForFree: false,
    offers: {
        "@type": "Offer",
        priceCurrency: "RUB",
        price: "0",
        availability: "https://schema.org/InStock",
    },
};

const JSON_LD_WEBSITE = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Балтийский Берег · AI-ассистент",
    url: SITE_URL,
    inLanguage: "ru",
};

export const Route = createRootRouteWithContext<RootRouteContext>()({
    beforeLoad: ({ location }) => {
        const token = getAuthToken();
        const role = getAuthRole();

        const isAuth = !!token;
        const pathname = location.pathname;
        const isLanding = isPublicPath(pathname);
        const isAuthPage = isAuthPath(pathname);
        const isApp = !isLanding && !isAuthPage;

        if (isApp && !isAuth) {
            throw redirect({ to: "/login" });
        }
        if (isAuthPage && isAuth) {
            throw redirect({
                to: role === "client" ? "/chat" : "/dashboard",
            });
        }

        return { token, role };
    },
    component: RootLayout,
    notFoundComponent: NotFoundPage,
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
            },
            { title: SITE_TITLE },
            { name: "description", content: SITE_DESCRIPTION },
            { name: "robots", content: "index, follow" },
            {
                name: "keywords",
                content:
                    "AI-ассистент, сервис-деск, Балтийский Берег, IT-поддержка, ITSM, RAG, LLM, чат-бот, корпоративная база знаний",
            },
            { name: "author", content: "Балтийский Берег" },
            { name: "theme-color", content: "#0d2246" },
            { name: "color-scheme", content: "light" },
            { name: "application-name", content: "Балт Берег · AI-ассистент" },

            { property: "og:type", content: "website" },
            { property: "og:site_name", content: "Балтийский Берег" },
            { property: "og:title", content: SITE_TITLE },
            { property: "og:description", content: SITE_DESCRIPTION },
            { property: "og:url", content: SITE_URL },
            { property: "og:locale", content: "ru_RU" },
            { property: "og:image", content: OG_IMAGE },
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
            {
                property: "og:image:alt",
                content: "AI-ассистент сервис-деска «Балтийский Берег»",
            },

            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:title", content: SITE_TITLE },
            { name: "twitter:description", content: SITE_DESCRIPTION },
            { name: "twitter:image", content: OG_IMAGE },

            { name: "format-detection", content: "telephone=no" },
        ],
        links: [
            { rel: "canonical", href: SITE_URL },
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
            { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
        ],
        scripts: [
            {
                type: "application/ld+json",
                children: JSON.stringify(JSON_LD_ORG),
            },
            {
                type: "application/ld+json",
                children: JSON.stringify(JSON_LD_SOFTWARE),
            },
            {
                type: "application/ld+json",
                children: JSON.stringify(JSON_LD_WEBSITE),
            },
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

import { createFileRoute } from "@tanstack/react-router";
import { FloatingHeader, SiteFooter } from "@/features/landing";
import { GuidePage, MobileGuidePage } from "@/features/guide";

export const Route = createFileRoute("/guide")({
    component: GuideRoute,
});

function GuideRoute() {
    const { isMobile } = Route.useRouteContext();

    const navLinks = [
        { label: "Как это работает", href: "/#how-it-works" },
        { label: "Почему Пульсар", href: "/#why-pulsar" },
        { label: "Тарифы", href: "/#pricing" },
        { label: "Руководство", href: "/guide" },
    ];

    return (
        <div className="min-h-screen bg-white text-foreground selection:bg-blue-100 -mt-[16px] ">
            <FloatingHeader links={navLinks} />
            <main className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 md:py-12">
                {isMobile ? <MobileGuidePage /> : <GuidePage />}
            </main>
            <SiteFooter />
        </div>
    );
}

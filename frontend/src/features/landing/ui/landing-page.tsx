import { FloatingHeader } from "./floating-header";
import { SiteFooter } from "./site-footer";
import { HeroSection } from "./sections/hero";
import { FeaturesSection } from "./sections/features";
import { FaqSection } from "./sections/faq";
import { CtaSection } from "./sections/cta";

const NAV_LINKS = [
    { label: "Сервис", href: "#features" },
    { label: "FAQ", href: "#faq" },
    { label: "Контакты", href: "#cta" },
];

export function LandingPage() {
    return (
        <div className="bg-white text-[var(--brand-dark)] selection:bg-[var(--brand-cream-2)]">
            <FloatingHeader links={NAV_LINKS} />
            <main>
                <HeroSection />
                <FeaturesSection />
                <FaqSection />
                <CtaSection />
            </main>
            <SiteFooter />
        </div>
    );
}

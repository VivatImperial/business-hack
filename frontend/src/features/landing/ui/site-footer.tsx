import { Link } from "@tanstack/react-router";

interface Column {
    title: string;
    links: { label: string; href: string; type?: "router" | "anchor" | "external" }[];
}

const COLUMNS: Column[] = [
    {
        title: "Сервис",
        links: [
            { label: "Чат с ассистентом", href: "/login", type: "router" },
            { label: "Админ-панель", href: "/login", type: "router" },
            { label: "База знаний", href: "/login", type: "router" },
            { label: "Метрики", href: "/login", type: "router" },
        ],
    },
    {
        title: "Сайт",
        links: [
            { label: "Что внутри", href: "#features" },
            { label: "FAQ", href: "#faq" },
            { label: "Контакты", href: "#cta" },
        ],
    },
    {
        title: "Проект",
        links: [
            {
                label: "Хакатон",
                href: "https://ai-business-spb.ru/?utm_source=hackrus.ru",
                type: "external",
            },
            {
                label: "Исходники",
                href: "https://github.com/VivatImperial/business-hack",
                type: "external",
            },
        ],
    },
    {
        title: "Контакты",
        links: [
            {
                label: "it@baltbereg.ru",
                href: "mailto:it@baltbereg.ru",
                type: "external",
            },
            { label: "Вход для сотрудников", href: "/login", type: "router" },
        ],
    },
];

function renderLink(
    link: { label: string; href: string; type?: "router" | "anchor" | "external" },
) {
    const cls =
        "text-[14px] text-[var(--brand-text)] transition-colors hover:text-[var(--brand-dark)]";
    if (link.type === "router") {
        return (
            <Link to={link.href} className={cls}>
                {link.label}
            </Link>
        );
    }
    const isExternalUrl = link.href.startsWith("http");
    return (
        <a
            href={link.href}
            className={cls}
            {...(isExternalUrl
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
        >
            {link.label}
        </a>
    );
}

export function SiteFooter() {
    return (
        <footer className="bg-white">
            <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-6 md:py-20">
                <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] md:gap-10">
                    <div className="flex flex-col gap-5">
                        <span className="font-heading text-[20px] font-semibold tracking-tight text-[var(--brand-dark)]">
                            Балтийский Берег
                        </span>
                        <p className="max-w-[260px] text-[13px] leading-relaxed text-[var(--brand-text)]">
                            Демо AI-ассистента сервис-деска. Разработано для
                            хакатона.
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                            <a
                                href="mailto:it@baltbereg.ru"
                                aria-label="Email"
                                className="flex size-9 items-center justify-center rounded-full bg-[var(--brand-cream)] text-[var(--brand-dark)] transition-colors hover:bg-[var(--brand-cream-2)]"
                            >
                                <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden
                                >
                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                            </a>
                            <a
                                href="https://github.com/VivatImperial/business-hack"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub-репозиторий"
                                className="flex size-9 items-center justify-center rounded-full bg-[var(--brand-cream)] text-[var(--brand-dark)] transition-colors hover:bg-[var(--brand-cream-2)]"
                            >
                                <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    aria-hidden
                                >
                                    <path d="M12 .5C5.65.5.5 5.65.5 12A11.5 11.5 0 0 0 8.4 22.94c.58.1.79-.25.79-.56v-2c-3.22.7-3.9-1.37-3.9-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.73-1.55-2.57-.3-5.27-1.28-5.27-5.72 0-1.26.45-2.3 1.19-3.11-.12-.3-.52-1.49.11-3.1 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.61.23 2.8.11 3.1.74.81 1.19 1.85 1.19 3.11 0 4.45-2.7 5.42-5.28 5.71.41.35.78 1.04.78 2.1v3.12c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {COLUMNS.map((col) => (
                        <div key={col.title}>
                            <h4 className="font-heading text-[14px] font-semibold text-[var(--brand-dark)]">
                                {col.title}
                            </h4>
                            <ul className="mt-4 flex flex-col gap-2.5">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        {renderLink(link)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-14 flex flex-col gap-3 border-t border-[var(--brand-border)]/60 pt-6 text-[12px] text-[var(--brand-text-dim)] md:flex-row md:items-center md:justify-between">
                    <p>© {new Date().getFullYear()} «Балтийский Берег» · Хакатон</p>
                    <p>AI-ассистент сервис-деска · Демо-версия</p>
                </div>
            </div>
        </footer>
    );
}

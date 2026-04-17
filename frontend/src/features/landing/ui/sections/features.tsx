import { Link } from "@tanstack/react-router";
import {
    motion,
    blurFadeUp,
    staggerContainerDelayed,
} from "@/shared/animations/motion";

/* ── Per-card illustrations ── */

function ChatIllustration() {
    return (
        <svg
            viewBox="0 0 300 200"
            className="absolute bottom-0 right-0 h-[55%] md:h-[68%] w-auto select-none"
            aria-hidden
        >
            <g className="transition-transform duration-500 ease-out group-hover:-translate-y-1">
                <g transform="translate(28,34)">
                    <rect width="160" height="48" rx="14" fill="white" />
                    <rect
                        width="160"
                        height="48"
                        rx="14"
                        fill="none"
                        stroke="var(--brand-border)"
                        strokeWidth="1"
                    />
                    <circle cx="22" cy="24" r="7" fill="var(--brand-accent)" />
                    <rect x="40" y="17" width="86" height="5" rx="2.5" fill="var(--brand-dark)" opacity="0.35" />
                    <rect x="40" y="27" width="52" height="5" rx="2.5" fill="var(--brand-dark)" opacity="0.2" />
                </g>
            </g>

            <g className="transition-transform duration-500 ease-out origin-center group-hover:scale-110">
                <g transform="translate(62,96)">
                    <rect width="62" height="30" rx="12" fill="var(--brand-cream)" />
                    <circle cx="18" cy="15" r="3" fill="var(--brand-accent)">
                        <animate
                            attributeName="opacity"
                            values="1;0.3;1"
                            dur="1.2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle cx="30" cy="15" r="3" fill="var(--brand-accent)" opacity="0.6">
                        <animate
                            attributeName="opacity"
                            values="0.3;1;0.3"
                            dur="1.2s"
                            repeatCount="indefinite"
                            begin="0.2s"
                        />
                    </circle>
                    <circle cx="42" cy="15" r="3" fill="var(--brand-accent)" opacity="0.3">
                        <animate
                            attributeName="opacity"
                            values="0.3;1;0.3"
                            dur="1.2s"
                            repeatCount="indefinite"
                            begin="0.4s"
                        />
                    </circle>
                </g>
            </g>

            <g className="transition-transform duration-500 ease-out group-hover:translate-y-1">
                <g transform="translate(80,138)">
                    <rect width="200" height="48" rx="14" fill="var(--brand-dark)" />
                    <circle cx="20" cy="24" r="5" fill="var(--brand-sage)">
                        <animate
                            attributeName="r"
                            values="5;6.5;5"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <rect x="34" y="17" width="140" height="5" rx="2.5" fill="white" opacity="0.85" />
                    <rect x="34" y="27" width="96" height="5" rx="2.5" fill="white" opacity="0.5" />
                </g>
            </g>
        </svg>
    );
}

function AdminIllustration() {
    return (
        <svg
            viewBox="0 0 300 200"
            className="absolute bottom-0 right-0 h-[58%] md:h-[70%] w-auto select-none"
            aria-hidden
        >
            <rect x="28" y="24" width="248" height="150" rx="16" fill="var(--brand-dark-2)" />
            <rect
                x="28"
                y="24"
                width="248"
                height="150"
                rx="16"
                fill="none"
                stroke="var(--brand-dark-3)"
                strokeWidth="1"
            />

            {/* Row 1 — slider */}
            <g transform="translate(44,48)">
                <rect width="60" height="5" rx="2.5" fill="var(--brand-dark-3)" />
                <rect x="0" y="14" width="216" height="5" rx="2.5" fill="var(--brand-dark)" />
                <rect
                    x="0"
                    y="14"
                    width="130"
                    height="5"
                    rx="2.5"
                    fill="var(--brand-sage)"
                    className="transition-all duration-500 ease-out group-hover:w-[188px]"
                />
                <circle
                    cx="130"
                    cy="16.5"
                    r="7"
                    fill="white"
                    className="transition-transform duration-500 ease-out group-hover:translate-x-[58px]"
                />
            </g>

            {/* Row 2 — toggle */}
            <g transform="translate(44,90)">
                <rect width="80" height="5" rx="2.5" fill="var(--brand-dark-3)" />
                <rect x="170" y="-4" width="46" height="22" rx="11" fill="var(--brand-sage)" />
                <circle cx="206" cy="7" r="8" fill="white" />
            </g>

            {/* Row 3 — segmented control */}
            <g transform="translate(44,128)">
                <rect width="216" height="28" rx="9" fill="var(--brand-dark)" />
                <rect
                    x="4"
                    y="4"
                    width="68"
                    height="20"
                    rx="7"
                    fill="var(--brand-accent)"
                    className="transition-transform duration-500 ease-out group-hover:translate-x-[72px]"
                />

                {/* ПРОМПТ: dark text at rest (on terracotta), cream/55 on hover (on dark bg) */}
                <text
                    x="38"
                    y="18"
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                    fontSize="10"
                    fontWeight="700"
                    fill="var(--brand-dark)"
                    letterSpacing="0.6"
                    className="transition-opacity duration-500 group-hover:opacity-0"
                >
                    ПРОМПТ
                </text>
                <text
                    x="38"
                    y="18"
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                    fontSize="10"
                    fontWeight="600"
                    fill="white"
                    opacity="0"
                    letterSpacing="0.6"
                    className="opacity-0 transition-opacity duration-500 group-hover:opacity-[0.55]"
                >
                    ПРОМПТ
                </text>

                {/* ТОН: dim white at rest, dark on hover (when chip slides under it) */}
                <text
                    x="110"
                    y="18"
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                    fontSize="10"
                    fontWeight="600"
                    fill="white"
                    opacity="0.55"
                    letterSpacing="0.6"
                    className="transition-opacity duration-500 group-hover:opacity-0"
                >
                    ТОН
                </text>
                <text
                    x="110"
                    y="18"
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                    fontSize="10"
                    fontWeight="700"
                    fill="var(--brand-dark)"
                    letterSpacing="0.6"
                    className="opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                >
                    ТОН
                </text>

                {/* KB — always dim white */}
                <text
                    x="170"
                    y="18"
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                    fontSize="10"
                    fontWeight="600"
                    fill="white"
                    opacity="0.55"
                    letterSpacing="0.6"
                >
                    KB
                </text>
            </g>
        </svg>
    );
}

function KbIllustration() {
    return (
        <svg
            viewBox="0 0 300 200"
            className="absolute bottom-0 right-0 h-[60%] md:h-[72%] w-auto select-none"
            aria-hidden
        >
            <g className="transition-transform duration-500 ease-out group-hover:translate-x-1 group-hover:rotate-[4deg]">
                <g transform="translate(180,38) rotate(8)">
                    <rect width="108" height="130" rx="10" fill="var(--brand-dark)" />
                    <rect x="14" y="18" width="46" height="5" rx="2.5" fill="var(--brand-accent)" />
                    <rect x="14" y="32" width="82" height="4" rx="2" fill="var(--brand-dark-3)" />
                    <rect x="14" y="42" width="72" height="4" rx="2" fill="var(--brand-dark-3)" />
                    <rect x="14" y="52" width="84" height="4" rx="2" fill="var(--brand-dark-3)" />
                    <rect x="14" y="78" width="40" height="16" rx="5" fill="var(--brand-sage)" />
                </g>
            </g>

            <g className="transition-transform duration-500 ease-out group-hover:-translate-y-1">
                <g transform="translate(46,24)">
                    <rect width="132" height="156" rx="10" fill="white" />
                    <rect
                        width="132"
                        height="156"
                        rx="10"
                        fill="none"
                        stroke="var(--brand-dark)"
                        strokeWidth="1"
                    />
                    <rect x="16" y="22" width="60" height="6" rx="3" fill="var(--brand-dark)" />
                    <rect x="16" y="38" width="96" height="4" rx="2" fill="var(--brand-border)" />
                    <rect x="16" y="48" width="72" height="4" rx="2" fill="var(--brand-border)" />
                    <rect x="16" y="58" width="88" height="4" rx="2" fill="var(--brand-border)" />
                    <rect x="16" y="68" width="80" height="4" rx="2" fill="var(--brand-border)" />
                    <rect x="16" y="92" width="46" height="20" rx="6" fill="var(--brand-dark)" />
                    <circle cx="108" cy="134" r="6" fill="var(--brand-sage)">
                        <animate
                            attributeName="r"
                            values="6;7.5;6"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </g>
            </g>

            <g className="transition-transform duration-500 ease-out group-hover:-translate-x-1 group-hover:-translate-y-1">
                <g transform="translate(24,150)">
                    <rect width="56" height="24" rx="8" fill="var(--brand-dark)" />
                    <text
                        x="28"
                        y="16"
                        textAnchor="middle"
                        fontFamily="Inter, sans-serif"
                        fontSize="10"
                        fontWeight="700"
                        fill="white"
                        letterSpacing="0.8"
                    >
                        .PDF
                    </text>
                </g>
            </g>
        </svg>
    );
}

function MetricsIllustration() {
    return (
        <svg
            viewBox="0 0 300 200"
            className="absolute bottom-0 right-0 h-[60%] md:h-[72%] w-auto select-none"
            aria-hidden
        >
            <rect x="24" y="20" width="250" height="160" rx="16" fill="white" />
            <rect
                x="24"
                y="20"
                width="250"
                height="160"
                rx="16"
                fill="none"
                stroke="var(--brand-border)"
                strokeWidth="1"
            />

            <g
                transform="translate(40,36)"
                className="transition-transform duration-500 ease-out group-hover:-translate-y-1"
            >
                <rect width="72" height="24" rx="8" fill="var(--brand-cream)" />
                <circle cx="14" cy="12" r="4" fill="var(--brand-sage)">
                    <animate
                        attributeName="opacity"
                        values="1;0.4;1"
                        dur="1.6s"
                        repeatCount="indefinite"
                    />
                </circle>
                <text
                    x="26"
                    y="16"
                    fontFamily="Inter, sans-serif"
                    fontSize="11"
                    fontWeight="700"
                    fill="var(--brand-dark)"
                >
                    94%
                </text>
            </g>

            <g transform="translate(40,74)">
                <path
                    d="M0 72 L 30 56 L 60 62 L 90 38 L 120 48 L 156 28 L 196 34 L 220 18"
                    stroke="var(--brand-dark)"
                    strokeWidth="2.2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M0 72 L 30 56 L 60 62 L 90 38 L 120 48 L 156 28 L 196 34 L 220 18 L 220 90 L 0 90 Z"
                    fill="var(--brand-accent)"
                    className="transition-opacity duration-500 opacity-10 group-hover:opacity-25"
                />
                <circle
                    cx="90"
                    cy="38"
                    r="5"
                    fill="white"
                    stroke="var(--brand-sage)"
                    strokeWidth="2"
                    className="origin-[90px_38px] transition-transform duration-500 ease-out group-hover:scale-125"
                />
                <circle
                    cx="156"
                    cy="28"
                    r="5"
                    fill="white"
                    stroke="var(--brand-accent)"
                    strokeWidth="2"
                    className="origin-[156px_28px] transition-transform duration-500 ease-out group-hover:scale-125"
                />
                <circle
                    cx="220"
                    cy="18"
                    r="5"
                    fill="var(--brand-dark)"
                    className="origin-[220px_18px] transition-transform duration-500 ease-out group-hover:scale-125"
                />

                <g stroke="var(--brand-cream)" strokeWidth="1">
                    <line x1="0" y1="90" x2="220" y2="90" />
                </g>
            </g>
        </svg>
    );
}

interface FeatureCard {
    title: string;
    description: string;
    ctaLabel: string;
    href: string;
    variant: "cream" | "dark" | "terracotta" | "sage";
    Illustration: React.ComponentType;
}

const CARDS: FeatureCard[] = [
    {
        title: "Чат с ассистентом",
        description:
            "Спросите про пароль, VPN или 2FA. Ассистент отвечает за секунды и даёт ссылки на исходные тикеты.",
        ctaLabel: "К демо-чату",
        href: "/login",
        variant: "cream",
        Illustration: ChatIllustration,
    },
    {
        title: "Админ-панель",
        description:
            "Настраивайте промпт, тон, порог уверенности, фильтрацию тем и правила эскалации — всё в одном месте.",
        ctaLabel: "К настройкам",
        href: "/login",
        variant: "dark",
        Illustration: AdminIllustration,
    },
    {
        title: "База знаний",
        description:
            "Загрузите документы и статьи. Ассистент подтянет их в контекст и будет цитировать в ответах.",
        ctaLabel: "К базе знаний",
        href: "/login",
        variant: "terracotta",
        Illustration: KbIllustration,
    },
    {
        title: "Метрики качества",
        description:
            "Смотрите точность ответов, частоту эскалаций и активность сотрудников в понятных дашбордах.",
        ctaLabel: "К метрикам",
        href: "/login",
        variant: "sage",
        Illustration: MetricsIllustration,
    },
];

function cardClasses(variant: FeatureCard["variant"]) {
    switch (variant) {
        case "dark":
            return {
                wrapper: "bg-[var(--brand-dark)] text-white",
                title: "text-white",
                text: "text-white/75",
                button:
                    "bg-white/10 text-white hover:bg-white/15 border border-white/15",
            };
        case "terracotta":
            return {
                wrapper: "bg-[var(--brand-accent)] text-[var(--brand-dark)]",
                title: "text-[var(--brand-dark)]",
                text: "text-[var(--brand-dark)]/80",
                button: "bg-[var(--brand-dark)] text-white hover:bg-[var(--brand-dark-2)]",
            };
        case "sage":
            return {
                wrapper: "bg-[var(--brand-sage)] text-[var(--brand-dark)]",
                title: "text-[var(--brand-dark)]",
                text: "text-[var(--brand-dark)]/80",
                button: "bg-[var(--brand-dark)] text-white hover:bg-[var(--brand-dark-2)]",
            };
        case "cream":
        default:
            return {
                wrapper: "bg-[var(--brand-cream)] text-[var(--brand-dark)]",
                title: "text-[var(--brand-dark)]",
                text: "text-[var(--brand-text)]",
                button: "bg-[var(--brand-dark)] text-white hover:bg-[var(--brand-dark-2)]",
            };
    }
}

export function FeaturesSection() {
    return (
        <section id="features" className="bg-white py-16 md:py-24">
            <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6">
                <motion.div
                    variants={staggerContainerDelayed(0.1, 0.05)}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.25 }}
                    className="mb-10 md:mb-14"
                >
                    <motion.h2
                        variants={blurFadeUp}
                        className="font-heading max-w-3xl text-3xl font-semibold tracking-tight text-[var(--brand-dark)] sm:text-4xl md:text-[44px]"
                    >
                        Посмотрите, потыкайте, настройте
                    </motion.h2>
                </motion.div>

                <motion.div
                    variants={staggerContainerDelayed(0.12, 0.1)}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                    className="grid gap-4 md:grid-cols-2 md:gap-5"
                >
                    {CARDS.map((c) => {
                        const cls = cardClasses(c.variant);
                        const Illustration = c.Illustration;

                        return (
                            <motion.div
                                key={c.title}
                                variants={blurFadeUp}
                                className={`group relative flex min-h-[440px] flex-col overflow-hidden rounded-3xl p-6 sm:p-7 transition-transform duration-500 ease-out hover:-translate-y-1 md:min-h-[420px] md:p-9 ${cls.wrapper}`}
                            >
                                <div className="relative z-10 max-w-[380px]">
                                    <h3
                                        className={`font-heading text-2xl font-semibold leading-tight md:text-[28px] ${cls.title}`}
                                    >
                                        {c.title}
                                    </h3>
                                    <p
                                        className={`mt-4 text-[15px] leading-relaxed md:text-[15.5px] ${cls.text}`}
                                    >
                                        {c.description}
                                    </p>

                                    <div className="mt-6">
                                        <Link
                                            to={c.href}
                                            className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-[13px] font-medium transition-colors ${cls.button}`}
                                        >
                                            {c.ctaLabel}
                                        </Link>
                                    </div>
                                </div>

                                <div className="pointer-events-none absolute inset-0 z-0">
                                    <Illustration />
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}

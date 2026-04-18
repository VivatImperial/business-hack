import { Link } from "@tanstack/react-router";
import {
    motion,
    scaleFadeIn,
    staggerContainerDelayed,
    springPop,
    blurFadeUpLarge,
    blurFadeUp,
} from "@/shared/animations/motion";

/* ── Animated gear used in the hero illustration ── */

interface GearProps {
    cx: number;
    cy: number;
    rBody: number;
    teeth: number;
    fill: string;
    innerFill: string;
    spinSeconds: number;
    direction: "cw" | "ccw";
    toothW?: number;
    toothH?: number;
}

function Gear({
    cx,
    cy,
    rBody,
    teeth,
    fill,
    innerFill,
    spinSeconds,
    direction,
    toothW = 12,
    toothH = 14,
}: GearProps) {
    const teethArray = Array.from({ length: teeth }, (_, i) => i);
    const step = 360 / teeth;
    const toothOverlap = 4;

    return (
        <g>
            {teethArray.map((i) => (
                <rect
                    key={i}
                    x={cx - toothW / 2}
                    y={cy - rBody - toothH}
                    width={toothW}
                    height={toothH + toothOverlap}
                    rx="2"
                    fill={fill}
                    transform={`rotate(${i * step} ${cx} ${cy})`}
                />
            ))}
            <circle cx={cx} cy={cy} r={rBody} fill={fill} />
            <circle cx={cx} cy={cy} r={rBody * 0.38} fill={innerFill} />
            <circle cx={cx} cy={cy} r={3.5} fill={fill} />
            <animateTransform
                attributeName="transform"
                type="rotate"
                from={direction === "cw" ? `0 ${cx} ${cy}` : `360 ${cx} ${cy}`}
                to={direction === "cw" ? `360 ${cx} ${cy}` : `0 ${cx} ${cy}`}
                dur={`${spinSeconds}s`}
                repeatCount="indefinite"
            />
        </g>
    );
}

function HeroIllustration() {
    return (
        <svg
            viewBox="0 0 560 500"
            xmlns="http://www.w3.org/2000/svg"
            className="h-auto w-full max-w-[560px] select-none -mt-8 md:-mt-12 lg:-mt-16"
            aria-hidden
        >
            {/* Background ghost outlines */}
            <g
                stroke="var(--brand-border)"
                strokeWidth="1"
                fill="none"
                opacity="0.7"
            >
                <rect x="30" y="36" width="120" height="68" rx="14" />
                <rect x="420" y="400" width="110" height="72" rx="14" />
            </g>

            {/* QUERY tag — top-left */}
            <g transform="translate(40,60)">
                <rect
                    width="148"
                    height="44"
                    rx="12"
                    fill="white"
                    stroke="var(--brand-dark)"
                    strokeWidth="1.4"
                />
                <circle cx="22" cy="22" r="5" fill="var(--brand-accent)" />
                <text
                    x="38"
                    y="27"
                    fontFamily="Inter, sans-serif"
                    fontSize="12"
                    fontWeight="700"
                    fill="var(--brand-dark)"
                    letterSpacing="1.5"
                >
                    QUERY
                </text>
            </g>

            {/* RAG · 104K tag — top-right */}
            <g transform="translate(370,60)">
                <rect
                    width="160"
                    height="44"
                    rx="12"
                    fill="white"
                    stroke="var(--brand-dark)"
                    strokeWidth="1.4"
                />
                <circle cx="22" cy="22" r="5" fill="var(--brand-sage)" />
                <text
                    x="40"
                    y="27"
                    fontFamily="Inter, sans-serif"
                    fontSize="12"
                    fontWeight="700"
                    fill="var(--brand-dark)"
                    letterSpacing="1.5"
                >
                    RAG · 104K
                </text>
            </g>

            {/* Two rotating gears — the star of the show */}
            <Gear
                cx={230}
                cy={260}
                rBody={80}
                teeth={12}
                fill="var(--brand-dark)"
                innerFill="var(--brand-cream)"
                spinSeconds={16}
                direction="cw"
                toothW={14}
                toothH={16}
            />
            <Gear
                cx={376}
                cy={308}
                rBody={52}
                teeth={10}
                fill="var(--brand-accent)"
                innerFill="var(--brand-cream)"
                spinSeconds={10}
                direction="ccw"
                toothW={12}
                toothH={14}
            />

            {/* Floating "?" accent near big gear */}
            <g>
                <circle cx="318" cy="192" r="26" fill="var(--brand-sage)" />
                <text
                    x="318"
                    y="200"
                    textAnchor="middle"
                    fontFamily="Onest, Inter, sans-serif"
                    fontSize="26"
                    fontWeight="700"
                    fill="var(--brand-dark)"
                >
                    ?
                </text>
            </g>

            {/* Sage KB card — bottom-left */}
            <g transform="translate(40,400)">
                <rect
                    width="170"
                    height="80"
                    rx="16"
                    fill="var(--brand-sage)"
                />
                <rect
                    x="16"
                    y="18"
                    width="56"
                    height="6"
                    rx="3"
                    fill="var(--brand-dark)"
                />
                <rect
                    x="16"
                    y="32"
                    width="108"
                    height="4"
                    rx="2"
                    fill="var(--brand-dark)"
                    opacity="0.35"
                />
                <rect
                    x="16"
                    y="52"
                    width="38"
                    height="16"
                    rx="7"
                    fill="var(--brand-dark)"
                />
                <text
                    x="35"
                    y="63"
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                    fontSize="10"
                    fontWeight="700"
                    fill="white"
                    letterSpacing="1"
                >
                    KB
                </text>
                <circle cx="148" cy="60" r="5" fill="var(--brand-accent)" />
            </g>

            {/* Plum ADMIN tag — bottom-right */}
            <g transform="translate(330,440)">
                <rect
                    width="140"
                    height="44"
                    rx="12"
                    fill="var(--brand-dark)"
                />
                <circle cx="22" cy="22" r="5" fill="var(--brand-accent)" />
                <text
                    x="38"
                    y="27"
                    fontFamily="Inter, sans-serif"
                    fontSize="12"
                    fontWeight="700"
                    fill="white"
                    letterSpacing="1.5"
                >
                    ADMIN
                </text>
                <circle cx="118" cy="22" r="4" fill="var(--brand-sage)" />
            </g>

            {/* Dashed connectors */}
            <g
                stroke="var(--brand-accent)"
                strokeWidth="1.5"
                strokeDasharray="3 4"
                fill="none"
                opacity="0.7"
            >
                <path d="M114 104 C 150 130 180 170 200 200" />
                <path d="M450 104 C 460 150 430 200 400 240" />
                <path d="M160 400 C 180 370 200 350 210 330" />
                <path d="M400 440 C 395 400 390 370 380 360" />
            </g>
        </svg>
    );
}

/* ── Example queries block ── */

interface QueryChip {
    category: string;
    question: string;
    accent: "white" | "dark" | "terracotta" | "sage";
}

const QUERIES: QueryChip[] = [
    {
        category: "Аутентификация",
        question: "Как сбросить пароль от корпоративной почты?",
        accent: "white",
    },
    {
        category: "Доступы",
        question: "Настроить VPN на рабочем ноутбуке",
        accent: "dark",
    },
    {
        category: "Инфраструктура",
        question: "Не приходит код двухфакторной авторизации",
        accent: "terracotta",
    },
    {
        category: "Сервисы",
        question: "Нужен доступ в Jira и Confluence",
        accent: "sage",
    },
];

const ACCENT: Record<
    QueryChip["accent"],
    { card: string; pill: string; dot: string }
> = {
    white: {
        card: "bg-white border-[var(--brand-border)] text-[var(--brand-dark)]",
        pill: "bg-[var(--brand-cream)] text-[var(--brand-dark)]",
        dot: "bg-[var(--brand-accent)]",
    },
    dark: {
        card: "bg-[var(--brand-dark)] border-[var(--brand-dark)] text-white",
        pill: "bg-white/10 text-white",
        dot: "bg-[var(--brand-sage)]",
    },
    terracotta: {
        card: "bg-[var(--brand-accent)] border-[var(--brand-accent)] text-[var(--brand-dark)]",
        pill: "bg-white/50 text-[var(--brand-dark)]",
        dot: "bg-[var(--brand-dark)]",
    },
    sage: {
        card: "bg-[var(--brand-sage)] border-[var(--brand-sage)] text-[var(--brand-dark)]",
        pill: "bg-white/50 text-[var(--brand-dark)]",
        dot: "bg-[var(--brand-dark)]",
    },
};

function QueryCard({ chip }: { chip: QueryChip }) {
    const a = ACCENT[chip.accent];
    return (
        <Link
            to="/login"
            className={`group flex min-h-[136px] flex-col justify-between rounded-2xl border p-5 transition-transform hover:-translate-y-0.5 ${a.card}`}
        >
            <div
                className={`inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium ${a.pill}`}
            >
                <span className={`size-1.5 rounded-full ${a.dot}`} />
                {chip.category}
            </div>
            <p className="font-heading mt-4 text-[15px] font-semibold leading-snug md:text-[16px]">
                {chip.question}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium opacity-70">
                Спросить
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                >
                    <path
                        d="M3 8h10m0 0L9 4m4 4L9 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </Link>
    );
}

export function HeroSection() {
    return (
        <section
            id="hero"
            className="relative pt-24 overflow-hidden pb-16 md:pt-40 md:pb-24"
        >
            {/* Gradient background */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 "
                style={{
                    background:
                        "radial-gradient(1200px 600px at 80% 0%, rgba(103,129,173,0.15), transparent 55%), radial-gradient(900px 520px at 10% 10%, rgba(21,43,82,0.08), transparent 60%), linear-gradient(180deg, #f4f5f7 0%, #f1f3f6 45%, #ffffff 100%)",
                }}
            />

            <div className="relative mx-auto w-full max-w-[1200px] px-5 sm:px-6">
                <div className="grid items-center gap-10 md:grid-cols-[1fr_1.1fr] md:gap-14 lg:grid-cols-[1fr_1.15fr]">
                    {/* LEFT — text */}
                    <motion.div
                        variants={staggerContainerDelayed(0.1, 0.02)}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col items-start"
                    >
                        <motion.h1
                            variants={scaleFadeIn}
                            className="font-heading text-[40px] font-semibold leading-[1.02] tracking-tight text-[var(--brand-dark)] sm:text-[52px] md:text-[64px] lg:text-[72px]"
                        >
                            В ответе за
                            <br />
                            поддержку.
                        </motion.h1>

                        <motion.p
                            variants={scaleFadeIn}
                            className="mt-6 max-w-[480px] text-[16px] leading-relaxed text-slate-600 md:text-[17px]"
                        >
                            Демо-сервис для хакатона: посмотрите, как ассистент
                            отвечает сотрудникам, настройте промпт и
                            заглядывайте в метрики.
                        </motion.p>

                        <motion.div
                            variants={springPop}
                            className="mt-9 flex flex-wrap gap-3"
                        >
                            <Link
                                to="/login"
                                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--brand-dark)] px-7 text-[14px] font-medium text-white transition-colors hover:bg-[var(--brand-dark-2)]"
                            >
                                Открыть демо
                            </Link>
                            <a
                                href="#features"
                                className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--brand-border)] bg-white px-7 text-[14px] font-medium text-[var(--brand-dark)] transition-colors hover:bg-[var(--brand-cream)]"
                            >
                                Что внутри
                            </a>
                        </motion.div>
                    </motion.div>

                    {/* RIGHT — illustration */}
                    <motion.div
                        variants={blurFadeUpLarge}
                        initial="hidden"
                        animate="show"
                        transition={{ delay: 0.15 }}
                        className="relative flex w-full justify-center md:justify-end"
                    >
                        <HeroIllustration />
                    </motion.div>
                </div>

                {/* QUERY EXAMPLES */}
                <motion.div
                    variants={staggerContainerDelayed(0.08, 0.25)}
                    initial="hidden"
                    animate="show"
                    className="mt-14 md:mt-20"
                >
                    <motion.div
                        variants={blurFadeUp}
                        className="mb-5 flex flex-col items-start md:flex-row md:items-end justify-between gap-2 md:gap-4"
                    >
                        <h2 className="font-heading text-[15px] font-semibold tracking-tight text-[var(--brand-dark)]">
                            Популярные запросы
                        </h2>
                        <span className="text-[12px] text-slate-500">
                            То, что ассистент закрывает за секунды
                        </span>
                    </motion.div>
                    <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                        {QUERIES.map((chip) => (
                            <motion.div
                                key={chip.question}
                                variants={blurFadeUp}
                            >
                                <QueryCard chip={chip} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

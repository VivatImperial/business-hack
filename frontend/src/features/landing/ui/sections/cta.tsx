import { Link } from "@tanstack/react-router";
import {
    motion,
    blurFadeUp,
    staggerContainerDelayed,
    springPop,
} from "@/shared/animations/motion";

function LeftShape() {
    return (
        <svg
            viewBox="0 0 240 360"
            preserveAspectRatio="xMinYMax meet"
            className="hidden md:block pointer-events-none absolute bottom-0 left-0 h-full w-auto max-w-[28%] select-none"
            aria-hidden
        >
            {/* cream card */}
            <g transform="translate(40,80)">
                <rect
                    width="160"
                    height="100"
                    rx="18"
                    fill="var(--brand-cream)"
                />
                <circle cx="28" cy="30" r="7" fill="var(--brand-dark)" />
                <circle cx="28" cy="30" r="3" fill="var(--brand-accent)" />
                <rect
                    x="46"
                    y="26"
                    width="84"
                    height="8"
                    rx="4"
                    fill="var(--brand-dark)"
                    opacity="0.85"
                />
                <rect
                    x="46"
                    y="40"
                    width="60"
                    height="5"
                    rx="2.5"
                    fill="var(--brand-dark)"
                    opacity="0.35"
                />
                <rect
                    x="28"
                    y="66"
                    width="104"
                    height="18"
                    rx="7"
                    fill="white"
                />
                <circle cx="120" cy="75" r="4" fill="var(--brand-sage)" />
            </g>

            {/* white outlined tag above */}
            <g transform="translate(40,24)">
                <rect
                    width="140"
                    height="40"
                    rx="12"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                    opacity="0.55"
                />
                <circle cx="20" cy="20" r="5" fill="white" opacity="0.85" />
                <text
                    x="38"
                    y="25"
                    fontFamily="Inter, sans-serif"
                    fontSize="11"
                    fontWeight="700"
                    fill="white"
                    opacity="0.85"
                    letterSpacing="1.6"
                >
                    QUERY
                </text>
            </g>

            {/* dashed connector */}
            <g
                stroke="white"
                strokeOpacity="0.5"
                strokeWidth="1.4"
                strokeDasharray="3 4"
                fill="none"
            >
                <path d="M110 64 L 110 80" />
            </g>
        </svg>
    );
}

function RightShape() {
    return (
        <svg
            viewBox="0 0 240 360"
            preserveAspectRatio="xMaxYMax meet"
            className="hidden md:block pointer-events-none absolute bottom-0 right-0 h-full w-auto max-w-[28%] select-none"
            aria-hidden
        >
            {/* terracotta card */}
            <g transform="translate(40,80)">
                <rect
                    width="160"
                    height="100"
                    rx="18"
                    fill="var(--brand-accent)"
                />
                <rect
                    x="20"
                    y="24"
                    width="86"
                    height="8"
                    rx="4"
                    fill="var(--brand-dark)"
                />
                <rect
                    x="20"
                    y="40"
                    width="56"
                    height="5"
                    rx="2.5"
                    fill="var(--brand-dark)"
                    opacity="0.45"
                />
                <circle cx="34" cy="74" r="7" fill="var(--brand-dark)" />
                <circle cx="34" cy="74" r="3" fill="var(--brand-sage)" />
                <rect
                    x="52"
                    y="68"
                    width="88"
                    height="14"
                    rx="7"
                    fill="var(--brand-cream)"
                />
                <circle cx="128" cy="75" r="4" fill="var(--brand-sage)" />
            </g>

            {/* white outlined ANSWER tag above */}
            <g transform="translate(40,24)">
                <rect width="140" height="40" rx="12" fill="white" />
                <circle cx="20" cy="20" r="5" fill="var(--brand-sage)" />
                <text
                    x="38"
                    y="25"
                    fontFamily="Inter, sans-serif"
                    fontSize="11"
                    fontWeight="700"
                    fill="var(--brand-dark)"
                    letterSpacing="1.6"
                >
                    ANSWER
                </text>
            </g>

            {/* dashed connector */}
            <g
                stroke="white"
                strokeOpacity="0.5"
                strokeWidth="1.4"
                strokeDasharray="3 4"
                fill="none"
            >
                <path d="M110 64 L 110 80" />
            </g>
        </svg>
    );
}

export function CtaSection() {
    return (
        <section id="cta" className="bg-white py-16 md:py-24">
            <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6">
                <motion.div
                    variants={staggerContainerDelayed(0.1, 0.05)}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    className="relative overflow-hidden rounded-[28px] bg-[var(--brand-dark)] py-16 text-white md:py-24"
                >
                    <LeftShape />
                    <RightShape />

                    <div className="relative z-10 mx-auto flex max-w-[540px] flex-col items-center px-6 text-center">
                        <motion.h2
                            variants={blurFadeUp}
                            className="font-heading text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:text-4xl md:text-[48px]"
                        >
                            От первого вопроса
                            <br />
                            до ответа
                        </motion.h2>
                        <motion.p
                            variants={blurFadeUp}
                            className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-white/80 md:text-[16px]"
                        >
                            Откройте демо или свяжитесь с командой — покажем
                            сценарии и ответим на вопросы.
                        </motion.p>

                        <motion.div
                            variants={springPop}
                            className="mt-10 flex w-full max-w-[360px] flex-col gap-3"
                        >
                            <Link
                                to="/login"
                                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--brand-accent)] px-7 text-[14px] font-medium text-[var(--brand-dark)] transition-colors hover:bg-[var(--brand-accent-deep)] hover:text-white"
                            >
                                Попробовать бесплатно
                            </Link>
                            <a
                                href="mailto:it@baltbereg.ru"
                                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-[14px] font-medium text-[var(--brand-dark)] transition-colors hover:bg-[var(--brand-cream)]"
                            >
                                Связаться с командой
                            </a>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

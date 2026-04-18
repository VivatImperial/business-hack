import { Link } from "@tanstack/react-router";
import { motion, fadeIn, staggerContainer } from "@/shared/animations/motion";

interface HeaderLink {
    label: string;
    href: string;
}

interface FloatingHeaderProps {
    links?: HeaderLink[];
}

export function FloatingHeader({ links = [] }: FloatingHeaderProps) {
    return (
        <header className="fixed top-3 z-50 w-full px-3 pt-2 md:top-5 md:pt-3">
            <nav className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between rounded-full border border-[var(--brand-border)]/80 bg-white/85 pl-5 pr-3 shadow-[0_4px_24px_-8px_rgba(42,31,54,0.08)] backdrop-blur-md sm:h-16 sm:pl-7 sm:pr-4">
                <motion.a
                    href="#hero"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="font-heading text-[15px] font-semibold tracking-tight text-[var(--brand-dark)]"
                >
                    Балтийский Берег
                </motion.a>

                <motion.div
                    className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex"
                    variants={staggerContainer(0.05)}
                    initial="hidden"
                    animate="show"
                >
                    {links.map((link) => (
                        <motion.a
                            key={link.href}
                            variants={fadeIn}
                            href={link.href}
                            className="text-[14px] font-medium text-[var(--brand-text)] transition-colors hover:text-[var(--brand-dark)]"
                        >
                            {link.label}
                        </motion.a>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="flex items-center gap-2"
                >
                    <Link
                        to="/login"
                        className="hidden rounded-full px-3 py-1.5 text-[13px] font-medium text-[var(--brand-text)] transition-colors hover:text-[var(--brand-dark)] sm:inline-flex"
                    >
                        Вход
                    </Link>
                    <a
                        href="#cta"
                        className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--brand-dark)] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[var(--brand-dark-2)] sm:h-10 sm:px-5"
                    >
                        Открыть демо
                    </a>
                </motion.div>
            </nav>
        </header>
    );
}

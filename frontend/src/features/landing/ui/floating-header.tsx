import { Button, buttonVariants } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { motion, staggerContainer, fadeIn } from "@/shared/animations/motion";

interface HeaderLink {
    label: string;
    href: string;
}

interface FloatingHeaderProps {
    links?: HeaderLink[];
}

export function FloatingHeader({ links = [] }: FloatingHeaderProps) {
    return (
        <header
            className={cn(
                "sticky top-4 z-50 mx-auto mt-4 w-[calc(100%-1.5rem)] max-w-[1200px] rounded-2xl border border-blue-100 bg-white/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70",
            )}
        >
            <nav className="mx-auto flex items-center justify-between pl-1 pr-3 py-2">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Link
                        to="/"
                        className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-slate-100"
                    >
                        <img
                            src="/images/common/logo.webp"
                            alt="Логотип Пульсар"
                            className="size-7 rounded-full object-cover"
                        />
                        <p className="font-brand text-sm font-semibold tracking-wide sm:text-base">
                            Пульсар
                        </p>
                    </Link>
                </motion.div>

                {/* Center nav links — desktop */}
                <motion.div
                    className="hidden items-center gap-1 lg:flex"
                    variants={staggerContainer(0.05)}
                    initial="hidden"
                    animate="show"
                >
                    {links.map((link) => (
                        <motion.a
                            key={link.href}
                            className={buttonVariants({
                                variant: "ghost",
                                size: "lg",
                            })}
                            href={link.href}
                            variants={fadeIn}
                        >
                            {link.label}
                        </motion.a>
                    ))}
                </motion.div>

                {/* Right side — auth buttons (desktop) */}
                <motion.div
                    className="hidden items-center gap-2 lg:flex"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <Link
                        to="/login"
                        className={buttonVariants({
                            variant: "ghost",
                            size: "lg",
                        })}
                    >
                        Войти
                    </Link>
                    <Link to="/login">
                        <Button size="lg" className="rounded-xl px-4">
                            Попробовать
                        </Button>
                    </Link>
                </motion.div>

                {/* Mobile menu - removed, just show CTA */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Link to="/login">
                        <Button size="sm" className="rounded-xl px-4">
                            Попробовать
                        </Button>
                    </Link>
                </div>
            </nav>
        </header>
    );
}

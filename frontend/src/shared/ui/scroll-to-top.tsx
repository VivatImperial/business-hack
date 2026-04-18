import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@heroicons/react/24/solid";
import { AnimatePresence, motion } from "@/shared/animations/motion";
import { cn } from "@/lib/utils";

interface ScrollToTopProps {
    /** Scrolling container. Defaults to `window`. */
    getScroller?: () => HTMLElement | Window | null;
    /** Scroll position (px) after which the button appears. */
    threshold?: number;
    className?: string;
}

/**
 * Floating "scroll up" button that fades in past a threshold.
 * Use on long pages (appeals list, settings, chat transcript).
 */
export function ScrollToTop({
    getScroller,
    threshold = 280,
    className,
}: ScrollToTopProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const target =
            getScroller?.() ??
            (typeof window !== "undefined" ? window : null);
        if (!target) return;

        const read = () => {
            const y =
                target instanceof Window
                    ? window.scrollY
                    : (target as HTMLElement).scrollTop;
            setVisible(y > threshold);
        };

        read();
        target.addEventListener("scroll", read, { passive: true });
        return () => target.removeEventListener("scroll", read);
    }, [getScroller, threshold]);

    const handleClick = () => {
        const target =
            getScroller?.() ??
            (typeof window !== "undefined" ? window : null);
        if (!target) return;
        if (target instanceof Window) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            (target as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    type="button"
                    onClick={handleClick}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.2 }}
                    aria-label="Наверх"
                    className={cn(
                        "fixed bottom-[140px] md:bottom-6 right-6 z-40 flex size-11 items-center justify-center rounded-full border border-[var(--brand-border)] bg-white text-[var(--brand-dark)] transition-colors hover:bg-[var(--brand-cream)] shadow-md",
                        className,
                    )}
                >
                    <ArrowUpIcon className="size-4" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}

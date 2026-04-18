import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "@/shared/animations/motion";
import { cn } from "@/lib/utils";

interface FaqItemProps {
    question: string;
    answer: string;
    defaultOpen?: boolean;
}

export function FaqItem({ question, answer, defaultOpen = false }: FaqItemProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-[var(--brand-border)]/50 last:border-b-0">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-start justify-between gap-4 py-5 text-left md:py-6"
                aria-expanded={open}
            >
                <span className="font-heading text-base font-semibold leading-snug text-[var(--brand-dark)] md:text-lg">
                    {question}
                </span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                        "mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full border",
                        open
                            ? "border-[var(--brand-dark)] bg-[var(--brand-dark)] text-white"
                            : "border-[var(--brand-border)] text-[var(--brand-text)]",
                    )}
                >
                    <ChevronDownIcon className="size-4" />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            duration: 0.35,
                            ease: [0.25, 0.1, 0.25, 1],
                        }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 pr-10 text-[15px] leading-relaxed text-[var(--brand-text)]">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

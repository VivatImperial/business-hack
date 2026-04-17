import {
    motion,
    AnimatePresence,
    LayoutGroup,
    useScroll,
    useSpring,
    useTransform,
    useInView,
} from "framer-motion";

export {
    motion,
    AnimatePresence,
    LayoutGroup,
    useScroll,
    useSpring,
    useTransform,
    useInView,
};

/* ── Reusable variant presets ── */

import type { Variants } from "framer-motion";

export const staggerContainer = (staggerDelay = 0.1): Variants => ({
    hidden: {},
    show: { transition: { staggerChildren: staggerDelay } },
});

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
        },
    },
};

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.3 } },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.3, ease: "easeOut" as const },
    },
};

export const staggerContainerFast = (staggerDelay = 0.05): Variants => ({
    hidden: {},
    show: { transition: { staggerChildren: staggerDelay } },
});

export const blurFadeUp: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)", scale: 0.95 },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        scale: 1,
        transition: {
            type: "spring",
            bounce: 0.3,
            duration: 0.8,
        },
    },
};

export const springExpand: Variants = {
    hidden: { opacity: 0, scale: 0.85, y: 12 },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 28,
        },
    },
};

export const springPop: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 450,
            damping: 25,
        },
    },
};

import {
    motion,
    AnimatePresence,
    LayoutGroup,
    useScroll,
    useSpring,
    useTransform,
    useInView,
    useMotionValue,
    useReducedMotion,
    animate,
} from "framer-motion";

export {
    motion,
    AnimatePresence,
    LayoutGroup,
    useScroll,
    useSpring,
    useTransform,
    useInView,
    useMotionValue,
    useReducedMotion,
    animate,
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

export const slideInFromRight: Variants = {
    hidden: { opacity: 0, x: 32 },
    show: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.7,
            ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
        },
    },
};

export const slideInFromLeft: Variants = {
    hidden: { opacity: 0, x: -32 },
    show: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.7,
            ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
        },
    },
};

export const softFadeUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
        },
    },
};

/**
 * Fast, no-blur list-item reveal. Use in admin tables/cards.
 */
export const listFadeUp: Variants = {
    hidden: { opacity: 0, y: 6 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.22,
            ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
        },
    },
};

/**
 * Tiny "pop in" for single elements (badges, status pills) — 180ms.
 */
export const popIn: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    show: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.18, ease: "easeOut" as const },
    },
};

export const drawLine: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    show: {
        pathLength: 1,
        opacity: 1,
        transition: {
            duration: 1.2,
            ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
        },
    },
};

/**
 * Bouncy scale + fade used for big headlines and centered titles.
 */
export const scaleFadeIn: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 12 },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 200,
            damping: 18,
            mass: 0.9,
        },
    },
};

/**
 * Strong blur-in-up with bigger translate — for hero imagery.
 */
export const blurFadeUpLarge: Variants = {
    hidden: { opacity: 0, y: 32, filter: "blur(10px)", scale: 0.97 },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 140,
            damping: 22,
            mass: 0.9,
        },
    },
};

/**
 * Stagger with a leading delay — let a headline land, then children flow in.
 */
export const staggerContainerDelayed = (
    staggerDelay = 0.1,
    delay = 0.15,
): Variants => ({
    hidden: {},
    show: {
        transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
        },
    },
});

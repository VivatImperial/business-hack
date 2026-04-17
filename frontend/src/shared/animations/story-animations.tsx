import React, { type ReactNode } from "react";
import { motion, AnimatePresence } from "@/shared/animations/motion";

interface StoryCardHoverImageProps {
    src: string;
    alt: string;
    className?: string;
}

export function StoryCardHoverImage({
    src,
    alt,
    className,
}: StoryCardHoverImageProps) {
    return (
        <img
            src={src}
            alt={alt}
            className={`${className || ""} transition-transform duration-300 group-hover:scale-[1.15]`}
        />
    );
}

interface StorySlideTransitionProps {
    storyId: string;
    direction: number;
    children: ReactNode;
}

export function StorySlideTransition({
    storyId,
    direction,
    children,
}: StorySlideTransitionProps) {
    return (
        <AnimatePresence mode="wait" custom={direction}>
            <motion.div
                key={storyId}
                custom={direction}
                initial={{ x: direction * 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction * -300, opacity: 0 }}
                transition={{
                    type: "tween",
                    duration: 0.25,
                    ease: "easeInOut",
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

interface StoryOverlayFadeProps {
    children: ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export function StoryOverlayFade({
    children,
    className,
    onClick,
}: StoryOverlayFadeProps) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}

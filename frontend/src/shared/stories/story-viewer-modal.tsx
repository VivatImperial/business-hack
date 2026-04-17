import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Link } from "@tanstack/react-router";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";
import { STORIES } from "@/shared/stories/stories-data";
import { StoryOverlayFade } from "@/shared/animations/story-animations";

const STORY_DURATION = 12000;

export const StoryViewerModal = NiceModal.create(
    ({
        initialIndex,
        onViewed,
    }: {
        initialIndex: number;
        onViewed?: (storyId: string) => void;
    }) => {
        const modal = useModal();
        const [currentIndex, setCurrentIndex] = useState(initialIndex);
        const [progress, setProgress] = useState(0);
        const rafRef = useRef<number>(0);
        const startRef = useRef(0);

        useEffect(() => {
            setCurrentIndex(initialIndex);
            setProgress(0);
        }, [initialIndex]);

        const story = STORIES[currentIndex];

        // Mark story as viewed when displayed
        useEffect(() => {
            if (story && onViewed) {
                onViewed(story.id);
            }
        }, [currentIndex, story, onViewed]);

        const goNext = useCallback(() => {
            if (currentIndex < STORIES.length - 1) {
                setCurrentIndex((i) => i + 1);
                setProgress(0);
            } else {
                modal.hide();
            }
        }, [currentIndex, modal]);

        const goPrev = useCallback(() => {
            if (currentIndex > 0) {
                setCurrentIndex((i) => i - 1);
                setProgress(0);
            }
        }, [currentIndex]);

        // Auto-advance timer
        useEffect(() => {
            startRef.current = performance.now();

            const tick = (now: number) => {
                const elapsed = now - startRef.current;
                const p = Math.min(elapsed / STORY_DURATION, 1);
                setProgress(p);
                if (p >= 1) {
                    goNext();
                    return;
                }
                rafRef.current = requestAnimationFrame(tick);
            };

            rafRef.current = requestAnimationFrame(tick);
            return () => cancelAnimationFrame(rafRef.current);
        }, [currentIndex, goNext]);

        useEffect(() => {
            if (typeof window === 'undefined') return;
            const handler = (e: KeyboardEvent) => {
                if (e.key === "ArrowRight") goNext();
                else if (e.key === "ArrowLeft") goPrev();
                else if (e.key === "Escape") modal.hide();
            };
            window.addEventListener("keydown", handler);
            return () => window.removeEventListener("keydown", handler);
        }, [goNext, goPrev, modal]);

        if (!modal.visible) return null;
        if (typeof document === 'undefined') return null;

        return createPortal(
            <StoryOverlayFade
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 sm:p-4"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    type="button"
                    onClick={() => modal.hide()}
                    className="absolute right-4 top-4 sm:right-6 sm:top-6 z-[110] flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white hover:bg-white/10 bg-black/20 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none"
                >
                    <XMarkIcon className="size-6 sm:size-8" />
                </button>

                {/* Card + arrows wrapper */}
                <div
                    className="relative flex items-center justify-center w-full h-full sm:gap-4"
                >
                    {/* Left arrow (desktop) */}
                    <button
                        type="button"
                        onClick={goPrev}
                        className={cn(
                            "hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white",
                            currentIndex === 0 && "invisible",
                        )}
                    >
                        <ChevronLeftIcon className="size-8" />
                    </button>

                    {/* Main card */}
                    <div className="relative w-full h-full sm:w-[560px] sm:h-[920px] overflow-hidden sm:rounded-2xl bg-zinc-900">
                        {/* Tap zones */}
                        <div className="absolute inset-0 z-20 flex">
                            <div className="w-1/3 h-full cursor-pointer" onClick={goPrev} />
                            <div className="w-2/3 h-full cursor-pointer" onClick={goNext} />
                        </div>

                        {/* Progress bars */}
                        <div className="absolute left-3 right-3 top-3 sm:top-3 z-30 flex gap-1 pt-[env(safe-area-inset-top)]">
                            {STORIES.map((_, i) => (
                                <div
                                    key={i}
                                    className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
                                >
                                    <div
                                        className="h-full rounded-full bg-white"
                                        style={{
                                            width:
                                                i < currentIndex
                                                    ? "100%"
                                                    : i === currentIndex
                                                      ? `${progress * 100}%`
                                                      : "0%",
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Image — fills the card */}
                        <img
                            key={story.id}
                            src={story.image}
                            alt={story.title}
                            className="absolute inset-0 h-full w-full object-cover"
                        />

                        {/* Gradient overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-3/4 sm:h-2/3 bg-gradient-to-t from-zinc-900 via-zinc-900/90 to-transparent pointer-events-none" />

                        {/* Text content — overlays bottom */}
                        <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col gap-3 sm:gap-5 px-6 sm:px-8 pb-8 sm:pb-10">
                            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                                {story.title}
                            </h2>
                            <p className="text-lg sm:text-xl leading-relaxed text-zinc-300">
                                {story.description}
                            </p>

                            {story.bullets.length > 0 && (
                                <ul className="space-y-2.5 sm:space-y-3.5 mt-2">
                                    {story.bullets.map((bullet, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3 text-base sm:text-lg text-zinc-200"
                                        >
                                            <span className="mt-2.5 sm:mt-3 size-1.5 shrink-0 rounded-full bg-zinc-400" />
                                            {bullet}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {story.ctaText && story.ctaHref && (
                                <Link
                                    to={story.ctaHref}
                                    onClick={() => modal.hide()}
                                    className="mt-4 sm:mt-6 inline-flex items-center justify-center rounded-xl bg-zinc-800 px-6 py-3.5 sm:py-4 text-base sm:text-lg font-medium text-white transition-colors hover:bg-zinc-700 active:bg-zinc-600"
                                >
                                    {story.ctaText}
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Right arrow (desktop) */}
                    <button
                        type="button"
                        onClick={goNext}
                        className={cn(
                            "hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white",
                            currentIndex === STORIES.length - 1 && "invisible",
                        )}
                    >
                        <ChevronRightIcon className="size-8" />
                    </button>
                </div>
            </StoryOverlayFade>,
            document.body,
        );
    },
);

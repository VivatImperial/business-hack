import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "@/shared/animations/motion";
import { Button } from "@/shared/ui/button";

export function MobileVideoPlayer({
    src,
    poster,
}: {
    src: string;
    poster?: string;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [, setIsPlaying] = useState(true);
    const [hasReachedEnd, setHasReachedEnd] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {});
                    setIsPlaying(true);
                } else {
                    video.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.4 },
        );

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            if (total > 0 && current >= total - 1.5) {
                setHasReachedEnd(true);
            }
        }
    }, []);

    return (
        <div ref={containerRef} className="mx-auto w-full max-w-[540px]">
            {/* Tablet frame */}
            <div className="rounded-[20px] border-[6px] border-slate-300 bg-slate-300 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                {/* Camera notch */}
                <div className="flex justify-center py-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400/60" />
                </div>

                {/* Screen */}
                <div className="relative overflow-hidden rounded-[12px] bg-black">
                    <video
                        ref={videoRef}
                        className="block w-full"
                        onTimeUpdate={handleTimeUpdate}
                        src={src}
                        poster={poster}
                        controls
                        muted
                        loop
                        playsInline
                    />

                    {/* End-screen CTA */}
                    <AnimatePresence>
                        {hasReachedEnd && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
                                onClick={() => setHasReachedEnd(false)}
                            >
                                <h3 className="mb-4 text-center font-heading text-lg font-bold text-white">
                                    Готовы получать больше лидов?
                                </h3>
                                <a
                                    href="/dashboard"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Button
                                        size="sm"
                                        className="rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700"
                                    >
                                        Попробовать
                                    </Button>
                                </a>
                                <button
                                    className="mt-3 text-xs text-white/60 transition-colors hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setHasReachedEnd(false);
                                        if (videoRef.current) {
                                            videoRef.current.currentTime = 0;
                                            videoRef.current
                                                .play()
                                                .catch(() => {});
                                            setIsPlaying(true);
                                        }
                                    }}
                                >
                                    Смотреть заново
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Home bar */}
                <div className="flex justify-center py-2">
                    <div className="h-1 w-16 rounded-full bg-slate-400/40" />
                </div>
            </div>
        </div>
    );
}

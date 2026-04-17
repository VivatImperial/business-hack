import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/shared/ui/button";
import { motion, AnimatePresence } from "@/shared/animations/motion";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const CustomSlider = ({
    value,
    onChange,
    className,
}: {
    value: number;
    onChange: (value: number) => void;
    className?: string;
}) => {
    return (
        <motion.div
            className={cn(
                "relative w-full h-1 bg-white/20 rounded-full cursor-pointer",
                className,
            )}
            onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = (x / rect.width) * 100;
                onChange(Math.min(Math.max(percentage, 0), 100));
            }}
        >
            <motion.div
                className="absolute top-0 left-0 h-full bg-white rounded-full"
                style={{ width: `${value}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
        </motion.div>
    );
};

const VideoPlayer = ({ src, poster }: { src: string; poster?: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showControls, setShowControls] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
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
            { threshold: 0.5 },
        );

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(() => {});
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying]);

    const handleVolumeChange = useCallback((value: number) => {
        if (videoRef.current) {
            const newVolume = value / 100;
            videoRef.current.volume = newVolume;
            videoRef.current.muted = newVolume === 0;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    }, []);

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            const prog = (current / total) * 100;

            setProgress(isFinite(prog) ? prog : 0);
            setCurrentTime(current);
            setDuration(total);

            if (total > 0 && current >= total - 1.5) {
                setHasReachedEnd(true);
            }
        }
    }, []);

    const handleSeek = useCallback((value: number) => {
        if (videoRef.current && videoRef.current.duration) {
            const time = (value / 100) * videoRef.current.duration;
            if (isFinite(time)) {
                videoRef.current.currentTime = time;
                setProgress(value);
                if (time < videoRef.current.duration - 2) {
                    setHasReachedEnd(false);
                }
            }
        }
    }, []);

    const toggleMute = useCallback(() => {
        if (videoRef.current) {
            const newMuted = !isMuted;
            videoRef.current.muted = newMuted;
            setIsMuted(newMuted);
            if (newMuted) {
                setVolume(0);
            } else {
                setVolume(1);
                videoRef.current.volume = 1;
            }
        }
    }, [isMuted]);

    const setSpeed = useCallback((speed: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
            setPlaybackSpeed(speed);
        }
    }, []);

    return (
        <motion.div
            ref={containerRef}
            className="relative mx-auto w-full overflow-hidden rounded-2xl bg-black shadow-[0_20px_40px_rgba(0,0,0,0.08)] ring-1 ring-slate-200/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Browser Mockup Header */}
            <div className="flex h-11 w-full items-center gap-2 bg-[#f4f5f6] px-4">
                <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                    <div className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                    <div className="h-3 w-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                </div>
                <div className="mx-auto flex h-6 w-1/2 max-w-[200px] items-center justify-center rounded-md bg-white text-[11px] font-medium text-slate-400 shadow-sm ring-1 ring-slate-200/50">
                    pulsar-tg.ru
                </div>
                {/* Placeholder to balance flex */}
                <div className="w-[52px]" />
            </div>

            <div className="relative w-full">
                <video
                    ref={videoRef}
                    className="w-full block"
                    onTimeUpdate={handleTimeUpdate}
                    src={src}
                    poster={poster}
                    onClick={togglePlay}
                    muted
                    loop
                    playsInline
                />

                {/* End-screen CTA Overlay */}
                <AnimatePresence>
                    {hasReachedEnd && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
                            onClick={() => setHasReachedEnd(false)} // allow clicking to dismiss
                        >
                            <h3 className="mb-6 text-center font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                Готовы получать больше лидов?
                            </h3>
                            <a
                                href="/dashboard"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Button
                                    size="lg"
                                    className="h-14 rounded-full bg-blue-600 px-8 text-lg text-white hover:bg-blue-700 hover:shadow-lg"
                                >
                                    Попробовать Пульсар
                                </Button>
                            </a>
                            <button
                                className="mt-4 text-sm text-white/60 hover:text-white transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setHasReachedEnd(false);
                                    handleSeek(0);
                                    if (videoRef.current) {
                                        videoRef.current.play().catch(() => {});
                                        setIsPlaying(true);
                                    }
                                }}
                            >
                                Смотреть заново
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showControls && (
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 m-2 mx-auto max-w-xl rounded-2xl bg-black/65 p-4 backdrop-blur-md"
                            initial={{
                                y: 20,
                                opacity: 0,
                                filter: "blur(10px)",
                            }}
                            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                            exit={{ y: 20, opacity: 0, filter: "blur(10px)" }}
                            transition={{
                                duration: 0.6,
                                ease: "circInOut",
                                type: "spring",
                            }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-white text-sm">
                                    {formatTime(currentTime)}
                                </span>
                                <CustomSlider
                                    value={progress}
                                    onChange={handleSeek}
                                    className="flex-1"
                                />
                                <span className="text-white text-sm">
                                    {formatTime(duration)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Button
                                            onClick={togglePlay}
                                            variant="ghost"
                                            size="icon"
                                            className="text-white hover:bg-[#111111d1] hover:text-white"
                                        >
                                            <span
                                                className="text-base"
                                                aria-hidden
                                            >
                                                {isPlaying ? "❚❚" : "▶"}
                                            </span>
                                        </Button>
                                    </motion.div>
                                    <div className="flex items-center gap-x-1">
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Button
                                                onClick={toggleMute}
                                                variant="ghost"
                                                size="icon"
                                                className="text-white hover:bg-[#111111d1] hover:text-white"
                                            >
                                                <span
                                                    className="text-base"
                                                    aria-hidden
                                                >
                                                    {isMuted ? "♪✕" : "♪"}
                                                </span>
                                            </Button>
                                        </motion.div>

                                        <div className="w-24">
                                            <CustomSlider
                                                value={volume * 100}
                                                onChange={handleVolumeChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {[0.5, 1, 1.5, 2].map((speed) => (
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            key={speed}
                                        >
                                            <Button
                                                onClick={() => setSpeed(speed)}
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "text-white hover:bg-[#111111d1] hover:text-white",
                                                    playbackSpeed === speed &&
                                                        "bg-[#111111d1]",
                                                )}
                                            >
                                                {speed}x
                                            </Button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default VideoPlayer;

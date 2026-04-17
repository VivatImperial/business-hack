import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";

export function DemoVideoCompact() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const modalVideoRef = useRef<HTMLVideoElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Autoplay when in viewport
    useEffect(() => {
        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            },
            { threshold: 0.4 },
        );
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Pause inline video when modal opens, resume when closes
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (isModalOpen) {
            video.pause();
        } else {
            video.play().catch(() => {});
        }
    }, [isModalOpen]);

    // Close modal on Escape
    useEffect(() => {
        if (!isModalOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsModalOpen(false);
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isModalOpen]);

    const openModal = useCallback(() => {
        const inlineVideo = videoRef.current;
        setIsModalOpen(true);
        // Start modal video from same position
        requestAnimationFrame(() => {
            const modalVideo = modalVideoRef.current;
            if (modalVideo && inlineVideo) {
                modalVideo.currentTime = inlineVideo.currentTime;
                modalVideo.play().catch(() => {});
            }
        });
    }, []);

    const closeModal = useCallback(() => {
        const modalVideo = modalVideoRef.current;
        if (modalVideo) modalVideo.pause();
        setIsModalOpen(false);
    }, []);

    return (
        <>
            <section
                id="demo-video"
                data-track-section="demo-video"
                className="py-12 md:py-24"
            >
                <div className="site-container">
                    <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                            Посмотрите в действии
                        </h2>
                        <p className="mt-3 text-[17px] text-black sm:text-[18px]">
                            Как выглядит поток лидов и работа менеджера в
                            реальном времени
                        </p>
                    </div>

                    {/* Compact video preview */}
                    <div
                        ref={containerRef}
                        className="group relative mx-auto max-w-4xl cursor-pointer overflow-hidden rounded-[28px]"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onClick={openModal}
                    >
                        <video
                            ref={videoRef}
                            src="/demo.mp4"
                            poster="/images/landing/preview.png"
                            muted
                            loop
                            playsInline
                            className="w-full rounded-[28px]"
                        />

                        {/* Hover overlay with expand button */}
                        <div
                            className={`absolute inset-0 flex items-center justify-center rounded-[28px] bg-black/30 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
                        >
                            <button
                                type="button"
                                className="flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-[18px] font-bold text-black shadow-lg transition-transform hover:scale-105"
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="black"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Смотреть полностью
                            </button>
                        </div>
                    </div>

                    {/* Guide link */}
                    <div className="mt-8 text-center">
                        <Link
                            to="/guide"
                            className="text-[18px] font-medium text-blue-500 no-underline transition-colors hover:text-blue-600 sm:text-[20px]"
                        >
                            Читать руководство по настройке &rarr;
                        </Link>
                    </div>
                </div>
            </section>

            {/* Fullscreen modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div
                        className="relative w-full max-w-5xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={closeModal}
                            className="absolute -top-12 right-0 text-[16px] font-medium text-white/80 transition-colors hover:text-white"
                        >
                            Закрыть &times;
                        </button>

                        <video
                            ref={modalVideoRef}
                            src="/demo.mp4"
                            controls
                            autoPlay
                            className="w-full rounded-2xl"
                        />
                    </div>
                </div>
            )}
        </>
    );
}

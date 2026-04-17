import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import NiceModal from "@ebay/nice-modal-react";
import Cookies from "js-cookie";
import { STORIES } from "@/shared/stories/stories-data";
import { StoryViewerModal } from "@/shared/stories/story-viewer-modal";

const logoSrc = "/images/common/logo.webp";
const VIEWED_COOKIE = "viewed_stories";

function getViewedStories(): Set<string> {
    if (typeof document === "undefined") return new Set();
    const raw = Cookies.get(VIEWED_COOKIE);
    if (!raw) return new Set();
    try { return new Set(JSON.parse(raw)); } catch { return new Set(); }
}

function markStoryViewed(storyId: string) {
    const viewed = getViewedStories();
    viewed.add(storyId);
    Cookies.set(VIEWED_COOKIE, JSON.stringify([...viewed]), { expires: 30 });
}

export function MobileHeader() {
    const autoOpenedRef = useRef(false);
    const [allViewed, setAllViewed] = useState(true);

    useEffect(() => {
        const viewed = getViewedStories();
        setAllViewed(STORIES.every((s) => viewed.has(s.id)));
    }, []);

    // Auto-open first unviewed story
    useEffect(() => {
        if (autoOpenedRef.current) return;
        autoOpenedRef.current = true;
        const viewed = getViewedStories();
        const idx = STORIES.findIndex((s) => !viewed.has(s.id));
        if (idx !== -1) {
            const timer = setTimeout(() => {
                NiceModal.show(StoryViewerModal, {
                    initialIndex: idx,
                    onViewed: markStoryViewed,
                });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleOpenStories = () => {
        NiceModal.show(StoryViewerModal, {
            initialIndex: 0,
            onViewed: markStoryViewed,
        });
    };

    // Pick 3 story images for stacked circles
    const storyImages = STORIES.slice(0, 3).map((s) => s.image);

    return (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/40 safe-area-top">
            <div className="flex items-center justify-between h-12 px-4">
                {/* Logo */}
                <Link to="/dashboard" className="flex items-center gap-2">
                    <img
                        src={logoSrc}
                        alt="Пульсар"
                        className="size-6 rounded-full"
                    />
                    <span className="font-pixel text-base tracking-wide">
                        Пульсар
                    </span>
                </Link>

                {/* Stories — stacked circles in center */}
                <button
                    type="button"
                    onClick={handleOpenStories}
                    className="absolute left-1/2 -translate-x-1/2 flex items-center"
                >
                    <div className="flex items-center -space-x-3">
                        {storyImages.map((img, i) => (
                            <div
                                key={i}
                                className={`relative rounded-full p-[2px] ${allViewed ? "bg-border" : "bg-linear-to-tr from-primary to-blue-400"}`}
                                style={{ zIndex: 3 - i }}
                            >
                                <div className="rounded-full bg-background p-px">
                                    <img
                                        src={img}
                                        alt=""
                                        className="size-8 rounded-full object-cover"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </button>

                {/* Right spacer for visual balance */}
                <div className="w-6" />
            </div>
        </header>
    );
}

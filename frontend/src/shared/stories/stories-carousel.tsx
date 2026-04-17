import { useEffect, useRef, useState } from "react";
import NiceModal from "@ebay/nice-modal-react";
import Cookies from "js-cookie";
import { STORIES } from "@/shared/stories/stories-data";
import { StoryCard } from "@/shared/stories/story-card";
import { StoryViewerModal } from "@/shared/stories/story-viewer-modal";

const VIEWED_STORIES_COOKIE = "viewed_stories";

function getViewedStories(): Set<string> {
    if (typeof document === "undefined") return new Set();
    const raw = Cookies.get(VIEWED_STORIES_COOKIE);
    if (!raw) return new Set();
    try {
        return new Set(JSON.parse(raw));
    } catch {
        return new Set();
    }
}

function markStoryViewed(storyId: string) {
    const viewed = getViewedStories();
    viewed.add(storyId);
    Cookies.set(VIEWED_STORIES_COOKIE, JSON.stringify([...viewed]), {
        expires: 30,
    });
}

export function StoriesCarousel({ isMobile }: { isMobile?: boolean }) {
    const autoOpenedRef = useRef(false);
    const [viewed, setViewed] = useState<Set<string>>(new Set());

    useEffect(() => {
        setViewed(getViewedStories());
    }, []);

    const handleOpenStory = (index: number) => {
        NiceModal.show(StoryViewerModal, {
            initialIndex: index,
            onViewed: markStoryViewed,
        });
    };

    // Auto-open first unviewed story on mount
    useEffect(() => {
        if (autoOpenedRef.current) return;
        autoOpenedRef.current = true;

        const currentViewed = getViewedStories();
        const firstUnviewedIndex = STORIES.findIndex(
            (s) => !currentViewed.has(s.id),
        );
        if (firstUnviewedIndex !== -1) {
            const timer = setTimeout(() => {
                handleOpenStory(firstUnviewedIndex);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <div
            className={`flex overflow-x-auto ${isMobile ? "gap-1 px-3 py-2 no-scrollbar" : "gap-3 pt-4"}`}
        >
            {STORIES.map((story, index) => (
                <StoryCard
                    key={story.id}
                    story={story}
                    viewed={viewed.has(story.id)}
                    onClick={() => handleOpenStory(index)}
                    isMobile={isMobile}
                />
            ))}
        </div>
    );
}

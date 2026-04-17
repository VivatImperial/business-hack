import type { StorySlide } from "@/shared/stories/stories-data";
import { StoryCardHoverImage } from "@/shared/animations/story-animations";

interface StoryCardProps {
    story: StorySlide;
    viewed?: boolean;
    onClick: () => void;
    isMobile?: boolean;
}

export function StoryCard({
    story,
    viewed,
    onClick,
    isMobile,
}: StoryCardProps) {
    if (isMobile) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="group flex flex-col items-center gap-1 shrink-0 cursor-pointer w-[56px]"
            >
                <div
                    className={`rounded-full p-[2px] ${viewed ? "bg-border" : "bg-gradient-to-tr from-primary to-blue-400"}`}
                >
                    <div className="rounded-full bg-background p-[1.5px]">
                        <div className="relative h-[42px] w-[42px] overflow-hidden rounded-full border border-border/50">
                            <StoryCardHoverImage
                                src={story.image}
                                alt={story.title}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
                <span className="text-[9px] leading-tight text-center text-muted-foreground line-clamp-1 w-full">
                    {story.title}
                </span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group shrink-0 cursor-pointer rounded-[20px] p-[1.5px] transition-all bg-border`}
        >
            <div className="rounded-[18px] bg-card p-[2px]">
                <div className="relative h-[120px] w-[120px] overflow-hidden rounded-[16px]">
                    <StoryCardHoverImage
                        src={story.image}
                        alt={story.title}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-blue-900/30 to-transparent" />
                    <span className="absolute left-3 right-3 top-3 text-left text-sm font-semibold leading-tight text-white drop-shadow-sm">
                        {story.title}
                    </span>
                </div>
            </div>
        </button>
    );
}

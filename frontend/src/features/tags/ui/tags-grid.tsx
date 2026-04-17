import type { TagRecord, TagColor } from "@/features/tags/types";
import { TAG_COLORS } from "@/features/tags/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

function TagBadge({ name, color }: { name: string; color: TagColor }) {
    const c = TAG_COLORS[color];
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[13px] font-semibold ${c.bg} ${c.text}`}
        >
            <span
                className="size-2 rounded-full"
                style={{ backgroundColor: c.dot }}
            />
            {name}
        </span>
    );
}

function formatCompact(num: number): string {
    if (num >= 1_000_000)
        return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return num.toString();
}

interface TagsGridProps {
    tags: TagRecord[];
    onToggleActive: (id: number) => void;
    onEdit: (tag: TagRecord) => void;
    onDelete: (id: number) => void;
    pendingActions: Set<number>;
}

export function TagsGrid({
    tags,
    onToggleActive,
    onEdit,
    pendingActions,
}: TagsGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {tags.map((tag) => {
                const isPending = pendingActions.has(tag.id);

                return (
                    <div
                        key={tag.id}
                        className={`group relative flex flex-col rounded-2xl bg-white border border-gray-200 cursor-pointer transition-colors duration-150 hover:border-gray-300 ${
                            isPending ? "opacity-40 pointer-events-none" : ""
                        } ${!tag.isActive ? "opacity-60 grayscale-[0.4]" : ""}`}
                        onClick={() => onEdit(tag)}
                    >
                        {/* Top: Badge + Toggle */}
                        <div className="flex items-start justify-between p-5 pb-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <TagBadge name={tag.name} color={tag.color} />
                            </div>

                            <div
                                className="shrink-0 ml-3"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className={`relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                                                tag.isActive
                                                    ? "bg-blue-500"
                                                    : "bg-zinc-200"
                                            }`}
                                            onClick={() =>
                                                onToggleActive(tag.id)
                                            }
                                            aria-label={
                                                tag.isActive
                                                    ? "Выключить тег"
                                                    : "Включить тег"
                                            }
                                        >
                                            <span
                                                className={`pointer-events-none block size-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                                                    tag.isActive
                                                        ? "translate-x-[20px]"
                                                        : "translate-x-[2px]"
                                                }`}
                                            />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {tag.isActive
                                            ? "Выключить тег"
                                            : "Включить тег"}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Middle: Description */}
                        <div className="flex-1 px-5 pt-3 pb-4">
                            {tag.description ? (
                                <p className="break-words whitespace-pre-wrap text-[13px] font-normal leading-relaxed text-muted-foreground/70 line-clamp-3">
                                    {tag.description}
                                </p>
                            ) : (
                                <p className="text-[13px] text-muted-foreground/40 italic leading-relaxed line-clamp-2">
                                    Описание не указано
                                </p>
                            )}

                            {tag.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2.5">
                                    {tag.keywords.slice(0, 4).map((kw, i) => (
                                        <span
                                            key={i}
                                            className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
                                        >
                                            {kw}
                                        </span>
                                    ))}
                                    {tag.keywords.length > 4 && (
                                        <span className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                                            +{tag.keywords.length - 4}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom: Metrics in gray plashka */}
                        <div className="mx-4 mb-4 mt-1 rounded-xl bg-gray-50 px-4 py-3 flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[18px] font-extrabold tabular-nums text-foreground leading-tight">
                                    {tag.stats.messagesCount > 0
                                        ? formatCompact(tag.stats.messagesCount)
                                        : "0"}
                                </span>
                                <span className="text-[12px] text-muted-foreground/50 mt-0.5">
                                    Сообщения
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[18px] font-extrabold tabular-nums text-foreground leading-tight">
                                    {tag.stats.conversionRate.toFixed(1)}%
                                </span>
                                <span className="text-[12px] text-muted-foreground/50 mt-0.5">
                                    Конверсия
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

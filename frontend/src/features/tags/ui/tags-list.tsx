import { EllipsisVerticalIcon, TagIcon } from "@heroicons/react/24/solid";
import type { TagRecord } from "@/features/tags/types";
import { TAG_COLORS } from "@/features/tags/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

function formatCompact(num: number): string {
    if (num >= 1_000_000)
        return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return num.toString();
}

interface TagsListProps {
    tags: TagRecord[];
    onToggleActive: (id: number) => void;
    onEdit: (tag: TagRecord) => void;
    onDelete: (id: number) => void;
    pendingActions: Set<number>;
}

export function TagsList({
    tags,
    onToggleActive,
    onEdit,
    onDelete,
    pendingActions,
}: TagsListProps) {
    return (
        <div className="divide-y divide-gray-100">
            {tags.map((tag) => {
                const isPending = pendingActions.has(tag.id);
                const c = TAG_COLORS[tag.color];

                return (
                    <div
                        key={tag.id}
                        className={`flex flex-col gap-3 rounded-xl p-4 transition-colors hover:bg-slate-50/60 sm:flex-row sm:items-center sm:gap-4 cursor-pointer group ${
                            isPending ? "opacity-40 pointer-events-none" : ""
                        } ${!tag.isActive ? "opacity-50" : ""}`}
                        onClick={() => onEdit(tag)}
                    >
                        {/* Tag icon + Name/Description */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <TagIcon
                                className="size-[24px] shrink-0 mt-1"
                                style={{
                                    color: c.dot,
                                }}
                            />
                            <div className="min-w-0 flex-1">
                                <span className="text-[16px] font-semibold text-foreground leading-snug">
                                    {tag.name}
                                </span>
                                {tag.description ? (
                                    <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-snug text-muted-foreground/60">
                                        {tag.description}
                                    </p>
                                ) : (
                                    <p className="text-[14px] text-muted-foreground/30 italic mt-0.5 leading-snug">
                                        Без описания
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-5 self-start sm:shrink-0 sm:min-w-[160px] sm:justify-end">
                            <div className="text-right">
                                <span className="text-[15px] font-bold tabular-nums text-foreground">
                                    {formatCompact(tag.stats.messagesCount)}
                                </span>
                                <span className="text-[12px] text-muted-foreground/50 ml-1">
                                    сообщ.
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[15px] font-bold tabular-nums text-foreground">
                                    {tag.stats.conversionRate.toFixed(1)}%
                                </span>
                                <span className="text-[12px] text-muted-foreground/50 ml-1">
                                    конв.
                                </span>
                            </div>
                        </div>

                        {/* Toggle */}
                        <div
                            className="shrink-0 self-end sm:self-auto"
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
                                        onClick={() => onToggleActive(tag.id)}
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

                        {/* Context menu */}
                        <div
                            className="shrink-0 self-end sm:self-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex size-8 items-center justify-center rounded-xl text-foreground/50 hover:text-foreground hover:bg-gray-100 transition-colors">
                                        <EllipsisVerticalIcon className="size-[18px]" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="end"
                                    className="w-40 p-1.5"
                                >
                                    <button
                                        onClick={() => onEdit(tag)}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[14px] font-medium text-foreground hover:bg-gray-100 transition-colors"
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => onDelete(tag.id)}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        Удалить
                                    </button>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

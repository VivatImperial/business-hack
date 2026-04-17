import {
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    TrashIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/solid";
import type { TagRecord, TagColor } from "@/features/tags/types";
import { TAG_COLORS } from "@/features/tags/types";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";

function TagBadge({ name, color }: { name: string; color: TagColor }) {
    const c = TAG_COLORS[color];
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[13px] font-semibold ${c.bg} ${c.text}`}
        >
            <span
                className="size-2 rounded-full"
                style={{ backgroundColor: c.dot }}
            />
            {name}
        </span>
    );
}

function ConversionBar({ rate }: { rate: number }) {
    const barColor =
        rate >= 25
            ? "bg-emerald-500"
            : rate >= 15
              ? "bg-blue-500"
              : "bg-amber-400";
    return (
        <div className="flex items-center gap-2.5">
            <div className="h-[5px] w-16 rounded-full bg-muted overflow-hidden">
                <div
                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${Math.min(rate, 100)}%` }}
                />
            </div>
            <span className="text-[13px] tabular-nums">{rate.toFixed(1)}%</span>
        </div>
    );
}

function TrendIndicator({ delta }: { delta: number }) {
    if (delta === 0) return null;
    const isUp = delta > 0;
    return (
        <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isUp ? "text-emerald-600" : "text-red-500"}`}
        >
            {isUp ? (
                <ArrowTrendingUpIcon className="size-3" />
            ) : (
                <ArrowTrendingDownIcon className="size-3" />
            )}
            {Math.abs(delta)}%
        </span>
    );
}

function formatCompact(num: number): string {
    if (num >= 1_000_000)
        return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return num.toString();
}

interface TagsTableProps {
    tags: TagRecord[];
    onToggleActive: (id: number) => void;
    onEdit: (tag: TagRecord) => void;
    onDelete: (id: number) => void;
    pendingActions: Set<number>;
}

export function TagsTable({
    tags,
    onToggleActive,
    onEdit,
    onDelete,
    pendingActions,
}: TagsTableProps) {
    return (
        <TooltipProvider>
            <div className="flex flex-col gap-1">
                {/* Header */}
                <div className="flex items-center px-4 py-2">
                    <div className="flex-1 min-w-0 flex items-center gap-1 text-[13px] font-medium text-muted-foreground/70">
                        Тег
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <InformationCircleIcon className="size-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-help transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                                Название, описание и ключевые слова
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="w-30 shrink-0 flex items-center justify-end gap-1 text-[13px] font-medium text-muted-foreground/70">
                        Сообщения
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <InformationCircleIcon className="size-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-help transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                                Количество сообщений с этим тегом
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="w-50 shrink-0 flex items-center justify-end gap-1 text-[13px] font-medium text-muted-foreground/70 pr-1">
                        Конверсия
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <InformationCircleIcon className="size-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-help transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                                Процент сообщений, ставших лидами
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="w-26 shrink-0 flex items-center justify-center gap-1 text-[13px] font-medium text-muted-foreground/70">
                        Статус
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <InformationCircleIcon className="size-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-help transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                                Включён/выключен тег
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="w-10 shrink-0" />
                </div>

                {/* Rows */}
                <div className="flex flex-col gap-1">
                    {tags.map((tag) => {
                        const isPending = pendingActions.has(tag.id);

                        return (
                            <div
                                key={tag.id}
                                className={`group flex flex-col transition-colors duration-200 rounded-2xl cursor-pointer hover:bg-black/[0.02] ${isPending ? "opacity-40 pointer-events-none" : ""} ${
                                    !tag.isActive
                                        ? "opacity-50 grayscale-[0.5]"
                                        : ""
                                }`}
                                onClick={() => onEdit(tag)}
                            >
                                <div className="flex items-center py-3.5 px-4">
                                    {/* Tag info */}
                                    <div className="flex-1 min-w-0 pr-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2.5">
                                                <TagBadge
                                                    name={tag.name}
                                                    color={tag.color}
                                                />
                                                <TrendIndicator
                                                    delta={tag.stats.trendDelta}
                                                />
                                            </div>
                                            {tag.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                                                    {tag.description}
                                                </p>
                                            )}
                                            {tag.keywords.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {tag.keywords.map(
                                                        (kw, i) => (
                                                            <span
                                                                key={i}
                                                                className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
                                                            >
                                                                {kw}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="w-30 shrink-0 text-right">
                                        <span className="text-[13px] font-semibold tabular-nums">
                                            {formatCompact(
                                                tag.stats.messagesCount,
                                            )}
                                        </span>
                                    </div>

                                    {/* Conversion */}
                                    <div className="w-50 shrink-0 flex justify-end pr-1">
                                        <ConversionBar
                                            rate={tag.stats.conversionRate}
                                        />
                                    </div>

                                    {/* Toggle */}
                                    <div
                                        className="w-26 shrink-0 flex justify-center"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    className={`relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${tag.isActive ? "bg-blue-500" : "bg-zinc-200"}`}
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
                                                        className={`pointer-events-none block size-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${tag.isActive ? "translate-x-[20px]" : "translate-x-[2px]"}`}
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

                                    {/* Delete */}
                                    <div
                                        className="w-10 shrink-0 flex justify-center"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="flex size-8 items-center justify-center rounded-xl text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
                                                    onClick={() =>
                                                        onDelete(tag.id)
                                                    }
                                                    aria-label="Удалить тег"
                                                >
                                                    <TrashIcon className="size-4" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Удалить тег
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
}

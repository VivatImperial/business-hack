import {
    HandThumbDownIcon,
    HeartIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/solid";
import { forwardRef, useState } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { LeadRecord } from "@/features/leads/types";
import type { LeadAction } from "@/lib/queries/leads";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type KanbanCardProps = {
    lead: LeadRecord;
    onClick: () => void;
    onSetAction: (leadId: number, action: LeadAction) => void;
    onCopyAndOpen?: (lead: LeadRecord) => void;
    isDragging?: boolean;
    dragListeners?: SyntheticListenerMap;
    dragAttributes?: DraggableAttributes;
};

export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
    function KanbanCard(
        {
            lead,
            onClick,
            onSetAction,
            onCopyAndOpen,
            isDragging,
            dragListeners,
            dragAttributes,
        },
        ref,
    ) {
        const [isHovered, setIsHovered] = useState(false);
        const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
        const activeAction = getActiveAction(lead);

        const displayName = lead.name?.trim()
            ? lead.name?.trim().split("(@")[0]
            : "Неизвестно";

        const handleCopyAndOpen = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!lead.suggestedOffer?.trim() && !lead.telegramUsername?.trim())
                return;
            try {
                if (lead.suggestedOffer?.trim()) {
                    await navigator.clipboard.writeText(lead.suggestedOffer);
                }
                setCopyState("copied");
                setTimeout(() => setCopyState("idle"), 2500);
                onCopyAndOpen?.(lead);
            } catch {
                onCopyAndOpen?.(lead);
            }
        };

        return (
            <div
                ref={ref}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`group relative flex cursor-pointer flex-col rounded-2xl bg-white border transition-colors duration-150 ${
                    isDragging
                        ? "z-50 border-blue-300 shadow-md"
                        : "border-slate-200 hover:border-slate-300"
                }`}
                {...dragListeners}
                {...dragAttributes}
            >
                {/* Header */}
                <div className="flex items-center gap-2 px-3.5 pt-3 pb-0.5 min-w-0">
                    <svg
                        className="size-6 text-[#2AABEE]"
                        viewBox="0 0 120 120"
                        fill="none"
                    >
                        <circle cx="60" cy="60" r="60" fill="currentColor" />
                        <path d="M23.775 58.77a3278.85 3278.85 0 0 1 39.27-16.223c18.698-7.454 21.3-8.542 23.828-8.58a4.995 4.995 0 0 1 2.977 1.103c1.058.9 1.38 1.47 1.47 1.972.083.503.075 2.07-.015 2.963-1.013 10.207-4.86 33.78-7.088 45.225-.945 4.837-2.805 6.457-4.605 6.615-3.907.345-6.877-2.475-10.664-4.86-5.925-3.728-7.905-5.1-13.65-8.737-6.653-4.2-3.916-5.663-.128-9.436.99-.982 17.415-15.974 17.662-17.34.21-1.2.286-1.357-.254-1.897-.548-.54-1.2-.473-1.62-.383-.6.128-9.645 5.85-27.15 17.176-2.685 1.777-5.115 2.64-7.298 2.595-2.4-.053-7.027-1.305-10.462-2.378-4.223-1.32-7.575-2.01-7.275-4.245.15-1.163 1.814-2.355 5.002-3.57Z" fill="#FFF" />
                    </svg>
                    <div className="min-w-0 flex-1">
                        <span className="block text-[14px] font-bold text-black leading-snug truncate">
                            {displayName}
                        </span>
                        <span className="block text-[12px] text-black/40 truncate leading-tight">
                            @{lead.telegramUsername.replace(/^@/, "")}
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="px-3.5 pb-3 pt-1.5">
                    <p className="line-clamp-3 text-[16px] leading-normal text-black/65">
                        {lead.snippet || (
                            <span className="italic text-black/30">
                                &lt;не распаршен&gt;
                            </span>
                        )}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-slate-100 px-3.5 py-2.5 rounded-b-2xl">
                    <span className="text-[12px] text-black/40 tabular-nums shrink-0 font-medium">
                        {formatTime(lead.createdAt)}
                    </span>
                    {lead.tag && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="max-w-[120px] truncate rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50">
                                    {lead.tag}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>{lead.tag}</TooltipContent>
                        </Tooltip>
                    )}
                    <button
                        type="button"
                        onClick={handleCopyAndOpen}
                        className={`ml-auto inline-flex shrink-0 items-center justify-center rounded-xl px-3 py-1 text-[12px] font-bold transition-colors duration-150 ${
                            copyState === "copied"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-black text-white hover:bg-black/85"
                        }`}
                    >
                        {copyState === "copied" ? "Скопировано!" : "Написать"}
                    </button>
                </div>

                {/* Action buttons — hover or active */}
                <div
                    className={`absolute right-2 top-2 flex items-center gap-0.5 transition-all duration-150 ${
                        isHovered || activeAction
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 -translate-y-1 pointer-events-none"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={`flex size-7 items-center justify-center rounded-md transition-colors duration-150 ${
                                    activeAction === "in_progress"
                                        ? "bg-blue-50 text-blue-500"
                                        : isHovered
                                          ? "bg-white text-black/40 hover:bg-blue-50 hover:text-blue-500"
                                          : "pointer-events-none opacity-0"
                                }`}
                                onClick={() =>
                                    onSetAction(
                                        lead.id,
                                        activeAction === "in_progress"
                                            ? "none"
                                            : "in_progress",
                                    )
                                }
                            >
                                <ArrowPathIcon
                                    className="size-3.5"
                                    style={
                                        activeAction === "in_progress"
                                            ? {
                                                  animation:
                                                      "spin 2s linear infinite",
                                              }
                                            : undefined
                                    }
                                />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>В работу</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={`flex size-7 items-center justify-center rounded-md transition-colors duration-150 ${
                                    activeAction === "rejected"
                                        ? "bg-secondary text-black/50"
                                        : isHovered
                                          ? "bg-white text-black/40 hover:bg-secondary hover:text-black/50"
                                          : "pointer-events-none opacity-0"
                                }`}
                                onClick={() =>
                                    onSetAction(
                                        lead.id,
                                        activeAction === "rejected"
                                            ? "none"
                                            : "rejected",
                                    )
                                }
                            >
                                <HandThumbDownIcon className="size-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Отклонить</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={`flex size-7 items-center justify-center rounded-md transition-colors duration-150 ${
                                    lead.isFavorite
                                        ? "bg-rose-50 text-rose-500"
                                        : isHovered
                                          ? "bg-white text-black/40 hover:bg-rose-50 hover:text-rose-500"
                                          : "pointer-events-none opacity-0"
                                }`}
                                onClick={() =>
                                    onSetAction(
                                        lead.id,
                                        lead.isFavorite ? "none" : "favorite",
                                    )
                                }
                            >
                                <HeartIcon className="size-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {lead.isFavorite
                                ? "Убрать из избранного"
                                : "В избранное"}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        );
    },
);

function getActiveAction(lead: LeadRecord): LeadAction | null {
    if (lead.status === "in_progress") return "in_progress";
    if (lead.isFavorite) return "favorite";
    if (lead.status === "rejected") return "rejected";
    return null;
}

function formatTime(value: string): string {
    const date = new Date(value);
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const mo = String(date.getMonth() + 1).padStart(2, "0");
    return `${hh}:${mm} ${dd}.${mo}`;
}

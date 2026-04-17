import {
    Cog6ToothIcon,
    TrashIcon,
    ExclamationCircleIcon,
    ClockIcon,
    ArrowPathIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import type { SourceChat } from "@/features/settings/types";
import { getAvatarProps } from "../lib/chat-utils";

function getTelegramLink(chat: SourceChat): string | null {
    if (chat.username) return `https://t.me/${chat.username}`;
    if (chat.url?.startsWith("@")) return `https://t.me/${chat.url.slice(1)}`;
    if (chat.url?.includes("t.me/"))
        return chat.url.startsWith("http") ? chat.url : `https://${chat.url}`;
    return null;
}

function getDisplaySubtitle(chat: SourceChat): string {
    if (chat.username) return `t.me/${chat.username}`;
    if (chat.url && chat.url.includes("t.me/")) return chat.url;
    if (chat.url && chat.url.startsWith("@")) return chat.url;
    if (chat.title && chat.url) return chat.url;
    return `ID: ${chat.id}`;
}

function getScanIndicator(
    status?: string,
): { icon: typeof ClockIcon; color: string; tooltip: string } | null {
    if (!status) return null;
    switch (status) {
        case "pending":
            return {
                icon: ClockIcon,
                color: "text-amber-400",
                tooltip: "Скан: ожидание",
            };
        case "running":
            return {
                icon: ArrowPathIcon,
                color: "text-blue-500",
                tooltip: "Скан: выполняется",
            };
        case "completed":
            return {
                icon: CheckCircleIcon,
                color: "text-emerald-500",
                tooltip: "Скан завершён",
            };
        case "failed":
            return {
                icon: ExclamationCircleIcon,
                color: "text-red-500",
                tooltip: "Скан: ошибка",
            };
        default:
            return {
                icon: ClockIcon,
                color: "text-muted-foreground",
                tooltip: `Скан: ${status}`,
            };
    }
}

export function ChatListItem({
    chat,
    onEdit,
    onScan,
    onDelete,
    issueMessage,
}: {
    chat: SourceChat;
    onEdit: () => void;
    onScan: () => void;
    onDelete: () => void;
    issueMessage?: string | null;
}) {
    const displayName = chat.title || chat.url || "Без названия";
    const avatar = getAvatarProps(displayName);
    const subtitle = getDisplaySubtitle(chat);
    const scanIndicator = getScanIndicator(chat.scanJob?.status);
    const tgLink = getTelegramLink(chat);

    const handleClick = () => {
        if (tgLink) window.open(tgLink, "_blank", "noopener,noreferrer");
    };

    return (
        <div
            onClick={handleClick}
            className="group flex items-center gap-3 px-2 py-3 cursor-pointer hover:bg-slate-50/60 transition-colors duration-150"
        >
            {/* Avatar */}
            {chat.avatarUrl ? (
                <img
                    src={chat.avatarUrl}
                    alt={displayName}
                    className="size-[54px] rounded-full object-cover shrink-0"
                />
            ) : (
                <div
                    className={`flex size-[54px] items-center justify-center rounded-full ${avatar.bg} ${avatar.text} shrink-0`}
                >
                    <span className="text-[20px] font-semibold leading-none">
                        {avatar.letter}
                    </span>
                </div>
            )}

            {/* Name + subtitle */}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span
                    className={`text-[16px] font-semibold truncate leading-snug ${issueMessage ? "text-red-500" : "text-foreground"}`}
                >
                    {displayName}
                </span>
                <span className="text-[14px] text-muted-foreground/50 truncate leading-snug">
                    {subtitle}
                </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                {issueMessage ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="shrink-0 flex items-center justify-center size-8 rounded-full bg-red-50 text-red-500 cursor-help">
                                <ExclamationCircleIcon className="size-4" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            className="max-w-[260px] text-[12px]"
                        >
                            {issueMessage}
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onScan();
                                    }}
                                    className="relative flex size-9 items-center justify-center rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-slate-100 transition-all duration-150"
                                >
                                    <ClockIcon className="size-[18px]" />
                                    {scanIndicator && (
                                        <span
                                            className={`absolute top-1 right-1 size-2.5 rounded-full ${scanIndicator.color.replace("text-", "bg-")} ring-2 ring-white`}
                                        />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {scanIndicator?.tooltip ?? "Скан за период"}
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit();
                                    }}
                                    className="flex size-9 items-center justify-center rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-slate-100 transition-all duration-150"
                                >
                                    <Cog6ToothIcon className="size-[18px]" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Настройки тредов</TooltipContent>
                        </Tooltip>
                    </>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="flex size-9 items-center justify-center rounded-xl text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                >
                    <TrashIcon className="size-[18px]" />
                </button>
            </div>
        </div>
    );
}

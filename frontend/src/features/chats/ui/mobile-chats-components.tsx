import React from "react";
import {
    Cog6ToothIcon,
    TrashIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { ClockIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { SourceChat } from "@/features/settings/types";
import { getAvatarProps } from "../lib/chat-utils";
import { settingsQueries } from "@/lib/queries/settings";
import { Spinner } from "@/shared/ui/spinner";

export function MobileAddChatSheet({
    open,
    onSubmit,
    onClose,
    isPending,
}: {
    open: boolean;
    onSubmit: (url: string) => void;
    onClose: () => void;
    isPending?: boolean;
}) {
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (open) setUrl("");
    }, [open]);

    if (!open || typeof document === "undefined") return null;

    const isValid = url.trim() !== "";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid || isPending) return;
        onSubmit(url.trim());
    };

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex flex-col justify-end bg-black/40 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="bg-popover rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 safe-area-bottom"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h3 className="text-[16px] font-semibold text-foreground">
                        Добавить чат
                    </h3>
                    <button
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-xl text-muted-foreground"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 pt-2 pb-6">
                    <div className="flex flex-col gap-3">
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://t.me/..., @username или ID"
                            autoFocus
                            className="h-12 rounded-xl bg-muted/30 border-transparent text-[16px]"
                        />
                        <p className="text-[13px] text-muted-foreground">
                            Ссылка, @username или ID чата
                        </p>
                        <Button
                            type="submit"
                            disabled={!isValid || isPending}
                            className="w-full h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium text-[15px]"
                        >
                            {isPending ? (
                                <>
                                    <Spinner className="mr-2 size-4 animate-spin" />
                                    Ищем чат...
                                </>
                            ) : (
                                "Добавить"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}

export function MobileChatItem({
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
    const subtitle = chat.username
        ? `t.me/${chat.username}`
        : chat.title
          ? chat.url || `ID: ${chat.id}`
          : `ID: ${chat.id}`;
    const scanStatus = chat.scanJob?.status;
    const scanDotColor =
        scanStatus === "pending"
            ? "bg-amber-400"
            : scanStatus === "running"
              ? "bg-blue-500"
              : scanStatus === "completed"
                ? "bg-emerald-500"
                : scanStatus === "failed"
                  ? "bg-red-500"
                  : null;

    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                    className={`flex size-10 items-center justify-center rounded-full ${avatar.bg} ${avatar.text} shrink-0`}
                >
                    <span className="text-[15px] font-semibold leading-none">
                        {avatar.letter}
                    </span>
                </div>
                <div className="flex flex-col gap-px min-w-0">
                    <span
                        className={`text-[16px] font-bold truncate leading-snug ${issueMessage ? "text-red-500" : "text-foreground"}`}
                    >
                        {displayName}
                    </span>
                    <span className="text-[13px] text-muted-foreground/60 truncate leading-snug">
                        {subtitle}
                    </span>
                </div>
            </div>
            <div className="flex items-stretch gap-0 shrink-0 -my-3 self-stretch">
                {issueMessage ? (
                    <div className="flex w-13 items-center justify-center">
                        <span className="flex items-center justify-center size-8 rounded-full bg-red-50 text-red-500">
                            <ExclamationCircleIcon className="size-4" />
                        </span>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={onScan}
                            className="relative flex w-13 items-center justify-center text-muted-foreground/40 active:text-foreground active:bg-slate-50 transition-colors"
                        >
                            <ClockIcon className="size-[18px]" />
                            {scanDotColor && (
                                <span
                                    className={`absolute top-3 right-1.5 size-2 rounded-full ${scanDotColor} ring-2 ring-white`}
                                />
                            )}
                        </button>
                        <button
                            onClick={onEdit}
                            className="flex w-13 items-center justify-center text-muted-foreground/40 active:text-foreground active:bg-slate-50 transition-colors"
                        >
                            <Cog6ToothIcon className="size-[18px]" />
                        </button>
                    </>
                )}
                <button
                    onClick={onDelete}
                    className="flex w-13 items-center justify-center text-muted-foreground/40 active:text-red-500 active:bg-red-50 transition-colors"
                >
                    <TrashIcon className="size-[18px]" />
                </button>
            </div>
        </div>
    );
}

export function MobileEditChatSheet({
    tenantId,
    open,
    chat,
    onSubmit,
    onClose,
    isPending,
}: {
    tenantId: number;
    open: boolean;
    chat: SourceChat | null;
    onSubmit: (data: { disabledTopicIds: number[] }) => void;
    onClose: () => void;
    isPending?: boolean;
}) {
    const [disabledTopicIds, setDisabledTopicIds] = useState<number[]>([]);
    const topicsQuery = useQuery({
        ...settingsQueries.sourceTopics(tenantId, chat?.id ?? ""),
        enabled: open && Boolean(chat?.id),
    });

    useEffect(() => {
        if (open && chat) {
            setDisabledTopicIds(chat.disabledTopicIds || []);
        }
    }, [open, chat]);

    if (!open || !chat || typeof document === "undefined") return null;

    const topics = topicsQuery.data?.topics || [];
    const isForum = Boolean(topicsQuery.data?.isForum);

    const toggleTopic = (topicId: number) => {
        setDisabledTopicIds((current) =>
            current.includes(topicId)
                ? current.filter((item) => item !== topicId)
                : [...current, topicId],
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isPending) return;
        onSubmit({ disabledTopicIds });
    };

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex flex-col justify-end bg-black/40 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="bg-popover rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 safe-area-bottom"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h3 className="text-[16px] font-semibold text-foreground">
                        Настройки тредов
                    </h3>
                    <button
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-xl text-muted-foreground"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 pt-2 pb-6">
                    <div className="flex flex-col gap-3">
                        <Input
                            value={chat.url || ""}
                            readOnly
                            className="h-12 rounded-xl bg-muted/30 border-transparent text-[16px]"
                        />
                        {topicsQuery.isLoading ? (
                            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                                <Spinner className="size-4 animate-spin" />
                                Загружаем треды...
                            </div>
                        ) : null}
                        {!topicsQuery.isLoading && !isForum ? (
                            <p className="text-[13px] text-muted-foreground">
                                Это не форумный чат или в нём нет доступных
                                тредов.
                            </p>
                        ) : null}
                        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                            {topics.map((topic) => {
                                const isDisabled = disabledTopicIds.includes(
                                    topic.id,
                                );
                                return (
                                    <button
                                        key={topic.id}
                                        type="button"
                                        onClick={() => toggleTopic(topic.id)}
                                        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50/60"
                                    >
                                        <span className="truncate text-[13px] font-medium text-foreground">
                                            {topic.title}
                                        </span>
                                        <span
                                            className={`shrink-0 text-[12px] ${isDisabled ? "text-muted-foreground/50" : "text-emerald-600"}`}
                                        >
                                            {isDisabled ? "Выкл" : "Вкл"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <Button
                            type="submit"
                            disabled={isPending || topicsQuery.isLoading}
                            className="w-full h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium text-[15px]"
                        >
                            {isPending ? (
                                <>
                                    <Spinner className="mr-2 size-4 animate-spin" />
                                    Сохраняем...
                                </>
                            ) : (
                                "Сохранить настройки"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}

import React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { SourceChat } from "@/features/settings/types";
import { settingsQueries } from "@/lib/queries/settings";
import { Spinner } from "@/shared/ui/spinner";

export interface AddChatModalProps {
    open: boolean;
    onSubmit: (url: string) => void;
    onClose: () => void;
    isPending?: boolean;
}

export function AddChatModal({
    open,
    onSubmit,
    onClose,
    isPending,
}: AddChatModalProps) {
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (open) setUrl("");
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open || typeof document === "undefined") return null;

    const isValid = url.trim() !== "";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid || isPending) return;
        onSubmit(url.trim());
    };

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[460px] rounded-[32px] bg-[#f4f4f5] border border-border/40 overflow-hidden animate-in zoom-in-95 fade-in duration-150 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative flex items-center justify-center px-4 pt-4 pb-4">
                    <button
                        onClick={onClose}
                        className="absolute left-4 flex size-8 items-center justify-center rounded-full bg-white shadow-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                    <h3 className="text-base font-semibold text-foreground">
                        Добавить чат
                    </h3>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-4 pb-4">
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-[24px] p-5 shadow-sm flex flex-col gap-1.5">
                            <label className="text-[14px] font-medium text-foreground">
                                Ссылка на канал, t.me или ID
                            </label>
                            <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://t.me/..., @username или ID"
                                autoFocus
                                className="bg-muted/30 border-transparent focus-visible:bg-background focus-visible:border-border focus-visible:ring-1 focus-visible:ring-border transition-all rounded-xl"
                            />
                            <p className="text-[13px] text-muted-foreground pl-1 mt-1">
                                Значение можно скопировать из любого клиента
                                Telegram. Форматы: @channel, t.me/channel,
                                числовой ID (-100...)
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={!isValid || isPending}
                            className="w-full h-12 rounded-full bg-[#2AABEE] text-white hover:bg-[#229ED9] transition-all font-medium shadow-sm"
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

export interface EditChatModalProps {
    tenantId: number;
    open: boolean;
    chat: SourceChat | null;
    onSubmit: (data: { disabledTopicIds: number[] }) => void;
    onClose: () => void;
    isPending?: boolean;
}

export function EditChatModal({
    tenantId,
    open,
    chat,
    onSubmit,
    onClose,
    isPending,
}: EditChatModalProps) {
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

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open || !chat || typeof document === "undefined") return null;

    const topics = topicsQuery.data?.topics || [];
    const isForum = Boolean(topicsQuery.data?.isForum);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isPending) return;
        onSubmit({ disabledTopicIds });
    };

    const toggleTopic = (topicId: number) => {
        setDisabledTopicIds((current) =>
            current.includes(topicId)
                ? current.filter((item) => item !== topicId)
                : [...current, topicId],
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[460px] rounded-[32px] bg-[#f4f4f5] border border-border/40 overflow-hidden animate-in zoom-in-95 fade-in duration-150 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative flex items-center justify-center px-4 pt-4 pb-4">
                    <button
                        onClick={onClose}
                        className="absolute left-4 flex size-8 items-center justify-center rounded-full bg-white shadow-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                    <h3 className="text-base font-semibold text-foreground">
                        Настройки тредов
                    </h3>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-4 pb-4">
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-[24px] p-5 shadow-sm flex flex-col gap-1.5">
                            <label className="text-[14px] font-medium text-foreground">
                                Чат-источник
                            </label>
                            <Input
                                value={chat.url || ""}
                                readOnly
                                className="bg-muted/30 border-transparent rounded-xl"
                            />
                            <p className="text-[13px] text-muted-foreground pl-1 mt-1">
                                По умолчанию сканируются все треды. Здесь можно
                                выключить лишние.
                            </p>
                        </div>

                        <div className="bg-white rounded-[24px] p-2 shadow-sm flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
                            {topicsQuery.isLoading ? (
                                <div className="flex items-center gap-2 px-3 py-3 text-[13px] text-muted-foreground">
                                    <Spinner className="size-4 animate-spin" />
                                    Загружаем треды...
                                </div>
                            ) : null}

                            {!topicsQuery.isLoading && !isForum ? (
                                <p className="text-[13px] text-muted-foreground px-3 py-3">
                                    Это не форумный чат или в нём нет доступных
                                    тредов. Будет сканироваться общий поток.
                                </p>
                            ) : null}

                            {!topicsQuery.isLoading &&
                            isForum &&
                            topics.length === 0 ? (
                                <p className="text-[13px] text-muted-foreground px-3 py-3">
                                    Треды не найдены. Будет сканироваться общий
                                    поток форума.
                                </p>
                            ) : null}

                            {topics.map((topic) => {
                                const isEnabled = !disabledTopicIds.includes(
                                    topic.id,
                                );
                                return (
                                    <div
                                        key={topic.id}
                                        className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50/60"
                                    >
                                        <span className="truncate text-[13px] font-medium text-foreground pr-3">
                                            {topic.title}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleTopic(topic.id)
                                            }
                                            aria-label={
                                                isEnabled
                                                    ? "Выключить тред"
                                                    : "Включить тред"
                                            }
                                            className={`relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                                                isEnabled
                                                    ? "bg-[#2AABEE]"
                                                    : "bg-zinc-200"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none block size-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                                                    isEnabled
                                                        ? "translate-x-[20px]"
                                                        : "translate-x-[2px]"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending || topicsQuery.isLoading}
                            className="w-full h-12 rounded-full bg-[#2AABEE] text-white hover:bg-[#229ED9] transition-all font-medium shadow-sm"
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

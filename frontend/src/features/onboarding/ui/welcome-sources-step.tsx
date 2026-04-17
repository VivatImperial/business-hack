import {
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";
import { Input } from "@/shared/ui/input";
import { useChatsActions } from "@/features/chats/lib/use-chats-actions";
import { getAvatarProps } from "@/features/chats/lib/chat-utils";
import type { SourceChat } from "@/features/settings/types";
import { Spinner } from "@/shared/ui/spinner";

interface WelcomeSourcesStepProps {
    tenantId: number;
    sources: SourceChat[];
}

export function WelcomeSourcesStep({
    tenantId,
    sources,
}: WelcomeSourcesStepProps) {
    const [url, setUrl] = useState("");
    const { addMutation, deleteMutation } = useChatsActions(tenantId);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = url.trim();
        if (!trimmed || addMutation.isPending) return;
        addMutation.mutate(trimmed, {
            onSuccess: () => setUrl(""),
        });
    };

    return (
        <div className="flex w-full flex-col gap-4 py-1">
            <form onSubmit={handleAdd} className="flex gap-2">
                <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://t.me/..., @username или ID"
                    className="h-11 flex-1 rounded-xl"
                />
                <button
                    type="submit"
                    disabled={!url.trim() || addMutation.isPending}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {addMutation.isPending ? (
                        <Spinner className="size-4 animate-spin" />
                    ) : (
                        <>
                            <PlusIcon className="size-4" />
                            <span className="hidden sm:inline">Добавить</span>
                        </>
                    )}
                </button>
            </form>

            {sources.length > 0 && (
                <div className="flex max-h-[280px] flex-col gap-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
                    {sources.map((chat) => {
                        const displayName =
                            chat.title || chat.url || "Без названия";
                        const avatar = getAvatarProps(displayName);
                        const subtitle = chat.username
                            ? `t.me/${chat.username}`
                            : chat.url || `ID: ${chat.id}`;
                        return (
                            <div
                                key={chat.id}
                                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                            >
                                {chat.avatarUrl ? (
                                    <img
                                        src={chat.avatarUrl}
                                        alt={displayName}
                                        className="size-9 shrink-0 rounded-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${avatar.bg} ${avatar.text}`}
                                    >
                                        <span className="text-[13px] font-semibold leading-none">
                                            {avatar.letter}
                                        </span>
                                    </div>
                                )}
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-[13px] font-medium text-foreground">
                                        {displayName}
                                    </span>
                                    <span className="truncate text-[11px] text-muted-foreground">
                                        {subtitle}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        deleteMutation.mutate(chat.url)
                                    }
                                    disabled={deleteMutation.isPending}
                                    className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground/50 transition-colors hover:bg-red-50 hover:text-red-500"
                                >
                                    <TrashIcon className="size-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

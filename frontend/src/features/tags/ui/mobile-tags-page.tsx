import { useSuspenseQuery } from "@tanstack/react-query";
import { PlusIcon, LinkIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import type { TagRecord } from "@/features/tags/types";
import type { TagsListResponse } from "@/lib/api/generated/schemas";
import { TAGS_LIST_DEFAULTS } from "@/features/tags/types";
import { tagsQueries } from "@/lib/queries/tags";
import { settingsQueries } from "@/lib/queries/settings";
import { getRouteApi } from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { ConfirmModal } from "@/shared/ui/confirm-modal";
import { TagsGrid } from "./tags-grid";
import { TagFormSheet } from "./tag-form-sheet";
import { TagsEmptyState } from "./tags-empty-state";
import type { SettingsData, SettingsIssue } from "@/features/settings/types";
import { hasDestinationIssue } from "@/features/settings/lib/issues";
import { useTagsActions } from "../lib/use-tags-actions";
import { Spinner } from "@/shared/ui/spinner";

function getTelegramChatLink(ref: string): string | null {
    if (ref.startsWith("@")) return `https://t.me/${ref.slice(1)}`;
    if (ref.includes("t.me/"))
        return ref.startsWith("http") ? ref : `https://${ref}`;
    return null;
}

const appRoute = getRouteApi("/_app");

export function MobileTagsPage() {
    const { tenantId } = appRoute.useRouteContext();

    const { data: dataRaw, isFetching } = useSuspenseQuery(
        tagsQueries.list(tenantId!, TAGS_LIST_DEFAULTS),
    );
    const data = dataRaw as TagsListResponse;
    const tags = data.tags as TagRecord[];

    const { data: settings } = useSuspenseQuery(
        settingsQueries.detail(tenantId!),
    );
    const settingsData = settings as SettingsData;

    const [chatLink, setChatLink] = useState(
        settingsData.routing.defaultChat || "",
    );
    useEffect(() => {
        setChatLink(settingsData.routing.defaultChat || "");
    }, [settingsData.routing.defaultChat]);

    const actions = useTagsActions(tenantId!);

    const chatLinkDirty = chatLink !== (settingsData.routing.defaultChat || "");
    const savedDefaultChat = settingsData.routing.defaultChat || "";
    const issues = (settingsData.issues ?? []) as SettingsIssue[];
    const destinationIssue = hasDestinationIssue(issues);

    const handleSaveChatLink = () => {
        actions.updateDestinationMutation.mutate(chatLink);
    };

    const isEmpty = tags.length === 0;

    return (
        <TooltipProvider>
        <div className="flex flex-col gap-4">
            <ConfirmModal
                open={actions.deleteConfirm !== null}
                title="Удалить тег?"
                description="Тег будет удалён безвозвратно."
                confirmLabel="Удалить"
                onConfirm={() => {
                    if (actions.deleteConfirm !== null) void actions.handleDelete(actions.deleteConfirm);
                    actions.setDeleteConfirm(null);
                }}
                onCancel={() => actions.setDeleteConfirm(null)}
            />

            <ConfirmModal
                open={actions.topicsConfirmOpen}
                title="Включить треды?"
                description="Конвертируем чат в супергруппу с топиками. Если активные теги уже есть, для них создадутся топики; если тегов пока нет, треды просто включатся."
                confirmLabel="Включить треды"
                onConfirm={actions.handleTopicsConfirm}
                onCancel={actions.handleTopicsCancel}
            />

            {/* Loading */}
            {isFetching && tags.length > 0 && (
                <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-card/95 backdrop-blur-md px-3 py-1.5 shadow-lg">
                    <Spinner className="size-3 animate-spin" />
                    <span className="text-[12px] font-medium text-muted-foreground">
                        Обновление...
                    </span>
                </div>
            )}

            {/* Header */}
            {savedDefaultChat && settingsData.routing.defaultChatTitle && (
                <div className="flex flex-col gap-1">
                    {(() => {
                        const link = getTelegramChatLink(savedDefaultChat);
                        return (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {destinationIssue ? (
                                    <>
                                        <span className="text-[14px] text-red-500">
                                            {settingsData.routing.defaultChatTitle}
                                        </span>
                                        <span className="text-muted-foreground/30">·</span>
                                        <button
                                            type="button"
                                            onClick={() => actions.recreateDestinationMutation.mutate(tenantId!)}
                                            disabled={actions.recreateDestinationMutation.isPending}
                                            className="text-[14px] text-red-500 underline underline-offset-2 hover:text-red-600 transition-colors disabled:opacity-50"
                                        >
                                            {actions.recreateDestinationMutation.isPending
                                                ? "создаём..."
                                                : "пересоздать"}
                                        </button>
                                    </>
                                ) : link ? (
                                    <a
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[14px] text-blue-600"
                                    >
                                        <ArrowTopRightOnSquareIcon className="size-3.5" />
                                        {settingsData.routing.defaultChatTitle}
                                    </a>
                                ) : (
                                    <span className="text-[14px] text-muted-foreground">
                                        {settingsData.routing.defaultChatTitle}
                                    </span>
                                )}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Chat link settings — hidden when chat is already set up */}
            {!savedDefaultChat && (
                <div className="rounded-2xl bg-white border border-gray-200 p-4">
                    {settingsData.routing.defaultChatTitle && !chatLinkDirty && (
                        <p className="text-[13px] text-muted-foreground mb-2">
                            Чат:{" "}
                            <span className="font-medium text-foreground">
                                {settingsData.routing.defaultChatTitle}
                            </span>
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                            <Input
                                value={chatLink}
                                onChange={(e) => setChatLink(e.target.value)}
                                placeholder="t.me/... или @username"
                                className="h-10 pl-9 rounded-xl bg-muted/40 border-transparent text-[14px]"
                            />
                        </div>
                        <Button
                            onClick={handleSaveChatLink}
                            disabled={!chatLinkDirty || actions.updateDestinationMutation.isPending}
                            className="h-10 px-4 rounded-xl bg-secondary text-foreground font-medium shrink-0"
                        >
                            {actions.updateDestinationMutation.isPending && (
                                <Spinner className="mr-1 size-3 animate-spin" />
                            )}
                            OK
                        </Button>
                    </div>
                    <p className="mt-2 text-[12px] text-muted-foreground">
                        Можно указать свой чат вручную или создать его автоматически
                        через подключённый Telegram-аккаунт.
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                        <Button
                            onClick={() => actions.createManagedChatMutation.mutate(tenantId!)}
                            disabled={
                                chatLinkDirty ||
                                actions.createManagedChatMutation.isPending ||
                                actions.enableTopicsMutation.isPending
                            }
                            className="h-10 rounded-xl bg-blue-600 text-white font-medium"
                        >
                            {actions.createManagedChatMutation.isPending && (
                                <Spinner className="mr-2 size-3 animate-spin" />
                            )}
                            Создать чат в Telegram
                        </Button>
                        <p className="text-[12px] text-muted-foreground">
                            Сначала укажите или создайте целевой чат.
                        </p>
                    </div>
                </div>
            )}

            {/* Tags */}
            {isEmpty ? (
                <TagsEmptyState onCreateTag={actions.handleCreateNew} hasChat={!!savedDefaultChat} />
            ) : (
                <TagsGrid
                    tags={tags}
                    onToggleActive={(id) => void actions.handleToggleActive(id)}
                    onEdit={actions.handleEdit}
                    onDelete={(id) => actions.setDeleteConfirm(id)}
                    pendingActions={actions.pendingActions}
                />
            )}

            <TagFormSheet
                open={actions.formSheetOpen}
                onOpenChange={actions.setFormSheetOpen}
                tag={actions.editingTag}
                onSubmit={(formData) => actions.handleFormSubmit(formData, savedDefaultChat)}
                onDelete={(id) => actions.setDeleteConfirm(id)}
                isPending={actions.createMutation.isPending || actions.updateMutation.isPending}
                side="bottom"
            />

            {/* FAB */}
            {savedDefaultChat && (
                <button
                    onClick={actions.handleCreateNew}
                    className="fixed bottom-20 right-4 z-40 flex items-center justify-center size-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
                >
                    <PlusIcon className="size-6" />
                </button>
            )}
        </div>
        </TooltipProvider>
    );
}

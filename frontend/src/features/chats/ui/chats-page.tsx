import { useSuspenseQuery } from "@tanstack/react-query";
import { PlusIcon } from "@heroicons/react/24/solid";
import { GuideHelpButton } from "@/shared/layout/guide-help-button";
import { useState } from "react";
import { settingsQueries } from "@/lib/queries/settings";
import { getRouteApi } from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";
import { ConfirmModal } from "@/shared/ui/confirm-modal";
import type { SettingsData, SourceChat } from "@/features/settings/types";
import { getChatIssueMessage } from "@/features/settings/lib/issues";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { useChatsActions } from "../lib/use-chats-actions";
import { AddChatModal, EditChatModal } from "./chat-modals";
import { HistoricalScanModal } from "./historical-scan-modal";
import { ChatListItem } from "./chat-list-item";
import { ChatsEmptyState } from "./chats-empty-state";
import { Spinner } from "@/shared/ui/spinner";

const appRoute = getRouteApi("/_app");

export function ChatsPage() {
    const { tenantId } = appRoute.useRouteContext();
    const { data: settings } = useSuspenseQuery(
        settingsQueries.detail(tenantId!),
    );
    const settingsData = settings as SettingsData;

    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingChat, setEditingChat] = useState<SourceChat | null>(null);
    const [scanModalOpen, setScanModalOpen] = useState(false);
    const [scanningChat, setScanningChat] = useState<SourceChat | null>(null);

    const sources = settingsData.sources || [];
    const { addMutation, deleteMutation, updateConfigMutation, isPending } =
        useChatsActions(tenantId!);

    const handleAddSubmit = (url: string) => {
        addMutation.mutate(url, { onSuccess: () => setAddModalOpen(false) });
    };

    const handleEdit = (chat: SourceChat) => {
        setEditingChat(chat);
        setEditModalOpen(true);
    };

    const handleEditSubmit = (data: { disabledTopicIds: number[] }) => {
        if (!editingChat) return;
        updateConfigMutation.mutate(
            {
                sourceId: editingChat.id,
                disabledTopicIds: data.disabledTopicIds,
            },
            {
                onSuccess: () => {
                    setEditModalOpen(false);
                    setEditingChat(null);
                },
            },
        );
    };

    const handleDelete = () => {
        if (!deleteConfirm) return;
        const chat = sources.find((s) => s.id === deleteConfirm);
        if (chat) deleteMutation.mutate(chat.url);
        setDeleteConfirm(null);
    };

    return (
        <TooltipProvider>
            <div className="relative flex flex-col gap-6 ">
                <ConfirmModal
                    open={deleteConfirm !== null}
                    title="Удалить чат?"
                    description="Чат будет удалён из списка источников. Это действие нельзя отменить."
                    confirmLabel="Удалить"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteConfirm(null)}
                />

                <AddChatModal
                    open={addModalOpen}
                    onSubmit={handleAddSubmit}
                    onClose={() => setAddModalOpen(false)}
                    isPending={addMutation.isPending}
                />

                <EditChatModal
                    tenantId={tenantId!}
                    open={editModalOpen}
                    chat={editingChat}
                    onSubmit={handleEditSubmit}
                    onClose={() => {
                        setEditModalOpen(false);
                        setEditingChat(null);
                    }}
                    isPending={updateConfigMutation.isPending}
                />

                <HistoricalScanModal
                    tenantId={tenantId!}
                    open={scanModalOpen}
                    chat={scanningChat}
                    onClose={() => {
                        setScanModalOpen(false);
                        setScanningChat(null);
                    }}
                />

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="font-heading text-[26px] font-extrabold tracking-tight text-foreground">
                                Источники лидов
                            </h1>
                            <GuideHelpButton section="chats" />
                        </div>
                        <p className="text-[15px] text-muted-foreground">
                            Чаты и каналы для мониторинга
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setAddModalOpen(true)}
                        className="h-10 px-5 gap-2 rounded-xl border-dashed text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <PlusIcon className="size-4" />
                        Добавить чат
                    </Button>
                </div>

                {/* Content */}
                {sources.length === 0 ? (
                    <ChatsEmptyState onAdd={() => setAddModalOpen(true)} />
                ) : (
                    <div className="divide-y divide-gray-100">
                        {sources.map((chat) => (
                            <ChatListItem
                                key={chat.id}
                                chat={chat}
                                onEdit={() => handleEdit(chat)}
                                onScan={() => {
                                    setScanningChat(chat);
                                    setScanModalOpen(true);
                                }}
                                onDelete={() => setDeleteConfirm(chat.id)}
                                issueMessage={getChatIssueMessage(chat)}
                            />
                        ))}
                    </div>
                )}

                {isPending && (
                    <div className="absolute top-2 right-0 z-50 flex items-center gap-2 rounded-xl bg-card/95 backdrop-blur-md px-3.5 py-2 shadow-lg shadow-black/6">
                        <Spinner className="size-3.5 animate-spin text-foreground" />
                        <span className="text-[12px] font-medium text-muted-foreground">
                            Сохранение...
                        </span>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}

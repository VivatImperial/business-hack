import { useSuspenseQuery } from "@tanstack/react-query";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { settingsQueries } from "@/lib/queries/settings";
import { getRouteApi } from "@tanstack/react-router";
import { ConfirmModal } from "@/shared/ui/confirm-modal";
import type { SettingsData, SourceChat } from "@/features/settings/types";
import { getChatIssueMessage } from "@/features/settings/lib/issues";
import { useChatsActions } from "../lib/use-chats-actions";
import {
    MobileAddChatSheet,
    MobileChatItem,
    MobileEditChatSheet,
} from "./mobile-chats-components";
import { MobileHistoricalScanSheet } from "./historical-scan-modal";
import { ChatsEmptyState } from "./chats-empty-state";
import { Spinner } from "@/shared/ui/spinner";

const appRoute = getRouteApi("/_app");

export function MobileChatsPage() {
    const { tenantId } = appRoute.useRouteContext();
    const { data: settings } = useSuspenseQuery(
        settingsQueries.detail(tenantId!),
    );
    const settingsData = settings as SettingsData;

    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingChat, setEditingChat] = useState<SourceChat | null>(null);
    const [scanOpen, setScanOpen] = useState(false);
    const [scanningChat, setScanningChat] = useState<SourceChat | null>(null);

    const sources = settingsData.sources || [];
    const { addMutation, deleteMutation, updateConfigMutation, isPending } =
        useChatsActions(tenantId!);

    const handleAddSubmit = (url: string) => {
        addMutation.mutate(url, { onSuccess: () => setAddOpen(false) });
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
                    setEditOpen(false);
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
        <div className="flex flex-col gap-4">
            <ConfirmModal
                open={deleteConfirm !== null}
                title="Удалить чат?"
                description="Чат будет удалён из списка источников."
                confirmLabel="Удалить"
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
            />

            <MobileAddChatSheet
                open={addOpen}
                onSubmit={handleAddSubmit}
                onClose={() => setAddOpen(false)}
                isPending={addMutation.isPending}
            />

            <MobileEditChatSheet
                tenantId={tenantId!}
                open={editOpen}
                chat={editingChat}
                onSubmit={handleEditSubmit}
                onClose={() => {
                    setEditOpen(false);
                    setEditingChat(null);
                }}
                isPending={updateConfigMutation.isPending}
            />

            <MobileHistoricalScanSheet
                tenantId={tenantId!}
                open={scanOpen}
                chat={scanningChat}
                onClose={() => {
                    setScanOpen(false);
                    setScanningChat(null);
                }}
            />

            {sources.length === 0 ? (
                <ChatsEmptyState onAdd={() => setAddOpen(true)} />
            ) : (
                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden divide-y divide-gray-100">
                    {sources.map((chat) => (
                        <MobileChatItem
                            key={chat.id}
                            chat={chat}
                            onEdit={() => {
                                setEditingChat(chat);
                                setEditOpen(true);
                            }}
                            onScan={() => {
                                setScanningChat(chat);
                                setScanOpen(true);
                            }}
                            onDelete={() => setDeleteConfirm(chat.id)}
                            issueMessage={getChatIssueMessage(chat)}
                        />
                    ))}
                </div>
            )}

            <button
                onClick={() => setAddOpen(true)}
                className="fixed bottom-20 right-4 z-40 flex items-center justify-center size-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
            >
                <PlusIcon className="size-6" />
            </button>

            {isPending && (
                <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-card/95 backdrop-blur-md px-3 py-1.5 shadow-lg">
                    <Spinner className="size-3 animate-spin" />
                    <span className="text-[12px] font-medium text-muted-foreground">
                        Сохранение...
                    </span>
                </div>
            )}
        </div>
    );
}

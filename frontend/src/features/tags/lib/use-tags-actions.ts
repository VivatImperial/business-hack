import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { tagsMutations } from "@/lib/queries/tags";
import { settingsMutations } from "@/lib/queries/settings";
import type { TagRecord, CreateTagInput } from "@/features/tags/types";
import { snackbarStore } from "@/shared/lib/snackbar-store";

export function useTagsActions(tenantId: number) {
    const queryClient = useQueryClient();
    const [formSheetOpen, setFormSheetOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<TagRecord | null>(null);
    const [pendingActions, setPendingActions] = useState<Set<number>>(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [topicsConfirmOpen, setTopicsConfirmOpen] = useState(false);
    const [pendingTagData, setPendingTagData] = useState<CreateTagInput | null>(null);

    const invalidateTags = async () => {
        await queryClient.invalidateQueries({ queryKey: ["tags"] });
    };

    const addPending = (id: number) =>
        setPendingActions((prev) => new Set(prev).add(id));
    const removePending = (id: number) =>
        setPendingActions((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

    // ── Chat mutations ──

    const createManagedChatMutation = useMutation({
        mutationFn: (tid: number) => settingsMutations.createManagedDestination(tid),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            snackbarStore.show(
                result.created
                    ? `Чат "${result.defaultChatTitle}" создан`
                    : `Чат уже настроен: ${result.defaultChatTitle}`,
            );
        },
        onError: (error: Error) => {
            snackbarStore.showError(error.message || "Не удалось создать чат");
        },
    });

    const recreateDestinationMutation = useMutation({
        mutationFn: (tid: number) => settingsMutations.recreateDestination(tid),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            queryClient.invalidateQueries({ queryKey: ["tags"] });
            snackbarStore.show(`Чат "${result.defaultChatTitle}" создан заново`);
        },
        onError: (error: Error) => {
            snackbarStore.showError(error.message || "Не удалось пересоздать чат");
        },
    });

    const enableTopicsMutation = useMutation({
        mutationFn: (tid: number) => settingsMutations.enableTopics(tid),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            snackbarStore.show(
                result.createdTopics > 0
                    ? `Треды включены, создано топиков: ${result.createdTopics}`
                    : result.totalTopics > 0
                      ? "Треды уже были включены"
                      : "Треды включены. Топики появятся после создания тегов.",
            );
        },
        onError: (error: Error) => {
            snackbarStore.showError(error.message || "Не удалось включить треды");
        },
    });

    const updateDestinationMutation = useMutation({
        mutationFn: (defaultChat: string) =>
            settingsMutations.updateDestination(tenantId, defaultChat),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            snackbarStore.show("Ссылка сохранена");
        },
        onError: () => {
            snackbarStore.showError("Ошибка сохранения");
        },
    });

    // ── Tag mutations ──

    const createMutation = useMutation({
        mutationFn: (data: CreateTagInput) => tagsMutations.create(tenantId, data),
        onSuccess: async () => {
            await invalidateTags();
            setFormSheetOpen(false);
            setEditingTag(null);
            snackbarStore.show("Тег создан");
            enableTopicsMutation.mutate(tenantId);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: Parameters<typeof tagsMutations.update>[1]) =>
            tagsMutations.update(tenantId, data),
        onSuccess: () => {
            invalidateTags();
            setFormSheetOpen(false);
            setEditingTag(null);
            snackbarStore.show("Тег обновлён");
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: (data: { id: number }) => tagsMutations.toggleActive(tenantId, data),
        onSuccess: () => {
            invalidateTags();
            snackbarStore.show("Тег переключён");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (data: { id: number }) => tagsMutations.delete(tenantId, data),
        onSuccess: () => {
            invalidateTags();
            snackbarStore.show("Тег удалён");
        },
    });

    // ── Handlers ──

    const handleToggleActive = async (id: number) => {
        addPending(id);
        try {
            await toggleActiveMutation.mutateAsync({ id });
        } finally {
            removePending(id);
        }
    };

    const handleDelete = async (id: number) => {
        addPending(id);
        try {
            await deleteMutation.mutateAsync({ id });
        } finally {
            removePending(id);
        }
    };

    const handleEdit = (tag: TagRecord) => {
        setEditingTag(tag);
        setFormSheetOpen(true);
    };

    const handleCreateNew = () => {
        setEditingTag(null);
        setFormSheetOpen(true);
    };

    const handleFormSubmit = (formData: CreateTagInput, savedDefaultChat: string) => {
        if (editingTag) {
            updateMutation.mutate({ id: editingTag.id, ...formData });
        } else if (!savedDefaultChat) {
            setPendingTagData(formData);
            setFormSheetOpen(false);
            setTopicsConfirmOpen(true);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleTopicsConfirm = async () => {
        setTopicsConfirmOpen(false);
        if (pendingTagData) {
            await createMutation.mutateAsync(pendingTagData);
            enableTopicsMutation.mutate(tenantId);
            setPendingTagData(null);
        }
    };

    const handleTopicsCancel = () => {
        setTopicsConfirmOpen(false);
        setPendingTagData(null);
    };

    return {
        // State
        formSheetOpen,
        setFormSheetOpen,
        editingTag,
        pendingActions,
        deleteConfirm,
        setDeleteConfirm,
        topicsConfirmOpen,

        // Chat mutations
        createManagedChatMutation,
        recreateDestinationMutation,
        enableTopicsMutation,
        updateDestinationMutation,

        // Tag mutations
        createMutation,
        updateMutation,

        // Handlers
        handleToggleActive,
        handleDelete,
        handleEdit,
        handleCreateNew,
        handleFormSubmit,
        handleTopicsConfirm,
        handleTopicsCancel,
    };
}

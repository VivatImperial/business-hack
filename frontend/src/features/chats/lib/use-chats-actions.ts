import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsMutations } from "@/lib/queries/settings";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { getDisplayError } from "@/shared/lib/get-display-error";

export function useChatsActions(tenantId: number) {
    const queryClient = useQueryClient();

    const addMutation = useMutation({
        mutationFn: (url: string) =>
            settingsMutations.addSource(tenantId, url),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            snackbarStore.show("Чат добавлен");
        },
        onError: (err: unknown) => {
            snackbarStore.showError(getDisplayError(err, "Не удалось добавить чат"));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (sourceValue: string) =>
            settingsMutations.deleteSource(tenantId, sourceValue),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            snackbarStore.show("Чат удалён");
        },
        onError: (err: unknown) => {
            snackbarStore.showError(getDisplayError(err, "Не удалось удалить чат"));
        },
    });

    const updateConfigMutation = useMutation({
        mutationFn: (payload: { sourceId: string; disabledTopicIds: number[] }) =>
            settingsMutations.updateSourceConfig(tenantId, payload.sourceId, {
                disabledTopicIds: payload.disabledTopicIds,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            snackbarStore.show("Настройки тредов обновлены");
        },
        onError: (err: unknown) => {
            snackbarStore.showError(getDisplayError(err, "Ошибка при сохранении"));
        },
    });

    return {
        addMutation,
        deleteMutation,
        updateConfigMutation,
        isPending: addMutation.isPending || deleteMutation.isPending || updateConfigMutation.isPending,
    };
}

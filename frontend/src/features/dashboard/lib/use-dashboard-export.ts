import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { BASE_URL } from "@/lib/api/client";
import { leadsMutations } from "@/lib/queries/leads";
import { snackbarStore } from "@/shared/lib/snackbar-store";

export function useDashboardExport(tenantId: number, activePeriod: string) {
    const exportMutation = useMutation({
        mutationFn: (data: Parameters<typeof leadsMutations.export>[1]) =>
            leadsMutations.export(tenantId, data),
    });

    const handleExport = async () => {
        try {
            const response = (await exportMutation.mutateAsync({
                filters: { period: activePeriod },
            })) as {
                downloadUrl?: string;
                filename?: string;
                exportedCount?: number;
            };
            if (response.downloadUrl) {
                const token = Cookies.get("auth_token");
                const downloadUrl = response.downloadUrl.startsWith("http")
                    ? response.downloadUrl
                    : `${BASE_URL}${response.downloadUrl}`;
                const res = await fetch(downloadUrl, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) throw new Error("Ошибка загрузки файла");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = response.filename || "leads.xlsx";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
            snackbarStore.show(`Экспорт: ${response.exportedCount ?? 0} лидов`);
        } catch (err) {
            snackbarStore.showError(
                err instanceof Error ? err.message : "Ошибка экспорта",
            );
        }
    };

    return { handleExport, isExporting: exportMutation.isPending };
}

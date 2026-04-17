import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
    PlusIcon,
    TrashIcon,
    ClipboardDocumentIcon,
    CheckIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";

import { adminUtmQueries, adminUtmMutations } from "@/lib/queries/admin";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { getDisplayError } from "@/shared/lib/get-display-error";

export function AdminUtmListPage() {
    const { data: links, isLoading, refetch, isFetching } = useQuery(adminUtmQueries.links());
    const queryClient = useQueryClient();
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminUtmMutations.deleteLink(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "utm", "links"] });
            snackbarStore.show("Ссылка деактивирована");
        },
        onError: (err: Error) => {
            snackbarStore.showError(getDisplayError(err, "Не удалось удалить ссылку"));
        },
    });

    const handleCopy = async (id: number, code: string) => {
        const url = `${window.location.origin}/utm/${code}`;
        await navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="relative flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="font-heading text-[26px] font-extrabold tracking-tight text-foreground">
                        UTM-ссылки
                    </h1>
                    <p className="text-[14px] text-muted-foreground">
                        Ссылки с предустановленным промптом и набором чатов для новых пользователей.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 shrink-0 rounded-xl px-4"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        {isFetching ? <Spinner className="size-4 animate-spin mr-2" /> : null}
                        Обновить
                    </Button>
                    <Link to="/admin/utm/new">
                        <Button className="h-10 rounded-xl px-5 gap-1.5">
                            <PlusIcon className="size-4" />
                            Создать ссылку
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Links table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Spinner className="size-6" />
                </div>
            ) : !links || links.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                    <p className="text-[14px] font-medium text-foreground">
                        Нет UTM-ссылок
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        Создайте первую ссылку для привлечения пользователей.
                    </p>
                    <Link to="/admin/utm/new" className="mt-4">
                        <Button className="h-10 rounded-xl px-5 gap-1.5">
                            <PlusIcon className="size-4" />
                            Создать ссылку
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {links.map((link) => {
                        const fullUrl = `${window.location.origin}/utm/${link.code}`;
                        const isCopied = copiedId === link.id;
                        return (
                            <div
                                key={link.id}
                                className="rounded-2xl border border-gray-200 bg-card shadow-sm shadow-black/2"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[14px] font-semibold text-foreground font-mono">
                                                /utm/{link.code}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(link.id, link.code)}
                                                className="shrink-0 rounded-lg p-1 text-muted-foreground/40 transition-colors hover:text-primary"
                                                title="Скопировать ссылку"
                                            >
                                                {isCopied ? (
                                                    <CheckIcon className="size-4 text-emerald-500" />
                                                ) : (
                                                    <ClipboardDocumentIcon className="size-4" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="text-[12px] text-muted-foreground">
                                            <span className="font-medium text-foreground">{link.promptTemplateName}</span>
                                            {" · "}
                                            <span className="font-medium text-foreground">{link.chatPresetName}</span>
                                            {" · "}
                                            {link.visits} переходов
                                        </div>
                                        <div className="mt-1 text-[11px] text-muted-foreground/60 truncate">
                                            {fullUrl}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => deleteMutation.mutate(link.id)}
                                        disabled={deleteMutation.isPending}
                                        className="shrink-0 rounded-lg p-2 text-muted-foreground/40 transition-all hover:bg-red-50 hover:text-red-500"
                                        title="Деактивировать"
                                    >
                                        <TrashIcon className="size-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

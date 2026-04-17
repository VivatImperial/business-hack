import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/solid";

import { adminUtmQueries, adminUtmMutations } from "@/lib/queries/admin";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { getDisplayError } from "@/shared/lib/get-display-error";
import type { UtmChatPreset } from "@/features/admin/types";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/shared/ui/sheet";

interface AdminUtmPresetStepProps {
    selectedId: number | null;
    onSelect: (id: number) => void;
}

export function AdminUtmPresetStep({ selectedId, onSelect }: AdminUtmPresetStepProps) {
    const queryClient = useQueryClient();
    const { data: presets, isLoading } = useQuery(adminUtmQueries.chatPresets());

    const [sheetOpen, setSheetOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [chatUrls, setChatUrls] = useState<string[]>([]);
    const [chatInput, setChatInput] = useState("");

    const createMutation = useMutation({
        mutationFn: () =>
            adminUtmMutations.createChatPreset({
                name: newName.trim(),
                chatUrls,
            }),
        onSuccess: (created: UtmChatPreset) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "utm", "chat-presets"] });
            setNewName("");
            setChatUrls([]);
            setChatInput("");
            setSheetOpen(false);
            onSelect(created.id);
            snackbarStore.show("Пресет чатов создан");
        },
        onError: (err: Error) => {
            snackbarStore.showError(getDisplayError(err, "Не удалось создать пресет"));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminUtmMutations.deleteChatPreset(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "utm", "chat-presets"] });
            snackbarStore.show("Пресет удалён");
        },
        onError: (err: Error) => {
            snackbarStore.showError(getDisplayError(err, "Не удалось удалить пресет"));
        },
    });

    const handleAddChat = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = chatInput.trim();
        if (!trimmed) return;
        if (chatUrls.includes(trimmed)) {
            snackbarStore.showError("Этот чат уже добавлен");
            return;
        }
        setChatUrls((prev) => [...prev, trimmed]);
        setChatInput("");
    };

    const handleRemoveChat = (url: string) => {
        setChatUrls((prev) => prev.filter((u) => u !== url));
    };

    const canCreate = newName.trim().length > 0 && chatUrls.length > 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner className="size-6" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Existing presets */}
            {presets && presets.length > 0 && (
                <div className="flex flex-col gap-3">
                    {presets.map((p) => {
                        const isSelected = selectedId === p.id;
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => onSelect(p.id)}
                                className={`group relative w-full rounded-2xl border px-5 py-4 text-left transition-all duration-200 ${
                                    isSelected
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-gray-200 bg-card hover:border-gray-300 hover:bg-card/80"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`size-4 shrink-0 rounded-full border-2 transition-colors ${
                                                    isSelected
                                                        ? "border-primary bg-primary"
                                                        : "border-gray-300"
                                                }`}
                                            >
                                                {isSelected && (
                                                    <div className="flex size-full items-center justify-center">
                                                        <div className="size-1.5 rounded-full bg-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="text-[14px] font-semibold text-foreground truncate">
                                                {p.name}
                                            </h4>
                                            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                {p.chatUrls.length} {p.chatUrls.length === 1 ? "чат" : "чатов"}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 ml-6 flex flex-col gap-0.5">
                                            {p.chatUrls.slice(0, 3).map((url) => (
                                                <span
                                                    key={url}
                                                    className="text-[12px] text-muted-foreground truncate"
                                                >
                                                    {url}
                                                </span>
                                            ))}
                                            {p.chatUrls.length > 3 && (
                                                <span className="text-[12px] text-muted-foreground/60">
                                                    +{p.chatUrls.length - 3} ещё
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteMutation.mutate(p.id);
                                        }}
                                        disabled={deleteMutation.isPending}
                                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                                        title="Удалить"
                                    >
                                        <TrashIcon className="size-4" />
                                    </button>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {presets && presets.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border py-8 text-center">
                    <p className="text-[14px] font-medium text-foreground">
                        Нет пресетов чатов
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        Создайте первый пресет.
                    </p>
                </div>
            )}

            {/* Add new — full-width grey button */}
            <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-secondary text-[14px] font-medium text-muted-foreground transition-colors hover:border-gray-400 hover:bg-secondary/80 hover:text-foreground"
            >
                <PlusIcon className="size-4" />
                Добавить пресет
            </button>

            {/* Create modal */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="flex flex-col sm:max-w-xl p-6 pt-8 gap-5 overflow-y-auto">
                    <SheetHeader className="pr-6">
                        <SheetTitle className="text-[18px]">Новый пресет чатов</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-1 flex-col gap-5">
                        <div>
                            <label className="mb-2 block text-[13px] font-medium text-foreground">
                                Название
                            </label>
                            <input
                                type="text"
                                placeholder="Например: Стройка Новосибирск"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                autoFocus
                                className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                            />
                        </div>

                        {/* Add chat one by one */}
                        <div>
                            <label className="mb-2 block text-[13px] font-medium text-foreground">
                                Чаты
                            </label>
                            <form onSubmit={handleAddChat} className="flex gap-2">
                                <Input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="https://t.me/..., @username или ID"
                                    className="h-11 flex-1 rounded-xl"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <PlusIcon className="size-4" />
                                </button>
                            </form>
                        </div>

                        {/* Chat list */}
                        {chatUrls.length > 0 && (
                            <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2">
                                {chatUrls.map((url) => (
                                    <div
                                        key={url}
                                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
                                    >
                                        <span className="text-[13px] text-foreground truncate">
                                            {url}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveChat(url)}
                                            className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground/50 transition-colors hover:bg-red-50 hover:text-red-500"
                                        >
                                            <TrashIcon className="size-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-auto pt-2">
                            <Button
                                type="button"
                                className="h-[48px] w-full rounded-xl text-[15px] font-semibold shrink-0"
                                disabled={!canCreate || createMutation.isPending}
                                onClick={() => createMutation.mutate()}
                            >
                                {createMutation.isPending && <Spinner className="mr-2 size-4" />}
                                Создать пресет ({chatUrls.length} {chatUrls.length === 1 ? "чат" : "чатов"})
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrashIcon, PlusIcon, SparklesIcon } from "@heroicons/react/24/solid";

import { adminUtmQueries, adminUtmMutations } from "@/lib/queries/admin";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { getDisplayError } from "@/shared/lib/get-display-error";
import type { UtmPromptTemplate } from "@/features/admin/types";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/shared/ui/sheet";

interface AdminUtmPromptStepProps {
    selectedId: number | null;
    onSelect: (id: number) => void;
}

export function AdminUtmPromptStep({ selectedId, onSelect }: AdminUtmPromptStepProps) {
    const queryClient = useQueryClient();
    const { data: templates, isLoading } = useQuery(adminUtmQueries.promptTemplates());

    const [sheetOpen, setSheetOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newContent, setNewContent] = useState("");

    const createMutation = useMutation({
        mutationFn: () =>
            adminUtmMutations.createPromptTemplate({
                name: newName.trim(),
                content: newContent.trim(),
            }),
        onSuccess: (created: UtmPromptTemplate) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "utm", "prompt-templates"] });
            setNewName("");
            setNewContent("");
            setSheetOpen(false);
            onSelect(created.id);
            snackbarStore.show("Шаблон промпта создан");
        },
        onError: (err: Error) => {
            snackbarStore.showError(getDisplayError(err, "Не удалось создать шаблон"));
        },
    });

    const improveMutation = useMutation({
        mutationFn: () => adminUtmMutations.improvePrompt(newContent.trim()),
        onSuccess: (improved: string) => {
            setNewContent(improved);
            snackbarStore.show("Промпт улучшен");
        },
        onError: (err: Error) => {
            snackbarStore.showError(getDisplayError(err, "Не удалось улучшить промпт"));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminUtmMutations.deletePromptTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "utm", "prompt-templates"] });
            snackbarStore.show("Шаблон удалён");
        },
        onError: (err: Error) => {
            snackbarStore.showError(getDisplayError(err, "Не удалось удалить шаблон"));
        },
    });

    const canCreate = newName.trim().length > 0 && newContent.trim().length > 0;
    const canImprove = newContent.trim().length > 0 && !improveMutation.isPending;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner className="size-6" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Existing templates */}
            {templates && templates.length > 0 && (
                <div className="flex flex-col gap-3">
                    {templates.map((t) => {
                        const isSelected = selectedId === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => onSelect(t.id)}
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
                                                {t.name}
                                            </h4>
                                        </div>
                                        <p className="mt-1.5 ml-6 text-[13px] text-muted-foreground line-clamp-3">
                                            {t.content}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteMutation.mutate(t.id);
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

            {templates && templates.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border py-8 text-center">
                    <p className="text-[14px] font-medium text-foreground">
                        Нет шаблонов промптов
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        Создайте первый шаблон.
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
                Добавить шаблон
            </button>

            {/* Create modal */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="flex flex-col sm:max-w-xl p-6 pt-8 gap-5 overflow-y-auto">
                    <SheetHeader className="pr-6">
                        <SheetTitle className="text-[18px]">Новый шаблон промпта</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-1 flex-col gap-5">
                        <div>
                            <label className="mb-2 block text-[13px] font-medium text-foreground">
                                Название
                            </label>
                            <input
                                type="text"
                                placeholder="Например: Монтаж отопления"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                autoFocus
                                className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                            />
                        </div>
                        <div className="flex flex-1 flex-col">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-[13px] font-medium text-foreground">
                                    Текст промпта
                                </label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={!canImprove}
                                    onClick={() => improveMutation.mutate()}
                                    className="h-8 gap-1.5 rounded-xl border-dashed px-3 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                                >
                                    {improveMutation.isPending ? (
                                        <Spinner className="size-3.5" />
                                    ) : (
                                        <SparklesIcon className="size-3.5" />
                                    )}
                                    {improveMutation.isPending ? "Улучшаем…" : "Улучшить промпт"}
                                </Button>
                            </div>
                            <textarea
                                placeholder="Опишите своими словами, кого считать клиентом. Например: ищем монтаж отопления в частных домах Новосибирска; вакансии, оффтоп и рекламу пропускать."
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="flex-1 min-h-[240px] w-full rounded-xl border border-border bg-background px-4 py-3 text-[15px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary resize-none"
                            />
                        </div>
                        <Button
                            type="button"
                            className="h-[48px] w-full rounded-xl text-[15px] font-semibold shrink-0"
                            disabled={!canCreate || createMutation.isPending}
                            onClick={() => createMutation.mutate()}
                        >
                            {createMutation.isPending && <Spinner className="mr-2 size-4" />}
                            Создать шаблон
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

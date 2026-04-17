import { useSuspenseQuery } from "@tanstack/react-query";
import { PlusIcon, ArrowTopRightOnSquareIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { GuideHelpButton } from "@/shared/layout/guide-help-button";
import type { TagRecord } from "@/features/tags/types";
import type { TagsListResponse } from "@/lib/api/generated/schemas";
import { TAGS_LIST_DEFAULTS } from "@/features/tags/types";
import { tagsQueries } from "@/lib/queries/tags";
import { settingsQueries } from "@/lib/queries/settings";
import { getRouteApi } from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { ConfirmModal } from "@/shared/ui/confirm-modal";
import { TagsList } from "./tags-list";
import { TagFormSheet } from "./tag-form-sheet";
import { TagsEmptyState } from "./tags-empty-state";
import type { SettingsData, SettingsIssue } from "@/features/settings/types";
import { hasDestinationIssue } from "@/features/settings/lib/issues";
import {
    Tooltip as UiTooltip,
    TooltipContent as UiTooltipContent,
    TooltipTrigger as UiTooltipTrigger,
} from "@/shared/ui/tooltip";
import { useTagsActions } from "../lib/use-tags-actions";
import { Spinner } from "@/shared/ui/spinner";

function getTelegramChatLink(ref: string): string | null {
    if (ref.startsWith("@")) return `https://t.me/${ref.slice(1)}`;
    if (ref.includes("t.me/"))
        return ref.startsWith("http") ? ref : `https://${ref}`;
    return null;
}

const appRoute = getRouteApi("/_app");

export function TagsPage() {
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
    const issues = (settingsData.issues ?? []) as SettingsIssue[];
    const destinationHasIssue = hasDestinationIssue(issues);
    const savedDefaultChat = settingsData.routing.defaultChat || "";

    const actions = useTagsActions(tenantId!);

    const isEmpty = tags.length === 0;

    return (
        <TooltipProvider>
            <div className="relative flex min-w-0 flex-col gap-6">
                <ConfirmModal
                    open={actions.deleteConfirm !== null}
                    title="Удалить тег?"
                    description="Тег будет удалён безвозвратно. Статистика и привязки к лидам сохранятся."
                    confirmLabel="Удалить"
                    onConfirm={() => {
                        if (actions.deleteConfirm !== null) {
                            void actions.handleDelete(actions.deleteConfirm);
                        }
                        actions.setDeleteConfirm(null);
                    }}
                    onCancel={() => actions.setDeleteConfirm(null)}
                />

                <ConfirmModal
                    open={actions.topicsConfirmOpen}
                    title="Включить треды?"
                    description="Конвертируем чат в супергруппу с топиками. Если активные теги уже есть, для них создадутся топики; если тегов пока нет, треды просто включатся без блокировки."
                    confirmLabel="Включить треды"
                    onConfirm={actions.handleTopicsConfirm}
                    onCancel={actions.handleTopicsCancel}
                />

                {isFetching && tags.length > 0 && (
                    <div className="absolute top-2 right-0 z-50 flex items-center gap-2 rounded-xl bg-card/95 backdrop-blur-md px-3.5 py-2 shadow-lg shadow-black/6">
                        <Spinner className="size-3.5 animate-spin text-foreground" />
                        <span className="text-[14px] font-medium text-muted-foreground">
                            Обновление...
                        </span>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="font-heading text-[26px] font-extrabold tracking-tight text-foreground">
                                Мой чат
                            </h1>
                            <GuideHelpButton section="tags" />
                        </div>
                        {savedDefaultChat &&
                            settingsData.routing.defaultChatTitle &&
                            (() => {
                                const link = getTelegramChatLink(savedDefaultChat);
                                return (
                                    <div className="inline-flex max-w-full flex-wrap items-center gap-1.5">
                                        {destinationHasIssue ? (
                                            <>
                                                <span className="max-w-full break-all text-[14px] text-red-500">
                                                    {settingsData.routing.defaultChatTitle}
                                                </span>
                                                <UiTooltip>
                                                    <UiTooltipTrigger asChild>
                                                        <span className="shrink-0 flex items-center justify-center size-5 rounded-full bg-red-50 text-red-500 cursor-help">
                                                            <ExclamationCircleIcon className="size-3.5" />
                                                        </span>
                                                    </UiTooltipTrigger>
                                                    <UiTooltipContent
                                                        side="top"
                                                        className="max-w-[260px] text-[12px]"
                                                    >
                                                        Целевой чат недоступен — вы покинули его или он был удалён.
                                                    </UiTooltipContent>
                                                </UiTooltip>
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
                                                className="inline-flex min-w-0 max-w-full items-center gap-1.5 break-all text-[14px] text-blue-600 transition-colors hover:text-blue-700"
                                            >
                                                <ArrowTopRightOnSquareIcon className="size-3.5 shrink-0" />
                                                <span className="min-w-0 break-all">
                                                    {settingsData.routing.defaultChatTitle}
                                                </span>
                                            </a>
                                        ) : (
                                            <span className="max-w-full break-all text-[14px] text-muted-foreground">
                                                {settingsData.routing.defaultChatTitle}
                                            </span>
                                        )}
                                    </div>
                                );
                            })()}
                    </div>

                    {savedDefaultChat && (
                        <Button
                            variant="outline"
                            onClick={actions.handleCreateNew}
                            className="h-10 self-start gap-2 rounded-xl border-dashed px-5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <PlusIcon className="size-4" />
                            Добавить тег
                        </Button>
                    )}
                </div>

                {isEmpty ? (
                    <TagsEmptyState
                        onCreateTag={actions.handleCreateNew}
                        hasChat={!!savedDefaultChat}
                        onCreateChat={() =>
                            actions.createManagedChatMutation.mutate(tenantId!)
                        }
                        isCreatingChat={actions.createManagedChatMutation.isPending}
                    />
                ) : (
                    <TagsList
                        tags={tags}
                        onToggleActive={(id) => {
                            void actions.handleToggleActive(id);
                        }}
                        onEdit={actions.handleEdit}
                        onDelete={(id) => {
                            actions.setDeleteConfirm(id);
                        }}
                        pendingActions={actions.pendingActions}
                    />
                )}

                <TagFormSheet
                    open={actions.formSheetOpen}
                    onOpenChange={actions.setFormSheetOpen}
                    tag={actions.editingTag}
                    onSubmit={(formData) => actions.handleFormSubmit(formData, savedDefaultChat)}
                    onDelete={(id) => {
                        actions.setDeleteConfirm(id);
                    }}
                    isPending={
                        actions.createMutation.isPending || actions.updateMutation.isPending
                    }
                />
            </div>
        </TooltipProvider>
    );
}

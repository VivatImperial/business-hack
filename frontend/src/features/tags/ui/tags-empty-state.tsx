import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { TagIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/solid";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

interface TagsEmptyStateProps {
    onCreateTag: () => void;
    hasChat: boolean;
    onCreateChat?: () => void;
    isCreatingChat?: boolean;
}

export function TagsEmptyState({ onCreateTag, hasChat, onCreateChat, isCreatingChat }: TagsEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6">
                {hasChat ? (
                    <TagIcon className="size-16 text-primary" />
                ) : (
                    <ChatBubbleLeftIcon className="size-16 text-primary" />
                )}
            </div>

            {hasChat ? (
                <>
                    <h3 className="text-[20px] font-bold text-foreground mb-2 tracking-tight">
                        Чат готов, добавьте теги
                    </h3>
                    <p className="max-w-[380px] text-[14px] text-muted-foreground leading-relaxed mb-6">
                        Добавьте теги для классификации входящих сообщений.
                        Нейросеть будет автоматически распределять лиды по категориям.
                    </p>
                    <Button
                        onClick={onCreateTag}
                        className="h-12 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-8 transition-colors font-medium text-[15px]"
                    >
                        Добавить тег
                        <ArrowRightIcon className="size-4" />
                    </Button>
                </>
            ) : (
                <>
                    <h3 className="text-[20px] font-bold text-foreground mb-2 tracking-tight">
                        Сначала настройте чат
                    </h3>
                    <p className="max-w-[380px] text-[14px] text-muted-foreground leading-relaxed mb-6">
                        Чтобы создавать теги, сначала создайте целевой
                        чат в Telegram.
                    </p>
                    {onCreateChat && (
                        <Button
                            onClick={onCreateChat}
                            disabled={isCreatingChat}
                            className="h-12 px-6 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-[15px]"
                        >
                            {isCreatingChat && <Spinner className="size-4 animate-spin" />}
                            Создать чат в Telegram
                        </Button>
                    )}
                </>
            )}
        </div>
    );
}

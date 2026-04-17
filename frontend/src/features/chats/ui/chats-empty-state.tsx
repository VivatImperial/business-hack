import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import { Button } from "@/shared/ui/button";

export function ChatsEmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6">
                <ChatBubbleLeftRightIcon className="size-16 text-primary" />
            </div>

            <h3 className="text-[20px] font-bold text-foreground mb-2 tracking-tight">
                Добавьте первый чат
            </h3>
            <p className="max-w-[380px] text-[14px] text-muted-foreground leading-relaxed mb-6">
                Укажите чаты и каналы для мониторинга. Нейросеть будет
                анализировать сообщения и находить лидов.
            </p>

            <Button
                onClick={onAdd}
                className="h-12 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-8 transition-colors font-medium text-[15px]"
            >
                Добавить чат
                <ArrowRightIcon className="size-4" />
            </Button>
        </div>
    );
}

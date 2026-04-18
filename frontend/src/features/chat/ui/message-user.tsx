import type { ChatMessage } from "@/features/chat/lib/chat-store";

export function MessageUser({ message }: { message: ChatMessage }) {
    return (
        <div className="flex justify-end animate-fade-in-up">
            <div className="max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-3 shadow-card whitespace-pre-wrap text-[15px] leading-relaxed">
                {message.content}
            </div>
        </div>
    );
}

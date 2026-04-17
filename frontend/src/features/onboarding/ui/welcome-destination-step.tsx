import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import {
    FaceSmileIcon,
    ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";
import { motion, springPop } from "@/shared/animations/motion";

interface WelcomeDestinationStepProps {
    defaultChat: string;
    defaultChatTitle?: string;
}

function getTelegramChatLink(ref: string): string | null {
    if (!ref) return null;
    if (ref.startsWith("@")) return `https://t.me/${ref.slice(1)}`;
    if (ref.includes("t.me/"))
        return ref.startsWith("http") ? ref : `https://${ref}`;
    return null;
}

export function WelcomeDestinationStep({
    defaultChat,
    defaultChatTitle,
}: WelcomeDestinationStepProps) {
    const hasChat = !!defaultChat;
    const link = hasChat ? getTelegramChatLink(defaultChat) : null;

    if (hasChat) {
        return (
            <div className="flex w-full flex-col items-center gap-4 py-6 text-center">
                <FaceSmileIcon className="size-12 text-amber-500" />
                <div>
                    <h3 className="text-[15px] font-semibold text-foreground">
                        Чат для лидов готов
                    </h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        Сюда Пульсар будет складывать найденные лиды
                    </p>
                </div>
                {link ? (
                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                        <ArrowTopRightOnSquareIcon className="size-4 text-primary" />
                        {defaultChatTitle || defaultChat}
                    </a>
                ) : (
                    <span className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-foreground">
                        {defaultChatTitle || defaultChat}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col items-center py-4">
            <motion.div
                variants={springPop}
                initial="hidden"
                animate="show"
                className="relative mb-6 flex items-center justify-center text-primary"
            >
                <ChatBubbleLeftRightIcon className="relative z-10 size-16" />
            </motion.div>
        </div>
    );
}

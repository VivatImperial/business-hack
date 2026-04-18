import { AssistantAvatar } from "@/shared/ui/assistant-avatar";
import {
    motion,
    scaleFadeIn,
    blurFadeUp,
    staggerContainerDelayed,
} from "@/shared/animations/motion";

interface ChatEmptyProps {
    onSuggest: (text: string) => void;
    disabled?: boolean;
}

const SUGGESTIONS = [
    "Как подключиться к корпоративной сети по VPN?",
    "Отчёт в 1С выдаёт не те данные за период.",
    "Забыл пароль от внутренней почты, что делать?",
    "Какие документы нужны для сброса 2FA?",
];

export function ChatEmpty({ onSuggest, disabled }: ChatEmptyProps) {
    return (
        <motion.div
            variants={staggerContainerDelayed(0.08, 0.02)}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center gap-6 py-10 text-center"
        >
            <motion.div variants={scaleFadeIn}>
                <AssistantAvatar size={88} pulse />
            </motion.div>
            <motion.div
                variants={scaleFadeIn}
                className="flex max-w-md flex-col gap-2"
            >
                <h2 className="text-2xl font-semibold text-foreground">
                    Задайте вопрос ассистенту
                </h2>
                <p className="text-sm text-muted-foreground">
                    Ассистент отвечает на вопросы по инцидентам, ИТ, 1С и
                    внутренним сервисам «Балтийский Берег».
                </p>
            </motion.div>
            <motion.div
                variants={staggerContainerDelayed(0.06, 0.15)}
                className="grid w-full max-w-lg gap-2 sm:grid-cols-2"
            >
                {SUGGESTIONS.map((s) => (
                    <motion.button
                        key={s}
                        variants={blurFadeUp}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSuggest(s)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="rounded-xl border border-[var(--brand-border)] bg-card px-4 py-3 text-left text-[14px] text-foreground transition-colors hover:bg-[var(--brand-cream)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {s}
                    </motion.button>
                ))}
            </motion.div>
        </motion.div>
    );
}

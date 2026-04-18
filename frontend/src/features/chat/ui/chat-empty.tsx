import { Link } from "@tanstack/react-router";
import { useListRequestsApiV1ClientRequestsGet } from "@/lib/api/generated/client-requests/client-requests";
import { AssistantAvatar } from "@/shared/ui/assistant-avatar";
import { motion, listFadeUp } from "@/shared/animations/motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

interface ChatEmptyProps {
    onSuggest: (text: string) => void;
    disabled?: boolean;
}

const SUGGESTIONS = [
    "Не подключается удалённый доступ из дома, что проверить сначала?",
    "В принтере закончился тонер, что делать?",
    "Не печатает принтер, что можно проверить сначала?",
    "Отчёт в 1С выдаёт не те данные за период.",
];

export function ChatEmpty({ onSuggest, disabled }: ChatEmptyProps) {
    const requestsQuery = useListRequestsApiV1ClientRequestsGet(undefined, {
        query: {
            staleTime: 30_000,
        },
    });

    const sessions =
        requestsQuery.data?.status === 200
            ? requestsQuery.data.data.items
            : [];

    return (
        <div className="flex flex-col gap-6 py-4 md:py-10 w-full">
            {/* Desktop view: Avatar and suggestions */}
            <div className="hidden md:flex flex-col items-center gap-6 text-center">
                <AssistantAvatar size={88} pulse />
                <div className="flex max-w-md flex-col gap-2">
                    <h2 className="text-2xl font-semibold text-foreground">
                        Задайте вопрос ассистенту
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Ассистент отвечает на вопросы по инцидентам, ИТ, 1С и
                        внутренним сервисам «Балтийский Берег».
                    </p>
                </div>
                <motion.div
                    variants={{
                        hidden: {},
                        show: { transition: { staggerChildren: 0.05 } },
                    }}
                    initial="hidden"
                    animate="show"
                    className="grid w-full max-w-lg gap-2 sm:grid-cols-2"
                >
                    {SUGGESTIONS.map((s) => (
                        <motion.button
                            key={s}
                            variants={listFadeUp}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSuggest(s)}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.99 }}
                            className="rounded-xl border border-[var(--brand-border)] bg-card px-4 py-3 text-left text-[14px] text-foreground transition-colors hover:bg-[var(--brand-cream)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {s}
                        </motion.button>
                    ))}
                </motion.div>
            </div>

            {/* Mobile view: List of chats */}
            <div className="flex flex-col md:hidden w-full px-2">
                <h2 className="mb-4 text-xl font-semibold text-foreground px-1">
                    Мои чаты
                </h2>
                <div className="flex flex-col gap-2 w-full">
                    {requestsQuery.isLoading ? (
                        <>
                            <Skeleton className="h-16 w-full rounded-2xl" />
                            <Skeleton className="h-16 w-full rounded-2xl" />
                            <Skeleton className="h-16 w-full rounded-2xl" />
                        </>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 py-10 text-center">
                            <AssistantAvatar size={64} pulse />
                            <p className="text-sm text-muted-foreground">
                                Пока нет обращений. Напишите первый вопрос внизу.
                            </p>
                        </div>
                    ) : (
                        sessions.map((session) => {
                            const title =
                                session.title ||
                                session.description?.slice(0, 60) ||
                                "Обращение";
                            const dotClass =
                                session.status === "closed"
                                    ? "bg-emerald-500"
                                    : session.status === "in_progress"
                                      ? "bg-[var(--brand-dark)]"
                                      : "bg-amber-400";
                            return (
                                <Link
                                    key={session.id}
                                    to="/chat/$chatId"
                                    params={{ chatId: session.id }}
                                    className={cn(
                                        "flex items-center gap-4 rounded-2xl border border-[var(--brand-border)] bg-card px-4 py-4 transition-colors hover:bg-[var(--brand-cream)] w-full",
                                        session.status === "closed" && "opacity-80"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "size-3 shrink-0 rounded-full",
                                            dotClass,
                                        )}
                                        aria-hidden
                                    />
                                    <span className="line-clamp-2 min-w-0 flex-1 text-[15px] font-medium text-foreground text-left">
                                        {title}
                                    </span>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

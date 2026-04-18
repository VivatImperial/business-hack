import {
    ExclamationTriangleIcon,
    DocumentTextIcon,
    InboxIcon,
} from "@heroicons/react/24/solid";

import type { ChatMessage, ChatCitation } from "@/features/chat/lib/chat-store";
import { cn } from "@/lib/utils";

export function MessageAssistant({ message }: { message: ChatMessage }) {
    const pending = message.pending === true;

    return (
        <div className="flex gap-3 animate-fade-in-up">
            <div className="shrink-0 size-9 rounded-full bg-white flex items-center justify-center overflow-hidden p-1.5 shadow-sm ring-1 ring-border">
                <img
                    src="/images/layout/logo.webp"
                    alt="Ассистент"
                    className="w-full h-auto object-contain"
                />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="rounded-2xl bg-card px-4 py-3 shadow-card text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                    {pending ? (
                        <TypingDots />
                    ) : (
                        <Markdown text={message.content} />
                    )}
                </div>
                {!pending && message.escalated && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-200 rounded-xl px-3 py-2">
                        <ExclamationTriangleIcon className="size-4" />
                        Вопрос передан менеджеру
                    </div>
                )}
                {!pending &&
                    message.citations &&
                    message.citations.length > 0 && (
                        <CitationsList citations={message.citations} />
                    )}
            </div>
        </div>
    );
}

function CitationsList({ citations }: { citations: ChatCitation[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {citations.map((c) => {
                const Icon =
                    c.kind === "article" ? DocumentTextIcon : InboxIcon;
                const label =
                    c.kind === "article"
                        ? "Статья"
                        : c.kind === "ticket"
                          ? "Заявка"
                          : "Источник";
                const content = (
                    <>
                        <Icon className="size-3.5" />
                        <span className="text-[12px] text-muted-foreground uppercase tracking-wide">
                            {label}
                        </span>
                        <span className="text-[13px] text-foreground truncate max-w-[220px]">
                            {c.title}
                        </span>
                    </>
                );
                return c.url ? (
                    <a
                        key={c.source_id}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary hover:bg-accent transition-colors px-2.5 py-1.5"
                    >
                        {content}
                    </a>
                ) : (
                    <span
                        key={c.source_id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5"
                    >
                        {content}
                    </span>
                );
            })}
        </div>
    );
}

// Minimal markdown renderer: bold (**...**) and ordered lists.
// Intentionally lightweight; can be replaced with react-markdown later.
function Markdown({ text }: { text: string }) {
    const lines = text.split("\n");
    return (
        <>
            {lines.map((line, idx) => (
                <LineView key={idx} line={line} />
            ))}
        </>
    );
}

function LineView({ line }: { line: string }) {
    const orderedMatch = /^(\d+)\.\s+(.*)$/.exec(line);
    if (orderedMatch) {
        return (
            <div className="flex gap-2">
                <span className="text-muted-foreground font-medium shrink-0">
                    {orderedMatch[1]}.
                </span>
                <InlineView text={orderedMatch[2]} />
            </div>
        );
    }
    if (line.trim() === "") {
        return <div className="h-2" />;
    }
    return <InlineView text={line} />;
}

function InlineView({ text }: { text: string }) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
        <span>
            {parts.map((part, idx) => {
                const bold = /^\*\*([^*]+)\*\*$/.exec(part);
                if (bold) {
                    return (
                        <strong key={idx} className="font-semibold">
                            {bold[1]}
                        </strong>
                    );
                }
                return <span key={idx}>{part}</span>;
            })}
        </span>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-1">
            <Dot delay={0} />
            <Dot delay={0.15} />
            <Dot delay={0.3} />
        </div>
    );
}

function Dot({ delay }: { delay: number }) {
    return (
        <span
            className={cn(
                "inline-block size-2 rounded-full bg-muted-foreground/50 animate-soft-pulse",
            )}
            style={{ animationDelay: `${delay}s` }}
        />
    );
}

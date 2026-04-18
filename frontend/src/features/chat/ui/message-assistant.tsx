import type { ClientRequestMessageResponse } from "@/lib/api/generated/schemas";
import { cn } from "@/lib/utils";
import { AssistantAvatar } from "@/shared/ui/assistant-avatar";
import { motion } from "@/shared/animations/motion";

interface MessageAssistantProps {
    message?: ClientRequestMessageResponse;
    pending?: boolean;
    /** Index in the list, used to stagger the reveal. */
    index?: number;
}

export function MessageAssistant({
    message,
    pending,
    index = 0,
}: MessageAssistantProps) {
    const isPending = pending === true || !message;
    const delay = Math.min(index * 0.05, 0.35);

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.24,
                ease: [0.25, 0.1, 0.25, 1],
                delay,
            }}
            className="flex gap-3"
        >
            <AssistantAvatar size={40} pulse={isPending} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="whitespace-pre-wrap rounded-2xl border border-[var(--brand-border)] bg-card px-4 py-3 text-[15px] leading-relaxed text-foreground">
                    {isPending ? (
                        <TypingDots />
                    ) : (
                        <Markdown text={message!.text} />
                    )}
                </div>
            </div>
        </motion.div>
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
                <span className="shrink-0 font-medium text-muted-foreground">
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
                "inline-block size-2 animate-soft-pulse rounded-full bg-muted-foreground/50",
            )}
            style={{ animationDelay: `${delay}s` }}
        />
    );
}

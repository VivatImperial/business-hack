import { useMemo, useState } from "react";
import type { ClientRequestMessageResponse } from "@/lib/api/generated/schemas";
import { cn } from "@/lib/utils";
import { AssistantAvatar } from "@/shared/ui/assistant-avatar";
import { motion } from "@/shared/animations/motion";

type MessageCitation = {
    source_type: string;
    source_id: string;
    title?: string | null;
    snippet?: string | null;
};

type AssistantMessage = ClientRequestMessageResponse & {
    citations?: MessageCitation[];
};

interface MessageAssistantProps {
    message?: AssistantMessage;
    pending?: boolean;
    /** Index in the list, used to stagger the reveal. */
    index?: number;
    onOpenSource?: (citation: MessageCitation) => void;
    sourceLoadingId?: string | null;
}

export function MessageAssistant({
    message,
    pending,
    index = 0,
    onOpenSource,
    sourceLoadingId,
}: MessageAssistantProps) {
    const isPending = pending === true || !message;
    const delay = Math.min(index * 0.05, 0.35);
    const citations = message?.citations ?? [];
    const bodyText = useMemo(() => stripSourcesBlock(message?.text ?? ""), [message?.text]);

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
                        <>
                            <Markdown text={bodyText} />
                            {citations.length > 0 && onOpenSource ? (
                                <SourceList
                                    citations={citations}
                                    onOpenSource={onOpenSource}
                                    sourceLoadingId={sourceLoadingId}
                                />
                            ) : null}
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function stripSourcesBlock(text: string): string {
    const marker = "\n**Источники:**";
    const index = text.indexOf(marker);
    if (index === -1) {
        return text;
    }
    return text.slice(0, index).trimEnd();
}

function SourceList({
    citations,
    onOpenSource,
    sourceLoadingId,
}: {
    citations: MessageCitation[];
    onOpenSource?: (citation: MessageCitation) => void;
    sourceLoadingId?: string | null;
}) {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);
    const interactive = typeof onOpenSource === "function";
    return (
        <div className="mt-3 border-t border-border/60 pt-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Источники
            </div>
            <div className="flex flex-wrap gap-2">
                {citations.map((citation, index) => (
                    <button
                        key={`${citation.source_id}-${index}`}
                        type="button"
                        onClick={() => {
                            if (interactive) {
                                onOpenSource(citation);
                                return;
                            }
                            setActiveIndex((prev) => (prev === index ? null : index));
                        }}
                        className={cn(
                            "rounded-full border px-3 py-1 text-left text-xs transition-colors",
                            interactive && sourceLoadingId === citation.source_id
                                ? "border-[var(--brand-sage-deep)] bg-[var(--brand-cream)] text-[var(--brand-ink)]"
                                : activeIndex === index
                                ? "border-[var(--brand-sage-deep)] bg-[var(--brand-cream)] text-[var(--brand-ink)]"
                                : "border-border/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                        )}
                    >
                        [{index + 1}] {citation.title || citation.source_id}
                        {interactive ? " ->" : ""}
                    </button>
                ))}
            </div>
            {!interactive && activeIndex !== null && citations[activeIndex] ? (
                <div className="mt-3 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">
                            {citations[activeIndex].title || citations[activeIndex].source_id}
                        </span>
                        <span className="rounded-full bg-background px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                            {citations[activeIndex].source_type}
                        </span>
                    </div>
                    <div className="mb-2 text-xs text-muted-foreground">
                        {citations[activeIndex].source_id}
                    </div>
                    <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--brand-text)]">
                        {citations[activeIndex].snippet || "Фрагмент источника недоступен."}
                    </div>
                </div>
            ) : null}
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

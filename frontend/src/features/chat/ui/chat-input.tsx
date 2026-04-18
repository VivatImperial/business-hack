import {
    type FormEvent,
    type KeyboardEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    onSend: (text: string) => void | Promise<void>;
    disabled?: boolean;
    autoFocus?: boolean;
}

export function ChatInput({ onSend, disabled, autoFocus }: ChatInputProps) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (autoFocus) {
            textareaRef.current?.focus();
        }
    }, [autoFocus]);

    const resize = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "0px";
        const next = Math.min(el.scrollHeight, 240);
        el.style.height = `${next}px`;
    };

    useEffect(resize, [value]);

    const submit = (e?: FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        const text = value.trim();
        if (!text || disabled) return;
        void onSend(text);
        setValue("");
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const empty = value.trim().length === 0;

    return (
        <form
            onSubmit={submit}
            className={cn(
                "flex items-end gap-2 bg-card rounded-2xl shadow-card px-4 py-3 ring-1 ring-border",
                "focus-within:ring-navy-300 transition-shadow",
            )}
        >
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Напишите вопрос ассистенту…"
                rows={1}
                disabled={disabled}
                className="flex-1 resize-none bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted-foreground/60 max-h-60"
            />
            <button
                type="submit"
                disabled={empty || disabled}
                className={cn(
                    "inline-flex items-center justify-center size-10 rounded-xl transition-all",
                    "bg-primary text-primary-foreground hover:bg-[var(--brand-dark-2)]",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "active:scale-95",
                )}
                aria-label="Отправить"
            >
                <PaperAirplaneIcon className="size-4" />
            </button>
        </form>
    );
}

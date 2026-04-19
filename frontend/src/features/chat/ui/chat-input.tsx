import {
    type FormEvent,
    type KeyboardEvent,
    type ClipboardEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    PaperAirplaneIcon,
    PhotoIcon,
    XMarkIcon,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

export type RecognizedOcrAsset = {
    text: string;
    upload_key: string;
    image_url: string;
    file_name?: string | null;
};

export type ChatInputSubmitPayload = {
    text: string;
    ocrUploadKey?: string;
    imageUrl?: string;
    imageName?: string | null;
};

interface ChatInputProps {
    onSend: (payload: ChatInputSubmitPayload) => void | Promise<void>;
    onRecognizeImage?: (file: File) => Promise<RecognizedOcrAsset>;
    disabled?: boolean;
    autoFocus?: boolean;
}

export function ChatInput({
    onSend,
    onRecognizeImage,
    disabled,
    autoFocus,
}: ChatInputProps) {
    const [value, setValue] = useState("");
    const [ocrPending, setOcrPending] = useState(false);
    const [ocrNotice, setOcrNotice] = useState<string | null>(null);
    const [ocrError, setOcrError] = useState<string | null>(null);
    const [ocrAsset, setOcrAsset] = useState<RecognizedOcrAsset | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (!text || disabled || ocrPending) return;
        void onSend({
            text,
            ocrUploadKey: ocrAsset?.upload_key,
            imageUrl: ocrAsset?.image_url,
            imageName: ocrAsset?.file_name,
        });
        setValue("");
        setOcrAsset(null);
        setOcrNotice(null);
        setOcrError(null);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const appendRecognizedText = async (file: File) => {
        if (!onRecognizeImage || disabled || ocrPending) return;
        setOcrPending(true);
        setOcrNotice(`Распознаю ${file.name}...`);
        setOcrError(null);
        try {
            const recognized = await onRecognizeImage(file);
            const text = recognized.text.trim();
            setValue((prev) =>
                prev.trim()
                    ? `${prev.trimEnd()}\n\n${text}`
                    : text,
            );
            setOcrAsset(recognized);
            setOcrNotice(`Текст из ${file.name} добавлен, скрин сохранится в истории.`);
        } catch (error) {
            setOcrNotice(null);
            setOcrError(
                error instanceof Error
                    ? error.message
                    : "Не удалось распознать изображение",
            );
            setOcrAsset(null);
        } finally {
            setOcrPending(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
        if (!onRecognizeImage) return;
        const imageItem = Array.from(event.clipboardData.items).find((item) =>
            item.type.startsWith("image/"),
        );
        if (!imageItem) return;
        const file = imageItem.getAsFile();
        if (!file) return;
        event.preventDefault();
        void appendRecognizedText(file);
    };

    const empty = value.trim().length === 0;

    return (
        <form
            onSubmit={submit}
            className={cn(
                "rounded-2xl bg-card px-4 py-3 shadow-card ring-1 ring-border transition-shadow",
                "focus-within:ring-navy-300",
            )}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                        void appendRecognizedText(file);
                    }
                }}
            />
            <div className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    placeholder="Напишите вопрос ассистенту…"
                    rows={1}
                    disabled={disabled || ocrPending}
                    className="max-h-60 flex-1 resize-none bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                {onRecognizeImage ? (
                    <button
                        type="button"
                        disabled={disabled || ocrPending}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "inline-flex size-10 items-center justify-center rounded-xl border border-border/60 text-foreground transition-all",
                            "hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-40",
                        )}
                        aria-label="Распознать текст с изображения"
                        title="Вставить скриншот или выбрать изображение"
                    >
                        <PhotoIcon className="size-4" />
                    </button>
                ) : null}
                <button
                    type="submit"
                    disabled={empty || disabled || ocrPending}
                    className={cn(
                        "inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all",
                        "hover:bg-[var(--brand-dark-2)] disabled:cursor-not-allowed disabled:opacity-40",
                        "active:scale-95",
                    )}
                    aria-label="Отправить"
                >
                    <PaperAirplaneIcon className="size-4" />
                </button>
            </div>
            {ocrAsset && !ocrError ? (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-foreground">
                    <span className="truncate">
                        Скрин {ocrAsset.file_name || "ocr-image"} будет отправлен вместе с сообщением
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setOcrAsset(null);
                            setOcrNotice(null);
                        }}
                        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Убрать OCR-скрин"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                </div>
            ) : null}
            {(ocrNotice || ocrError) && (
                <div
                    className={cn(
                        "mt-2 text-xs",
                        ocrError ? "text-red-500" : "text-muted-foreground",
                    )}
                >
                    {ocrError || ocrNotice}
                </div>
            )}
        </form>
    );
}

import { cn } from "@/lib/utils";

interface TelegramQrInstructionsProps {
    className?: string;
}

const dotClass =
    "shrink-0 size-7 rounded-full bg-[#3390ec] text-white text-[13px] font-semibold flex items-center justify-center";

const itemClass = "flex items-start gap-3 text-[16px] text-foreground/80";

/**
 * Centered three-step instruction list for connecting Telegram via QR.
 * The list auto-shrinks to its content width and is centered horizontally,
 * matching the Telegram Web login screen visual rhythm.
 */
export function TelegramQrInstructions({
    className,
}: TelegramQrInstructionsProps) {
    return (
        <ol
            className={cn(
                "flex flex-col max-w-[320px] gap-3 mx-auto w-fit",
                className,
            )}
        >
            <li className={itemClass}>
                <span className={dotClass}>1</span>
                Откройте Telegram на телефоне
            </li>
            <li className={itemClass}>
                <span className={dotClass}>2</span>
                <span>
                    Откройте настройки{" "}
                    <span className="text-muted-foreground mx-0.5">&rarr;</span>{" "}
                    Устройства{" "}
                    <span className="text-muted-foreground mx-0.5">&rarr;</span>{" "}
                    Подключить
                </span>
            </li>
            <li className={itemClass}>
                <span className={dotClass}>3</span>
                Наведите камеру на этот QR-код
            </li>
        </ol>
    );
}

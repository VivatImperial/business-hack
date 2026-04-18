import * as React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

interface FloatingInputProps extends React.ComponentProps<"input"> {
    label: string;
    id: string;
    error?: string | null;
    hint?: string;
}

/**
 * Form input with a static label above (Telegram-style). Chosen over a
 * floating label because browser autofill + React controlled state don't
 * play well together — a static label looks correct in every state:
 * empty / typed / autofilled / focused / error.
 */
export const FloatingInput = React.forwardRef<
    HTMLInputElement,
    FloatingInputProps
>(
    (
        {
            className,
            label,
            id,
            disabled,
            error,
            hint,
            ...props
        },
        ref,
    ) => {
        const hasError = Boolean(error);

        return (
            <div className="space-y-1.5">
                <label
                    htmlFor={id}
                    className={cn(
                        "block pl-1 text-[12px] font-medium transition-colors",
                        hasError
                            ? "text-[#b4453a]"
                            : "text-[var(--brand-text-dim)]",
                    )}
                >
                    {label}
                </label>
                <input
                    ref={ref}
                    id={id}
                    disabled={disabled}
                    aria-invalid={hasError || undefined}
                    aria-describedby={
                        hasError
                            ? `${id}-error`
                            : hint
                              ? `${id}-hint`
                              : undefined
                    }
                    className={cn(
                        "h-11 w-full rounded-md border bg-white px-3.5 text-[14px] text-[var(--brand-dark)] placeholder:text-[var(--brand-text-dim)]/60",
                        hasError
                            ? "border-[#b4453a] focus:border-[#b4453a]"
                            : "border-[var(--brand-border)] focus:border-[var(--brand-dark)]",
                        "outline-none transition-colors",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                        // neutralize Chrome/Safari autofill yellow/blue bg
                        "[-webkit-text-fill-color:var(--brand-dark)] [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--brand-dark)]",
                        className,
                    )}
                    {...props}
                />
                {hasError ? (
                    <p
                        id={`${id}-error`}
                        className="flex items-start gap-1.5 pl-1 text-[12px] leading-relaxed text-[#b4453a]"
                    >
                        <ExclamationCircleIcon className="mt-px size-3.5 shrink-0" />
                        <span>{error}</span>
                    </p>
                ) : hint ? (
                    <p
                        id={`${id}-hint`}
                        className="pl-1 text-[12px] leading-relaxed text-[var(--brand-text-dim)]"
                    >
                        {hint}
                    </p>
                ) : null}
            </div>
        );
    },
);
FloatingInput.displayName = "FloatingInput";

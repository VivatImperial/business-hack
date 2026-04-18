import * as React from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

const CLEARABLE_TYPES = new Set(["text", "search", undefined]);

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, value, onChange, inputMode, ...props }, ref) => {
        const showClear =
            CLEARABLE_TYPES.has(type) &&
            inputMode !== "numeric" &&
            value !== undefined &&
            value !== "";

        const handleClear = () => {
            const nativeEvent = new Event("input", { bubbles: true });
            onChange?.({
                ...nativeEvent,
                target: { value: "" },
                currentTarget: { value: "" },
            } as unknown as React.ChangeEvent<HTMLInputElement>);
        };

        return (
            <div className="relative w-full">
                <input
                    type={type}
                    inputMode={inputMode}
                    value={value}
                    onChange={onChange}
                    className={cn(
                        "flex h-11 w-full overflow-hidden rounded-xl border border-[var(--brand-border)] bg-white px-4 py-2 text-[14px] text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-[var(--brand-accent)] focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
                        showClear && "pr-9",
                        className,
                    )}
                    ref={ref}
                    {...props}
                />
                {showClear && (
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={handleClear}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full bg-muted-foreground/15 text-muted-foreground/60 hover:bg-muted-foreground/25 hover:text-muted-foreground transition-colors"
                    >
                        <XMarkIcon className="size-3.5" />
                    </button>
                )}
            </div>
        );
    },
);
Input.displayName = "Input";

export { Input };

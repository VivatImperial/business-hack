import type { ReactNode } from "react";

interface InfoBannerProps {
    title: string;
    description: string | ReactNode;
    image?: string;
    action?: ReactNode;
    variant?: "default" | "warning" | "success" | "error";
    layout?: "horizontal" | "vertical" | "inline";
}

const variantStyles = {
    default: "bg-gradient-to-br from-blue-500/10 to-indigo-500/5",
    warning: "bg-gradient-to-br from-amber-500/10 to-orange-500/5",
    success: "bg-gradient-to-br from-emerald-500/10 to-teal-500/5",
    error: "bg-gradient-to-br from-red-500/10 to-rose-500/5",
} as const;

const variantAccent = {
    default: "text-blue-600",
    warning: "text-amber-600",
    success: "text-emerald-600",
    error: "text-red-600",
} as const;

export function InfoBanner({
    title,
    description,
    image,
    action,
    variant = "default",
    layout = "horizontal",
}: InfoBannerProps) {
    if (layout === "vertical") {
        return (
            <div
                className={`relative flex flex-col justify-between rounded-2xl p-6 min-h-[385px] overflow-hidden ${variantStyles[variant]}`}
            >
                <div className="flex flex-col gap-3 relative z-10">
                    <h3
                        className={`text-base font-semibold tracking-tight ${variantAccent[variant]}`}
                    >
                        {title}
                    </h3>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </div>
                    {action && <div className="mt-1">{action}</div>}
                </div>
                {image && (
                    <div className="self-end mt-4 -mb-3 -mr-3 size-[140px] shrink-0 relative z-0 opacity-80">
                        <img
                            src={image}
                            alt=""
                            className="size-full object-contain drop-shadow-lg"
                        />
                    </div>
                )}
            </div>
        );
    }

    if (layout === "inline") {
        return (
            <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl px-5 py-4 ${variantStyles[variant]}`}
            >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h3
                        className={`text-sm font-semibold tracking-tight ${variantAccent[variant]}`}
                    >
                        {title}
                    </h3>
                    <span className="hidden sm:block text-muted-foreground/30">
                        /
                    </span>
                    <div className="text-sm text-muted-foreground">
                        {description}
                    </div>
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        );
    }

    return (
        <div
            className={`relative flex items-start sm:items-center justify-between gap-6 rounded-2xl px-6 py-5 overflow-hidden ${variantStyles[variant]}`}
        >
            <div className="flex-1 min-w-0 flex flex-col gap-2 relative z-10">
                <h3
                    className={`text-[15px] font-semibold tracking-tight ${variantAccent[variant]}`}
                >
                    {title}
                </h3>
                <div className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                </div>
                {action && <div className="mt-1">{action}</div>}
            </div>
            {image && (
                <div className="shrink-0 size-[100px] relative z-0 opacity-80">
                    <img
                        src={image}
                        alt=""
                        className="size-full object-contain drop-shadow-lg"
                    />
                </div>
            )}
        </div>
    );
}

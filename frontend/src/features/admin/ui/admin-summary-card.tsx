import { cn } from "@/lib/utils";

export function SummaryCard({
    title,
    value,
    hint,
    className,
}: {
    title: string;
    value: string | number;
    hint: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex h-full min-h-[104px] flex-col justify-between rounded-2xl border border-gray-200 bg-card p-4 shadow-sm shadow-black/2",
                className,
            )}
        >
            <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                    {title}
                </div>
                <div className="mt-1.5 font-heading text-[22px] font-extrabold leading-none tracking-tight text-foreground">
                    {value}
                </div>
                <div className="mt-2 text-[12px] leading-snug text-muted-foreground">
                    {hint}
                </div>
            </div>
        </div>
    );
}

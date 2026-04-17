import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { ru } from "react-day-picker/locale";
import { cn } from "@/lib/utils";

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: DayPickerProps) {
    return (
        <DayPicker
            locale={ru}
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row gap-2",
                month: "flex flex-col gap-4",
                month_caption:
                    "flex justify-center pt-1 relative items-center text-[13px] font-medium text-foreground",
                caption_label: "text-[13px] font-medium capitalize",
                nav: "flex items-center gap-1",
                button_previous:
                    "absolute left-1 top-0 size-7 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                button_next:
                    "absolute right-1 top-0 size-7 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday:
                    "text-muted-foreground/60 w-8 font-normal text-[11px] uppercase",
                week: "flex w-full mt-1",
                day: "relative p-0 text-center text-[13px] focus-within:relative focus-within:z-20",
                day_button: cn(
                    "inline-flex size-8 items-center justify-center rounded-xl font-normal transition-colors",
                    "hover:bg-muted hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                ),
                selected:
                    "bg-foreground text-background hover:bg-foreground hover:text-background rounded-xl",
                today: "font-semibold text-foreground",
                outside: "text-muted-foreground/30",
                disabled: "text-muted-foreground/20 pointer-events-none",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) =>
                    orientation === "left" ? (
                        <ChevronLeftIcon className="size-3.5" />
                    ) : (
                        <ChevronRightIcon className="size-3.5" />
                    ),
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };

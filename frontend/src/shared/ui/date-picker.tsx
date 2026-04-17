import { useState } from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/solid";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { cn } from "@/lib/utils";

dayjs.locale("ru");

interface DatePickerProps {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Выберите дату",
    className,
    disabled,
}: DatePickerProps) {
    const [open, setOpen] = useState(false);

    const formatted = value
        ? dayjs(value).format("D MMMM YYYY")
        : null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={disabled}>
                <button
                    type="button"
                    className={cn(
                        "flex h-10 w-full items-center justify-between whitespace-nowrap rounded-xl border-none bg-secondary px-3 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary/80 outline-none focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
                        !value && "text-muted-foreground/40",
                        className,
                    )}
                >
                    <span className="truncate">
                        {formatted ?? placeholder}
                    </span>
                    <CalendarDaysIcon className="size-4 opacity-50 shrink-0 ml-2" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-auto p-0 rounded-xl border border-gray-200 bg-white shadow-lg shadow-black/8"
            >
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => {
                        onChange(date);
                        setOpen(false);
                    }}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    );
}

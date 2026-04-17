import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import type {
    TagRecord,
    TagColor,
    CreateTagInput,
} from "@/features/tags/types";
import { TAG_COLORS } from "@/features/tags/types";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/shared/ui/sheet";
import { TrashIcon } from "@heroicons/react/24/solid";
import { Spinner } from "@/shared/ui/spinner";

const tagSchema = z.object({
    name: z.string().trim().min(1, "Название обязательно").max(50),
    color: z.enum([
        "blue",
        "green",
        "purple",
        "amber",
        "red",
        "cyan",
        "pink",
        "gray",
    ] as const),
    rule: z.string().trim().min(1, "Правило обязательно"),
});

type TagFormValues = z.infer<typeof tagSchema>;

const COLOR_OPTIONS: { value: TagColor; label: string }[] = [
    { value: "blue", label: "Синий" },
    { value: "green", label: "Зелёный" },
    { value: "purple", label: "Фиолетовый" },
    { value: "amber", label: "Жёлтый" },
    { value: "red", label: "Красный" },
    { value: "cyan", label: "Голубой" },
    { value: "pink", label: "Розовый" },
    { value: "gray", label: "Серый" },
];

interface TagFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tag: TagRecord | null;
    onSubmit: (data: CreateTagInput) => void;
    onDelete?: (id: number) => void;
    isPending: boolean;
    side?: "right" | "bottom";
}

export function TagFormSheet({
    open,
    onOpenChange,
    tag,
    onSubmit,
    onDelete,
    isPending,
    side = "right",
}: TagFormSheetProps) {
    const isEditing = !!tag;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<TagFormValues>({
        resolver: zodResolver(tagSchema),
        defaultValues: {
            name: "",
            color: "blue",
            rule: "",
        },
    });

    const selectedColor = watch("color");

    useEffect(() => {
        if (tag) {
            reset({
                name: tag.name,
                color: tag.color,
                rule: tag.description,
            });
        } else {
            reset({
                name: "",
                color: "blue",
                rule: "",
            });
        }
    }, [tag, open, reset]);

    const onFormSubmit = (values: TagFormValues) => {
        onSubmit({
            name: values.name,
            description: values.rule,
            color: values.color,
            group: "custom",
            keywords: [],
            linkedPromptId: null,
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={side}
                className={
                    side === "bottom"
                        ? "flex border-0 flex-col p-0 rounded-t-[20px] max-h-[93dvh] shadow-2xl"
                        : "flex flex-col p-0 sm:max-w-[440px] sm:rounded-l-[24px] border-0 shadow-2xl"
                }
            >
                <TooltipProvider>
                    <SheetHeader className="px-8 pt-8 pb-6">
                        <SheetTitle className="text-[22px] font-semibold text-foreground">
                            {isEditing ? "Редактировать тег" : "Новый тег"}
                        </SheetTitle>
                        <SheetDescription className="text-[15px] text-muted-foreground/80 mt-1">
                            {isEditing
                                ? "Измените параметры тега. Статистика сохранится."
                                : "Создайте тег для категоризации входящих сообщений."}
                        </SheetDescription>
                    </SheetHeader>

                    <form
                        onSubmit={handleSubmit(onFormSubmit)}
                        className="flex flex-1 flex-col overflow-y-auto"
                    >
                        <div className="flex flex-col gap-7 px-8">
                            {/* Name */}
                            <fieldset className="flex flex-col gap-2.5">
                                <label className="text-[15px] font-medium text-foreground/90">
                                    Название
                                </label>
                                <Input
                                    placeholder="Например: Разработка"
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <span className="text-[14px] text-red-500">
                                        {errors.name.message}
                                    </span>
                                )}
                            </fieldset>

                            {/* Color */}
                            <fieldset className="flex flex-col gap-3">
                                <label className="text-[15px] font-medium text-foreground/90">
                                    Цвет
                                </label>
                                <div className="flex items-center gap-2.5">
                                    {COLOR_OPTIONS.map((opt) => {
                                        const isSelected =
                                            selectedColor === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                title={opt.label}
                                                className={`relative flex size-8 items-center justify-center rounded-full transition-all duration-200 ${isSelected ? "ring-4 ring-blue-500/20 scale-110" : "hover:scale-110 hover:bg-black/[0.05]"}`}
                                                onClick={() =>
                                                    setValue("color", opt.value)
                                                }
                                            >
                                                <span
                                                    className="size-5 rounded-full shadow-sm"
                                                    style={{
                                                        backgroundColor:
                                                            TAG_COLORS[
                                                                opt.value
                                                            ].dot,
                                                    }}
                                                />
                                                {isSelected && (
                                                    <span className="absolute inset-0 flex items-center justify-center">
                                                        <span className="size-2 rounded-full bg-white shadow-sm" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </fieldset>

                            {/* Rule (prompt) */}
                            <fieldset className="flex flex-col gap-2.5">
                                <label className="text-[15px] font-medium text-foreground/90">
                                    Правило
                                </label>
                                <textarea
                                    placeholder="Опишите, какие сообщения должны попадать в этот тег..."
                                    {...register("rule")}
                                    rows={3}
                                    className="flex w-full rounded-xl bg-black/3 hover:bg-black/5 focus:bg-background border border-transparent focus:border-blue-500/30 px-4 py-3 text-[15px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 resize-none"
                                />
                                {errors.rule && (
                                    <span className="text-[14px] text-red-500">
                                        {errors.rule.message}
                                    </span>
                                )}
                                <span className="text-[14px] text-muted-foreground/70 leading-relaxed">
                                    ИИ будет использовать это правило для
                                    автоматической разметки сообщений.
                                </span>
                            </fieldset>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto px-8 py-6 flex items-center gap-3 bg-card/80 backdrop-blur-md sticky bottom-0">
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="flex-1 h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/20 transition-all duration-200"
                            >
                                {isPending ? (
                                    <>
                                        <Spinner className="mr-2 size-4 animate-spin" />
                                        Сохранение...
                                    </>
                                ) : isEditing ? (
                                    "Сохранить изменения"
                                ) : (
                                    "Добавить тег"
                                )}
                            </Button>
                            {isEditing && onDelete && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                onDelete(tag.id);
                                                onOpenChange(false);
                                            }}
                                            className="h-12 w-12 p-0 flex items-center justify-center rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 shrink-0"
                                        >
                                            <TrashIcon className="size-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Удалить тег</TooltipContent>
                                </Tooltip>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="h-12 rounded-xl px-6 text-foreground/60 hover:text-foreground hover:bg-black/[0.04] transition-all duration-200"
                            >
                                Отмена
                            </Button>
                        </div>
                    </form>
                </TooltipProvider>
            </SheetContent>
        </Sheet>
    );
}

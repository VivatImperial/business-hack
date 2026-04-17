import { createPortal } from "react-dom";
import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Button } from "./button";

interface ConfirmModalProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    open,
    title,
    description,
    confirmLabel = "Удалить",
    cancelLabel = "Отмена",
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onCancel]);

    if (!open) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 animate-in fade-in duration-150"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-[400px] rounded-[32px] border border-border/40 bg-[#f4f4f5] text-popover-foreground overflow-hidden animate-in zoom-in-95 fade-in duration-150 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative flex items-center justify-center px-4 pt-4 pb-4">
                    <button
                        onClick={onCancel}
                        className="absolute left-4 flex size-8 items-center justify-center rounded-full bg-white shadow-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <XMarkIcon className="size-4" />
                    </button>
                    <h3 className="text-base font-semibold">{title}</h3>
                </div>

                {/* Body */}
                <div className="px-4 pb-4">
                    <div className="bg-white rounded-[24px] p-5 shadow-sm">
                        <p className="text-sm text-muted-foreground leading-relaxed text-center">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-3 px-4 pb-4">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="h-12 flex-1 rounded-full bg-white shadow-sm text-sm font-medium hover:bg-gray-50"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="h-12 flex-1 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm text-sm font-medium"
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

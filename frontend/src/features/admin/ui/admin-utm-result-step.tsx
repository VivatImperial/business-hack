import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ClipboardDocumentIcon,
    CheckIcon,
} from "@heroicons/react/24/solid";

import { adminUtmMutations } from "@/lib/queries/admin";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { getDisplayError } from "@/shared/lib/get-display-error";

interface AdminUtmResultStepProps {
    promptTemplateId: number;
    chatPresetId: number;
    promptTemplateName: string;
    chatPresetName: string;
}

export function AdminUtmResultStep({
    promptTemplateId,
    chatPresetId,
    promptTemplateName,
    chatPresetName,
}: AdminUtmResultStepProps) {
    const queryClient = useQueryClient();
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const createMutation = useMutation({
        mutationFn: () =>
            adminUtmMutations.createLink({ promptTemplateId, chatPresetId }),
        onSuccess: (link) => {
            const url = `${window.location.origin}/utm/${link.code}`;
            setGeneratedUrl(url);
            queryClient.invalidateQueries({ queryKey: ["admin", "utm", "links"] });
            snackbarStore.show("UTM-ссылка создана");
        },
        onError: (err: Error) => {
            snackbarStore.showError(getDisplayError(err, "Не удалось создать ссылку"));
        },
    });

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Summary */}
            <div className="rounded-2xl border border-gray-200 bg-card px-5 py-4">
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Параметры ссылки
                </h4>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[13px]">
                        <span className="text-muted-foreground">Промпт:</span>
                        <span className="font-medium text-foreground">{promptTemplateName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px]">
                        <span className="text-muted-foreground">Чаты:</span>
                        <span className="font-medium text-foreground">{chatPresetName}</span>
                    </div>
                </div>

                <div className="mt-4">
                    {generatedUrl ? (
                        <div className="flex items-center gap-2">
                            <div className="flex-1 rounded-xl bg-secondary px-4 py-2.5 text-[13px] font-medium text-foreground break-all select-all">
                                {generatedUrl}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 shrink-0 rounded-xl px-3"
                                onClick={() => handleCopy(generatedUrl)}
                            >
                                {copied ? (
                                    <CheckIcon className="size-4 text-emerald-500" />
                                ) : (
                                    <ClipboardDocumentIcon className="size-4" />
                                )}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            className="h-10 w-full rounded-xl text-[14px]"
                            disabled={createMutation.isPending}
                            onClick={() => createMutation.mutate()}
                        >
                            {createMutation.isPending && <Spinner className="mr-2 size-4" />}
                            Сгенерировать ссылку
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

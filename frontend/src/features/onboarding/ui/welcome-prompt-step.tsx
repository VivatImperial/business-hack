import { PromptsEditor } from "@/shared/ui/prompts-editor";
import type { UsePromptsEditorReturn } from "@/shared/lib/use-prompts-editor";

interface WelcomePromptStepProps {
    editor: UsePromptsEditorReturn;
}

export function WelcomePromptStep({ editor }: WelcomePromptStepProps) {
    return (
        <div className="flex w-full flex-col items-center py-1">
            <PromptsEditor editor={editor} hideStatusBanner className="w-full" />
        </div>
    );
}

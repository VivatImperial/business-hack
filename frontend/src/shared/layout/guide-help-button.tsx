import { Link } from "@tanstack/react-router";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";

export function GuideHelpButton({ section }: { section: string }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        to="/guide"
                        hash={section}
                        className="inline-flex items-center justify-center size-8 rounded-xl text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                        <QuestionMarkCircleIcon className="size-[18px]" />
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Справка по разделу</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

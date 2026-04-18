import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Button } from "@/shared/ui/button";

export function NotFoundPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 text-center">
            <div className="flex max-w-md flex-col items-center">
                <div className="font-heading mb-4 text-[140px] font-bold leading-none tracking-tight text-[var(--brand-dark)]">
                    404
                </div>
                <h1 className="font-heading mb-2 text-[22px] font-semibold tracking-tight text-[var(--brand-dark)]">
                    Страница не найдена
                </h1>
                <p className="mb-8 max-w-xs text-[14px] leading-relaxed text-[var(--brand-text)]">
                    Кажется, вы перешли по неверной ссылке. Возможно, адрес
                    введён неверно или страница была удалена.
                </p>
                <Link to="/">
                    <Button className="h-11 cursor-pointer rounded-md border border-[var(--brand-dark)] bg-[var(--brand-dark)] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[var(--brand-dark-2)]">
                        <ArrowLeftIcon className="mr-2 size-4" />
                        На главную
                    </Button>
                </Link>
            </div>
        </div>
    );
}

import { ArrowPathIcon, HomeIcon } from "@heroicons/react/24/solid";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, Link } from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";

export function RouteErrorFallback() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const handleRetry = () => {
        queryClient.invalidateQueries();
        router.invalidate();
    };

    return (
        <div className="flex h-full min-h-[60svh] flex-col items-center justify-center bg-background p-8 text-center">
            <div className="flex max-w-md flex-col items-center">
                <div className="mb-6 flex size-20 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-cream)] text-[32px] font-semibold text-[var(--brand-dark)]">
                    500
                </div>
                <h2 className="font-heading mb-2 text-[20px] font-semibold tracking-tight text-[var(--brand-dark)]">
                    Не удалось загрузить страницу
                </h2>
                <p className="mb-6 max-w-sm text-[14px] leading-relaxed text-[var(--brand-text)]">
                    Что-то пошло не так. Попробуйте обновить — если проблема
                    повторится, напишите на{" "}
                    <a
                        href="mailto:it@baltbereg.ru"
                        className="font-medium text-[var(--brand-dark)] underline underline-offset-2"
                    >
                        it@baltbereg.ru
                    </a>
                    .
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleRetry}
                        className="h-10 cursor-pointer rounded-md border border-[var(--brand-dark)] bg-[var(--brand-dark)] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--brand-dark-2)]"
                    >
                        <ArrowPathIcon className="mr-1.5 size-4" />
                        Попробовать снова
                    </Button>
                    <Link to="/dashboard">
                        <Button
                            variant="outline"
                            className="h-10 cursor-pointer rounded-md border-[var(--brand-border)] px-5 text-[14px] font-medium text-[var(--brand-dark)] hover:bg-[var(--brand-cream)]"
                        >
                            <HomeIcon className="mr-1.5 size-4" />
                            В админку
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { Button } from "@/shared/ui/button";

export const Route = createFileRoute("/$")({
    component: NotFoundPage,
});

function NotFoundPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: "oklch(0.975 0.008 245)" }}>
            <div className="flex flex-col items-center max-w-lg">
                <img
                    src="/images/errors/error-404.png"
                    alt=""
                    className="w-80 h-auto mb-8 drop-shadow-lg"
                />
                <h1 className="font-heading text-[24px] font-extrabold text-foreground mb-2 tracking-tight">
                    Страница не найдена
                </h1>
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-xs">
                    Кажется, вы заблудились. Такой страницы не существует — возможно, она была удалена или адрес введён неверно.
                </p>
                <div className="flex items-center gap-3">
                    <Link to="/dashboard">
                        <Button className="h-11 px-6 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all font-medium shadow-sm">
                            <ArrowLeftIcon className="mr-2 size-4" />
                            На главную
                        </Button>
                    </Link>
                    <Link to="/leads">
                        <Button
                            variant="outline"
                            className="h-11 px-6 rounded-xl font-medium"
                        >
                            <MagnifyingGlassIcon className="mr-2 size-4" />
                            К лидам
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

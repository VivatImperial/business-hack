import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Button } from "@/shared/ui/button";

export function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-svh bg-background p-6 text-center animate-fade-in-up">
            <div className="max-w-md flex flex-col items-center">
                <div className="text-[120px] font-black text-primary/10 leading-none select-none mb-4">
                    404
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">
                    Страница не найдена
                </h1>
                <p className="text-muted-foreground mb-8">
                    Кажется, вы перешли по неверной ссылке или страница была удалена.
                </p>
                <Button asChild className="h-12 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-navy-800 transition-colors">
                    <Link to="/dashboard">
                        <ArrowLeftIcon className="mr-2 size-4" />
                        Вернуться на главную
                    </Link>
                </Button>
            </div>
        </div>
    );
}

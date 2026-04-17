import {
    ArrowPathIcon,
    ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";
import { MANAGER_CONTACT_URL } from "@/shared/config/contact";

const TG_MANAGER = MANAGER_CONTACT_URL;

export function RouteErrorFallback() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const handleRetry = () => {
        queryClient.invalidateQueries();
        router.invalidate();
    };

    return (
        <div className="flex flex-col h-full  md:min-h-[calc(100svh-240px)] rounded-xl bg-background p-8 relative">
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="flex flex-col items-center max-w-md">
                    <img
                        src="/images/errors/error-500.png"
                        alt=""
                        className="w-64 h-auto mb-6 drop-shadow-lg"
                    />
                    <h2 className="font-heading text-[20px] font-extrabold text-foreground mb-1.5 tracking-tight">
                        Не удалось загрузить страницу
                    </h2>
                    <p className="text-[14px] text-muted-foreground leading-relaxed mb-6 max-w-xs">
                        Мы уже знаем о проблеме и скоро её починим. Попробуйте
                        обновить или напишите менеджеру.
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRetry}
                            className="h-10 px-5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all font-medium text-[14px]"
                        >
                            <ArrowPathIcon className="mr-1.5 size-4" />
                            Попробовать снова
                        </Button>
                        <a href={TG_MANAGER} target="_blank" rel="noreferrer">
                            <Button
                                variant="outline"
                                className="h-10 px-5 rounded-xl font-medium text-[14px]"
                            >
                                <ChatBubbleLeftRightIcon className="mr-1.5 size-4" />
                                Менеджер
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { ComputerDesktopIcon } from "@heroicons/react/24/solid";
const emptyStateSrc = "/images/leads/empty-state.png";

export function MobileLeadsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center gap-4">
            <img
                src={emptyStateSrc}
                alt=""
                className="w-36 h-36 object-contain opacity-80"
            />
            <h2 className="font-heading text-[18px] font-bold tracking-tight text-foreground">
                Лиды доступны на компьютере
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[280px]">
                Канбан-доска работает в десктопной версии
            </p>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-[14px] font-medium text-muted-foreground">
                <ComputerDesktopIcon className="size-4" />
                Откройте на компьютере
            </div>
        </div>
    );
}

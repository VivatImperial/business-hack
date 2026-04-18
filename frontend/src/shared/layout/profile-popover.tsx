import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "@tanstack/react-router";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/ui/popover";
import { useMe } from "@/lib/use-me";
import { removeToken, removeRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

function getInitials(login: string): string {
    const letters = login.replace(/[^a-zA-Zа-яА-Я]/g, "");
    if (!letters) return "?";
    if (letters.length === 1) return letters[0].toUpperCase();
    return (letters[0] + letters[1]).toUpperCase();
}

export function ProfilePopover({ trigger }: { trigger?: React.ReactNode }) {
    const navigate = useNavigate();
    const { login, isAdmin } = useMe();
    const initials = login ? getInitials(login) : "??";

    const onLogout = () => {
        removeToken();
        removeRole();
        navigate({ to: "/login" });
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                {trigger || (
                    <button
                        type="button"
                        className={cn(
                            "w-full flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors",
                            "hover:bg-sidebar-accent text-sidebar-foreground",
                        )}
                    >
                        <div className="size-9 rounded-full bg-sky-500/30 text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 text-left truncate">
                            <div className="text-[13px] font-medium text-sidebar-accent-foreground truncate">
                                {login || "—"}
                            </div>
                        </div>
                    </button>
                )}
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-56 p-1">
                <div className="flex items-center gap-3 px-3 py-2.5 mb-1 border-b border-border/50">
                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {initials}
                    </div>
                    <div className="flex flex-col truncate">
                        <span className="text-sm font-medium text-foreground truncate">
                            {login || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                            {isAdmin ? "Администратор" : "Сотрудник"}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                    <ArrowRightStartOnRectangleIcon className="size-4 text-muted-foreground" />
                    Выйти
                </button>
            </PopoverContent>
        </Popover>
    );
}

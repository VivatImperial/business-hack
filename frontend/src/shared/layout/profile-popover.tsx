import type { ReactNode } from "react";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/solid";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/ui/popover";
import { removeToken, removeTenantId, getToken, getTenantId } from "@/lib/auth";
import { authQueries } from "@/lib/queries/auth";
import { useQuery } from "@tanstack/react-query";

function getInitials(name: string): string {
    return name
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0].toUpperCase())
        .join("");
}

export function ProfilePopover({ trigger }: { trigger: ReactNode }) {
    const token = getToken();
    const tenantId = getTenantId();
    const { data } = useQuery({
        ...authQueries.me(token!),
        enabled: !!token,
    });
    const displayName = data?.displayName || data?.username || "user";
    const avatarUrl = data?.avatarUrl;
    const initials = getInitials(displayName) || "U";

    const handleLogout = () => {
        removeToken();
        removeTenantId();
        window.location.href = "/login";
    };

    return (
        <Popover>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent side="right" align="end" className="w-64">
                <div className="flex flex-col items-center text-center gap-4">
                    <Avatar className="size-16">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                        <AvatarFallback className="bg-blue-500/10 text-blue-500 text-xl font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-0.5">
                        <p className="text-base font-semibold">{displayName}</p>
                        {tenantId && (
                            <p className="text-xs text-muted-foreground font-mono">
                                Tenant #{tenantId}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/60 px-4 py-2.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10"
                    >
                        <ArrowRightStartOnRectangleIcon className="size-4" />
                        <span>Выйти</span>
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

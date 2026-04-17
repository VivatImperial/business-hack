import {
    BuildingOffice2Icon,
    CheckIcon,
    ChevronUpDownIcon,
} from "@heroicons/react/24/solid";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useTenantSwitcher } from "./use-tenant-switcher";
import { Spinner } from "@/shared/ui/spinner";

export function MobileTenantSwitcher() {
    const {
        open,
        handleOpen,
        tenants,
        loading,
        currentTenantId,
        currentTenant,
        handleSelect,
    } = useTenantSwitcher();

    return (
        <Popover open={open} onOpenChange={handleOpen}>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-secondary/60 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary">
                    <BuildingOffice2Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate max-w-[120px]">
                        {currentTenant?.name ?? "Проект"}
                    </span>
                    <ChevronUpDownIcon className="h-3 w-3 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-64 rounded-xl p-2"
                align="end"
                sideOffset={8}
            >
                <div className="flex flex-col gap-1">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Ваши проекты
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Spinner className="size-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : tenants.length === 0 ? (
                        <div className="text-center py-4 text-xs text-muted-foreground">
                            Нет проектов
                        </div>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-1">
                            {tenants.map((tenant) => {
                                const isActive = tenant.id === currentTenantId;
                                return (
                                    <button
                                        key={tenant.id}
                                        onClick={() => handleSelect(tenant)}
                                        className={`flex items-center gap-2 w-full rounded-xl px-2 py-2 text-left transition-colors ${
                                            isActive
                                                ? "bg-blue-500/10 text-blue-600"
                                                : "hover:bg-muted"
                                        }`}
                                    >
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-sm font-medium truncate">
                                                {tenant.name}
                                            </span>
                                        </div>
                                        {isActive && (
                                            <CheckIcon className="h-4 w-4 text-blue-500 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

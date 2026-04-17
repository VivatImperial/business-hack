import {
    HeartIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/shared/ui/tooltip";
import { Input } from "@/shared/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";
import type {
    LeadsListParams,
    LeadsStatusFilter,
} from "@/features/leads/types";

type LeadsToolbarProps = {
    filters: Required<LeadsListParams>;
    availableTags: string[];
    availableSources: string[];
    onFiltersChange: (patch: Partial<LeadsListParams>) => void;
    onResetFilters: () => void;
};

const STATUS_PRESETS: {
    label: string;
    value: LeadsStatusFilter;
    icon?: React.ReactNode;
}[] = [
    { label: "Все", value: "all" },
    {
        label: "Избранное",
        value: "favorites",
        icon: <HeartIcon className="size-3" />,
    },
];

export function LeadsToolbar({
    filters,
    availableTags,
    availableSources,
    onFiltersChange,
    onResetFilters,
}: LeadsToolbarProps) {
    const [localSearch, setLocalSearch] = useState(filters.search);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    useEffect(() => {
        setLocalSearch(filters.search);
    }, [filters.search]);

    const handleSearchChange = (value: string) => {
        setLocalSearch(value);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onFiltersChange({ search: value, page: 1 });
        }, 300);
    };

    useEffect(() => {
        return () => clearTimeout(debounceRef.current);
    }, []);

    const hasActiveFilters =
        filters.tag !== "all" ||
        filters.source !== "all" ||
        filters.status !== "all";

    return (
        <TooltipProvider>
            <div className="flex flex-wrap items-center gap-3">
                {/* Search — soft input */}
                <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-20" />
                    <Input
                        type="text"
                        placeholder="Поиск по лидам..."
                        className="h-9 w-56 rounded-xl bg-secondary pl-9 pr-3.5 text-[13px] font-medium placeholder:text-muted-foreground/40 transition-all duration-200 hover:bg-secondary/80 focus:bg-secondary/80"
                        value={localSearch}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>

                {/* Tag filter — badge style */}
                <FilterBadge
                    value={filters.tag}
                    options={["all", ...availableTags]}
                    labels={{ all: "Все теги" }}
                    onChange={(value) =>
                        onFiltersChange({ tag: value, page: 1 })
                    }
                />

                {/* Source filter — badge style */}
                <FilterBadge
                    value={filters.source}
                    options={["all", ...availableSources]}
                    labels={{
                        all: "Все источники",
                        ...Object.fromEntries(
                            availableSources.map((s) => [
                                s,
                                formatSourceLabel(s),
                            ]),
                        ),
                    }}
                    onChange={(value) =>
                        onFiltersChange({ source: value, page: 1 })
                    }
                />

                {/* Favorites filter — badge toggle */}
                {STATUS_PRESETS.filter((s) => s.value !== "all").map(
                    (preset) => {
                        const isActive = filters.status === preset.value;
                        return (
                            <button
                                key={preset.value}
                                type="button"
                                className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium transition-all duration-200 ${
                                    isActive
                                        ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                }`}
                                onClick={() =>
                                    onFiltersChange({
                                        status: isActive ? "all" : preset.value,
                                        page: 1,
                                    })
                                }
                            >
                                {preset.icon}
                                {preset.label}
                            </button>
                        );
                    },
                )}

                {/* Reset */}
                {hasActiveFilters && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={onResetFilters}
                                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground"
                            >
                                <XMarkIcon className="size-3" />
                                Сбросить
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Сбросить все фильтры</TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
}

function formatSourceLabel(source: string): string {
    if (!source || source === "all") return source;
    if (source.startsWith("@")) return source;
    const tmeMatch = source.match(/t\.me\/([^/?]+)/);
    if (tmeMatch) return `@${tmeMatch[1]}`;
    if (/^-?\d+$/.test(source)) return `ID ${source}`;
    return source;
}

/* ── Badge-style filter (no border, gray bg, blue when active) ── */

type FilterBadgeProps = {
    value: string;
    options: string[];
    labels?: Record<string, string>;
    onChange: (value: string) => void;
};

function FilterBadge({ value, options, labels, onChange }: FilterBadgeProps) {
    const isActive = value !== "all" && value !== options[0];
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger
                className={`h-9 w-[160px] border-transparent bg-secondary px-3 py-1 text-[13px] font-medium transition-all duration-200 focus:ring-0 focus:ring-offset-0 ${
                    isActive
                        ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                        : "text-muted-foreground hover:text-foreground"
                }`}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option} value={option}>
                        {labels?.[option] ?? option}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { Button } from "@/shared/ui/button";

type LeadsPaginationProps = {
    page: number;
    pageSize: 25 | 50 | 100;
    totalPages: number;
    filteredTotal: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: 25 | 50 | 100) => void;
};

export function LeadsPagination({
    page,
    pageSize,
    totalPages,
    filteredTotal,
    onPageChange,
    onPageSizeChange,
}: LeadsPaginationProps) {
    if (filteredTotal === 0) {
        return null;
    }

    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, filteredTotal);

    return (
        <div className="flex items-center justify-between px-1 py-2">
            <span className="text-xs text-muted-foreground">
                {start}–{end} из {filteredTotal}
            </span>

            <div className="flex items-center gap-2">
                <select
                    className="h-7 rounded-xl bg-muted/60 px-2 text-xs text-foreground outline-none"
                    value={pageSize}
                    onChange={(event) =>
                        onPageSizeChange(
                            Number(event.target.value) as 25 | 50 | 100,
                        )
                    }
                >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-xl"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                    >
                        <ChevronLeftIcon className="size-4" />
                    </Button>
                    <span className="min-w-12 text-center text-xs text-muted-foreground">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-xl"
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                    >
                        <ChevronRightIcon className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

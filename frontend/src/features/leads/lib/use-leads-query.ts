import { useCallback, useEffect, useMemo, useRef } from "react";
import {
    useQueryClient,
    useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type {
    LeadsListParams,
    LeadsListResponse,
} from "@/features/leads/types";
import { leadsQueries } from "@/lib/queries/leads";

export function useLeadsQuery(
    tenantId: number,
    filters: Required<LeadsListParams>,
) {
    const queryClient = useQueryClient();

    const {
        data: infiniteDataRaw,
        isFetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useSuspenseInfiniteQuery(leadsQueries.infiniteList(tenantId, filters));

    const infiniteData = infiniteDataRaw as InfiniteData<LeadsListResponse>;

    const leads = useMemo(
        () =>
            infiniteData?.pages.flatMap((p: LeadsListResponse) => p.leads) ??
            [],
        [infiniteData],
    );

    const lastPage = infiniteData?.pages[infiniteData.pages.length - 1];
    const total = lastPage?.total ?? 0;
    const availableTags = lastPage?.availableTags ?? [];
    const availableSources = lastPage?.availableSources ?? [];

    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    void fetchNextPage();
                }
            },
            { rootMargin: "200px" },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const invalidateLeadsList = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["leads"] });
    }, [queryClient]);

    return {
        leads,
        total,
        availableTags,
        availableSources,
        isFetching,
        isFetchingNextPage,
        hasNextPage,
        sentinelRef,
        invalidateLeadsList,
    };
}

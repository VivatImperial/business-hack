import {
    infiniteQueryOptions,
    keepPreviousData,
    queryOptions,
} from "@tanstack/react-query";
import type {
    LeadsListParams,
    LeadsListResponse,
} from "@/features/leads/types";
import { LEADS_LIST_DEFAULTS } from "@/features/leads/types";
import {
    listLeadsFrontendApiTenantsTenantIdLeadsGet,
    markLeadViewedApiTenantsTenantIdLeadsLeadIdMarkViewedPost,
    setLeadInProgressApiTenantsTenantIdLeadsLeadIdSetInProgressPost,
    rejectLeadApiTenantsTenantIdLeadsLeadIdRejectPost,
    toggleLeadFavoriteApiTenantsTenantIdLeadsLeadIdToggleFavoritePost,
    reportIrrelevantLeadApiTenantsTenantIdLeadsLeadIdReportIrrelevantPost,
    bulkUpdateLeadsApiTenantsTenantIdLeadsBulkUpdatePost,
    exportLeadsApiTenantsTenantIdLeadsExportPost,
} from "../api/generated/leads/leads";
import type {
    ListLeadsFrontendApiTenantsTenantIdLeadsGetParams,
    BulkUpdateInput,
    ExportLeadsInput,
} from "../api/generated/schemas";

export function normalizeLeadsListParams(
    params?: LeadsListParams,
): Required<LeadsListParams> {
    return {
        ...LEADS_LIST_DEFAULTS,
        ...(params ?? {}),
    };
}

/** Map frontend camelCase params to backend snake_case */
function toApiParams(
    params: Required<LeadsListParams>,
): ListLeadsFrontendApiTenantsTenantIdLeadsGetParams {
    return {
        page: params.page,
        page_size: params.pageSize,
        search: params.search || undefined,
        status: params.status === "all" ? undefined : params.status,
        tag: params.tag === "all" ? undefined : params.tag,
        source: params.source === "all" ? undefined : params.source,
        period: params.period === "all" ? undefined : params.period,
        sort_by: params.sortBy,
        sort_dir: params.sortDir,
    };
}

export const leadsQueries = {
    baseKey: ["leads"] as const,
    listKey: (params?: LeadsListParams) =>
        ["leads", "list", normalizeLeadsListParams(params)] as const,
    list: (tenantId: number, params?: LeadsListParams) => {
        const normalized = normalizeLeadsListParams(params);
        return queryOptions({
            queryKey: leadsQueries.listKey(normalized),
            queryFn: async (): Promise<LeadsListResponse> => {
                const res = await listLeadsFrontendApiTenantsTenantIdLeadsGet(
                    tenantId,
                    toApiParams(normalized),
                );
                return res.data as LeadsListResponse;
            },
        });
    },
    infiniteList: (tenantId: number, params?: LeadsListParams) => {
        const normalized = normalizeLeadsListParams(params);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { page, ...filterParams } = normalized;
        return infiniteQueryOptions({
            queryKey: ["leads", "infinite", filterParams] as const,
            queryFn: async ({ pageParam }): Promise<LeadsListResponse> => {
                const res = await listLeadsFrontendApiTenantsTenantIdLeadsGet(
                    tenantId,
                    toApiParams({ ...normalized, page: pageParam }),
                );
                return res.data as LeadsListResponse;
            },
            initialPageParam: 1,
            getNextPageParam: (lastPage) => {
                return lastPage.page < lastPage.totalPages
                    ? lastPage.page + 1
                    : undefined;
            },
            placeholderData: keepPreviousData,
        });
    },
};

export type LeadAction = "in_progress" | "favorite" | "rejected" | "none";

export const leadsMutations = {
    setAction: async (
        tenantId: number,
        data: { id: number; action: LeadAction },
    ) => {
        const { customFetch } = await import("../api/client");
        const res = await customFetch<{ data: unknown }>(
            `/api/tenants/${tenantId}/leads/${data.id}/set-action`,
            { method: "POST", body: JSON.stringify({ action: data.action }) },
        );
        return res.data;
    },
    markViewed: async (tenantId: number, data: { id: number }) => {
        const res =
            await markLeadViewedApiTenantsTenantIdLeadsLeadIdMarkViewedPost(
                tenantId,
                data.id,
            );
        return res.data;
    },
    setInProgress: async (tenantId: number, data: { id: number }) => {
        const res =
            await setLeadInProgressApiTenantsTenantIdLeadsLeadIdSetInProgressPost(
                tenantId,
                data.id,
            );
        return res.data;
    },
    reject: async (tenantId: number, data: { id: number; reason: string }) => {
        const res = await rejectLeadApiTenantsTenantIdLeadsLeadIdRejectPost(
            tenantId,
            data.id,
            { reason: data.reason },
        );
        return res.data;
    },
    toggleFavorite: async (tenantId: number, data: { id: number }) => {
        const res =
            await toggleLeadFavoriteApiTenantsTenantIdLeadsLeadIdToggleFavoritePost(
                tenantId,
                data.id,
            );
        return res.data;
    },
    reportIrrelevant: async (tenantId: number, data: { id: number }) => {
        const res =
            await reportIrrelevantLeadApiTenantsTenantIdLeadsLeadIdReportIrrelevantPost(
                tenantId,
                data.id,
            );
        return res.data;
    },
    bulkUpdate: async (tenantId: number, data: BulkUpdateInput) => {
        const res = await bulkUpdateLeadsApiTenantsTenantIdLeadsBulkUpdatePost(
            tenantId,
            data,
        );
        return res.data;
    },
    export: async (tenantId: number, data: ExportLeadsInput) => {
        const res = await exportLeadsApiTenantsTenantIdLeadsExportPost(
            tenantId,
            data,
        );
        return res.data;
    },
};

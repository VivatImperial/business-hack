import { queryOptions } from "@tanstack/react-query";
import type { TagsListParams } from "@/features/tags/types";
import { TAGS_LIST_DEFAULTS } from "@/features/tags/types";
import {
    listTagsFrontendApiTenantsTenantIdTagsListGet,
    createTagFrontendApiTenantsTenantIdTagsCreatePost,
    updateTagFrontendApiTenantsTenantIdTagsTagIdUpdatePost,
    toggleTagActiveFrontendApiTenantsTenantIdTagsTagIdToggleActivePost,
    deleteTagFrontendApiTenantsTenantIdTagsTagIdDelete,
    mergeTagsFrontendApiTenantsTenantIdTagsMergePost,
} from "../api/generated/tags/tags";
import type {
    CreateTagInput,
    UpdateTagInput,
    MergeTagsInput,
    ListTagsFrontendApiTenantsTenantIdTagsListGetParams,
    TagsListResponse,
} from "../api/generated/schemas";

export function normalizeTagsListParams(
    params?: Partial<TagsListParams>,
): Required<TagsListParams> {
    return { ...TAGS_LIST_DEFAULTS, ...(params ?? {}) };
}

function toApiParams(
    params: Required<TagsListParams>,
): ListTagsFrontendApiTenantsTenantIdTagsListGetParams {
    return {
        search: params.search || undefined,
        group: params.group === "all" ? undefined : params.group,
        period: params.period,
        sort_by: params.sortBy,
        sort_dir: params.sortDir,
    };
}

export const tagsQueries = {
    baseKey: ["tags"] as const,
    list: (tenantId: number, params?: Partial<TagsListParams>) => {
        const normalized = normalizeTagsListParams(params);
        return queryOptions({
            queryKey: ["tags", "list", normalized] as const,
            queryFn: async (): Promise<TagsListResponse> => {
                const res = await listTagsFrontendApiTenantsTenantIdTagsListGet(
                    tenantId,
                    toApiParams(normalized),
                );
                return res.data as TagsListResponse;
            },
        });
    },
};

export const tagsMutations = {
    create: async (tenantId: number, data: CreateTagInput) => {
        const res = await createTagFrontendApiTenantsTenantIdTagsCreatePost(
            tenantId,
            data,
        );
        return res.data;
    },
    update: async (tenantId: number, data: UpdateTagInput & { id: number }) => {
        const { id, ...body } = data;
        const res =
            await updateTagFrontendApiTenantsTenantIdTagsTagIdUpdatePost(
                tenantId,
                id,
                body,
            );
        return res.data;
    },
    toggleActive: async (tenantId: number, data: { id: number }) => {
        const res =
            await toggleTagActiveFrontendApiTenantsTenantIdTagsTagIdToggleActivePost(
                tenantId,
                data.id,
            );
        return res.data;
    },
    delete: async (tenantId: number, data: { id: number }) => {
        const res = await deleteTagFrontendApiTenantsTenantIdTagsTagIdDelete(
            tenantId,
            data.id,
        );
        return res.data;
    },
    merge: async (tenantId: number, data: MergeTagsInput) => {
        const res = await mergeTagsFrontendApiTenantsTenantIdTagsMergePost(
            tenantId,
            data,
        );
        return res.data;
    },
};

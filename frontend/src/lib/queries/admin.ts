import { queryOptions } from "@tanstack/react-query";

import { customFetch } from "../api/client";
import type {
    UtmPromptTemplate,
    UtmChatPreset,
    UtmLink,
    UtmResolveData,
} from "@/features/admin/types";

export interface AdminClientChatMetric {
    title: string;
    messages30d: number;
    leads30d: number;
}

export interface AdminClientLifecycleSummary {
    status: string;
    label: string;
    hint?: string | null;
}

export interface AdminClientSummary {
    tenantId: number;
    tenantName: string;
    tenantSlug: string;
    isActive: boolean;
    ownerUsername?: string | null;
    memberCount: number;
    totalQuota: number;
    usedQuota: number;
    creditLimit: number;
    remainingQuota: number;
    sourceChatsCount: number;
    destinationConfigured: boolean;
    metrics: {
        messages30d: number;
        leads30d: number;
        conversionRate30d: number;
    };
    topChats: AdminClientChatMetric[];
    session: {
        totalSessions: number;
        activeSessions: number;
        backoffSessions: number;
        leasedSessions: number;
        hasSessionInBackoff: boolean;
        sessionStatus: string;
        backoffUntil?: string | null;
        lastError?: string | null;
        telegramUsername?: string | null;
    };
    lifecycle: AdminClientLifecycleSummary;
}

export interface AdminClientsListResponse {
    items: AdminClientSummary[];
}

export interface AdminHealthCheckSummary {
    key: string;
    label: string;
    status: string;
    detail?: string | null;
}

export interface AdminPlatformSummary {
    overallStatus: string;
    totalUsers: number;
    activeTenants: number;
    totalMessages30d: number;
    totalMessagesAllTime: number;
    currentQueueLength: number;
    failedAttempts24h: number;
    sessionsTotal: number;
    activeSessions: number;
    sessionsInBackoff: number;
    leasedSessions: number;
    backoffPercent: number;
    lastProcessedAt?: string | null;
    healthChecks: AdminHealthCheckSummary[];
}

export interface AdminProcessedMessagesPoint {
    bucketStart: string;
    total: number;
}

export interface AdminProcessedMessagesTimeseriesResponse {
    range: string;
    bucket: string;
    points: AdminProcessedMessagesPoint[];
}

export interface AdminClientCreateInput {
    username: string;
    password: string;
    tenantName: string;
    tenantSlug?: string;
}

export interface AdminClientCreateResponse {
    username: string;
    tenantId: number;
    tenantName: string;
    tenantSlug: string;
    role: string;
}

export interface AdminClientLimitsUpdateInput {
    totalQuota: number;
    creditLimit: number;
}

export interface AdminClientLimitsResponse {
    tenantId: number;
    totalQuota: number;
    usedQuota: number;
    creditLimit: number;
}

export const adminQueries = {
    summary: () =>
        queryOptions({
            queryKey: ["admin", "summary"] as const,
            queryFn: async () => {
                const res = await customFetch<{ data: AdminPlatformSummary }>(
                    "/api/admin/summary",
                    { method: "GET" },
                );
                return res.data;
            },
        }),
    clients: () =>
        queryOptions({
            queryKey: ["admin", "clients"] as const,
            queryFn: async () => {
                const res = await customFetch<{ data: AdminClientsListResponse }>(
                    "/api/admin/clients",
                    { method: "GET" },
                );
                return res.data;
            },
        }),
    processedMessagesTimeseries: (range: string) =>
        queryOptions({
            queryKey: ["admin", "processed-messages", range] as const,
            queryFn: async () => {
                const res = await customFetch<{
                    data: AdminProcessedMessagesTimeseriesResponse;
                }>(`/api/admin/processed-messages?range=${encodeURIComponent(range)}`, {
                    method: "GET",
                });
                return res.data;
            },
        }),
};

export const adminMutations = {
    createClient: async (payload: AdminClientCreateInput) => {
        const res = await customFetch<{ data: AdminClientCreateResponse }>(
            "/api/admin/clients",
            {
                method: "POST",
                body: JSON.stringify(payload),
            },
        );
        return res.data;
    },
    updateLimits: async (
        tenantId: number,
        payload: AdminClientLimitsUpdateInput,
    ) => {
        const res = await customFetch<{ data: AdminClientLimitsResponse }>(
            `/api/admin/clients/${tenantId}/limits`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            },
        );
        return res.data;
    },
};

// ------------------------------------------------------------------
// UTM
// ------------------------------------------------------------------

export const adminUtmQueries = {
    promptTemplates: () =>
        queryOptions({
            queryKey: ["admin", "utm", "prompt-templates"] as const,
            queryFn: async () => {
                const res = await customFetch<{ data: UtmPromptTemplate[] }>(
                    "/api/admin/utm/prompt-templates",
                    { method: "GET" },
                );
                return res.data;
            },
        }),
    chatPresets: () =>
        queryOptions({
            queryKey: ["admin", "utm", "chat-presets"] as const,
            queryFn: async () => {
                const res = await customFetch<{ data: UtmChatPreset[] }>(
                    "/api/admin/utm/chat-presets",
                    { method: "GET" },
                );
                return res.data;
            },
        }),
    links: () =>
        queryOptions({
            queryKey: ["admin", "utm", "links"] as const,
            queryFn: async () => {
                const res = await customFetch<{ data: UtmLink[] }>(
                    "/api/admin/utm/links",
                    { method: "GET" },
                );
                return res.data;
            },
        }),
};

export const adminUtmMutations = {
    createPromptTemplate: async (data: { name: string; content: string }) => {
        const res = await customFetch<{ data: UtmPromptTemplate }>(
            "/api/admin/utm/prompt-templates",
            { method: "POST", body: JSON.stringify(data) },
        );
        return res.data;
    },
    deletePromptTemplate: async (id: number) => {
        const res = await customFetch<{ data: { status: string } }>(
            `/api/admin/utm/prompt-templates/${id}`,
            { method: "DELETE" },
        );
        return res.data;
    },
    createChatPreset: async (data: { name: string; chatUrls: string[] }) => {
        const res = await customFetch<{ data: UtmChatPreset }>(
            "/api/admin/utm/chat-presets",
            { method: "POST", body: JSON.stringify(data) },
        );
        return res.data;
    },
    deleteChatPreset: async (id: number) => {
        const res = await customFetch<{ data: { status: string } }>(
            `/api/admin/utm/chat-presets/${id}`,
            { method: "DELETE" },
        );
        return res.data;
    },
    createLink: async (data: { promptTemplateId: number; chatPresetId: number }) => {
        const res = await customFetch<{ data: UtmLink }>(
            "/api/admin/utm/links",
            { method: "POST", body: JSON.stringify(data) },
        );
        return res.data;
    },
    deleteLink: async (id: number) => {
        const res = await customFetch<{ data: { status: string } }>(
            `/api/admin/utm/links/${id}`,
            { method: "DELETE" },
        );
        return res.data;
    },
    improvePrompt: async (prompt: string): Promise<string> => {
        const res = await customFetch<{ data: { generatedPrompt: string } }>(
            "/api/admin/utm/improve-prompt",
            { method: "POST", body: JSON.stringify({ prompt }) },
        );
        return res.data.generatedPrompt;
    },
};

export async function resolveUtmLink(code: string): Promise<UtmResolveData> {
    const res = await customFetch<{ data: UtmResolveData }>(
        `/api/utm/${encodeURIComponent(code)}`,
        { method: "GET" },
    );
    return res.data;
}

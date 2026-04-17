export type LeadStatus = "new" | "viewed" | "in_progress" | "rejected";

export type RejectReason =
    | "irrelevant"
    | "duplicate"
    | "already_contacted"
    | "other";

export type LeadsStatusFilter = "all" | LeadStatus | "favorites";
export type DateRangeFilter = "all" | "today" | "7d" | "30d" | "90d";
export type LeadsSortBy = "createdAt" | "status";
export type SortDir = "asc" | "desc";

export type LeadRecord = {
    id: number;
    createdAt: string;
    name: string;
    telegramUsername: string;
    snippet: string;
    tag: string;
    source: string;
    sourceUrl: string;
    relevance: number;
    status: LeadStatus;
    isViewed: boolean;
    isFavorite: boolean;
    summary: string;
    request: string;
    originalMessage: string;
    suggestedOffer: string;
    nextStep: string;
    rejectedReason: RejectReason | null;
    avatarTone: "mutedBlue";
};

export type LeadsListParams = {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: LeadsStatusFilter;
    tag?: string;
    source?: string;
    period?: DateRangeFilter;
    sortBy?: LeadsSortBy;
    sortDir?: SortDir;
};

export type LeadsListResponse = {
    leads: LeadRecord[];
    total: number;
    filteredTotal: number;
    page: number;
    pageSize: number;
    totalPages: number;
    availableTags: string[];
    availableSources: string[];
    counts: {
        all: number;
        new: number;
        viewed: number;
        in_progress: number;
        rejected: number;
        favorites: number;
    };
    filteredIds: number[];
};

export type BulkLeadAction =
    | { type: "mark_viewed" }
    | { type: "set_in_progress" }
    | { type: "toggle_favorite"; value?: boolean }
    | { type: "reject"; reason: RejectReason };

export type BulkUpdatePayload = {
    ids?: number[];
    applyToFiltered?: boolean;
    filters?: LeadsListParams;
    action: BulkLeadAction;
};

export const LEADS_LIST_DEFAULTS: Required<LeadsListParams> = {
    page: 1,
    pageSize: 25,
    search: "",
    status: "all",
    tag: "all",
    source: "all",
    period: "all",
    sortBy: "createdAt",
    sortDir: "desc",
};

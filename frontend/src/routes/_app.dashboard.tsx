import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { DashboardPage } from "@/features/dashboard/ui/dashboard-page";
import {
    getSummaryApiV1AdminDashboardSummaryGetQueryOptions,
    getMessagesTimeseriesApiV1AdminDashboardMessagesTimeseriesGetQueryOptions,
} from "@/lib/api/generated/admin-dashboard/admin-dashboard";
import type { MessagesTimeseriesResponsePeriod as Period } from "@/lib/api/generated/schemas/messagesTimeseriesResponsePeriod";

const searchSchema = z.object({
    period: z.string().optional(),
});

function asPeriod(value: string | undefined): Period {
    return value === "1h" ||
        value === "6h" ||
        value === "24h" ||
        value === "7d" ||
        value === "30d" ||
        value === "90d"
        ? value
        : "7d";
}

export const Route = createFileRoute("/_app/dashboard")({
    validateSearch: searchSchema,
    loaderDeps: ({ search }) => ({ period: asPeriod(search.period) }),
    loader: async ({ context: { queryClient, role }, deps: { period } }) => {
        if (role !== "admin") return;
        await Promise.all(
            [
                queryClient.ensureQueryData(
                    getSummaryApiV1AdminDashboardSummaryGetQueryOptions({
                        period,
                    }),
                ),
                queryClient.ensureQueryData(
                    getMessagesTimeseriesApiV1AdminDashboardMessagesTimeseriesGetQueryOptions(
                        { period },
                    ),
                ),
            ].map((p) => p.catch(() => undefined)),
        );
    },
    component: DashboardPage,
});

export type DashboardSearch = z.infer<typeof searchSchema>;

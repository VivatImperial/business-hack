import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { DashboardPage } from "@/features/dashboard/ui/dashboard-page";

const searchSchema = z.object({
    period: z.string().optional(),
});

export const Route = createFileRoute("/_app/dashboard")({
    validateSearch: searchSchema,
    component: DashboardPage,
});

export type DashboardSearch = z.infer<typeof searchSchema>;

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AppealsPage } from "@/features/appeals/ui/appeals-page";

const searchSchema = z.object({
    scope: z.string().optional(),
    status: z.string().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
});

export const Route = createFileRoute("/_app/appeals")({
    validateSearch: searchSchema,
    component: AppealsPage,
});

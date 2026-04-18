import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AppealsPage } from "@/features/appeals/ui/appeals-page";
import { getListAppealsApiV1AdminAppealsGetQueryOptions } from "@/lib/api/generated/admin-appeals/admin-appeals";
import type { ListAppealsApiV1AdminAppealsGetParams } from "@/lib/api/generated/schemas";
import { AppealListItemResponseStatus as AppealStatus } from "@/lib/api/generated/schemas";

const searchSchema = z.object({
    scope: z.string().optional(),
    status: z.string().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
});

function buildParams(
    search: z.infer<typeof searchSchema>,
): ListAppealsApiV1AdminAppealsGetParams {
    const params: ListAppealsApiV1AdminAppealsGetParams = {
        scope: search.scope && search.scope !== "all" ? search.scope : undefined,
        date_from: search.date_from,
        date_to: search.date_to,
    };
    if (search.status === AppealStatus.in_progress) {
        params.status = AppealStatus.in_progress;
    } else if (search.status === AppealStatus.closed) {
        params.status = AppealStatus.closed;
    }
    return params;
}

export const Route = createFileRoute("/_app/appeals")({
    validateSearch: searchSchema,
    loaderDeps: ({ search }) => ({
        scope: search.scope,
        status: search.status,
        date_from: search.date_from,
        date_to: search.date_to,
    }),
    loader: async ({ context: { queryClient, role }, deps }) => {
        if (role !== "admin") return;
        const params = buildParams(deps);
        await queryClient
            .ensureQueryData(
                getListAppealsApiV1AdminAppealsGetQueryOptions(params),
            )
            .catch(() => undefined);
    },
    component: AppealsPage,
});

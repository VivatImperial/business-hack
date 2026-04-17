import { createFileRoute, redirect } from "@tanstack/react-router";

import { resolveManagerRedirect } from "@/lib/server-fns/manager";

type ManagerSearch = { text?: string };

export const Route = createFileRoute("/go/manager")({
    validateSearch: (search: Record<string, unknown>): ManagerSearch => ({
        text: typeof search.text === "string" ? search.text : undefined,
    }),
    beforeLoad: async ({ search }) => {
        const { href } = await resolveManagerRedirect({ data: search });
        throw redirect({ href });
    },
    component: () => null,
});

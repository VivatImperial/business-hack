import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "@/features/chat/ui/chat-page";
import { getGetRequestApiV1ClientRequestsRequestIdGetQueryOptions } from "@/lib/api/generated/client-requests/client-requests";

export const Route = createFileRoute("/_app/chat/$chatId")({
    loader: async ({
        context: { queryClient, role },
        params: { chatId },
    }) => {
        // Admin opens the chat via /admin/appeals/... conversation endpoint —
        // handled inside the page. Only prefetch the client-side timeline.
        if (role !== "client") return;
        await queryClient
            .ensureQueryData(
                getGetRequestApiV1ClientRequestsRequestIdGetQueryOptions(
                    chatId,
                ),
            )
            .catch(() => undefined);
    },
    component: ChatPage,
});

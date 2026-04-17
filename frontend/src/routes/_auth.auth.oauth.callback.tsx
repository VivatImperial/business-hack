import { createFileRoute } from "@tanstack/react-router";
import { OAuthCallbackPage } from "@/features/auth";

export const Route = createFileRoute("/_auth/auth/oauth/callback")({
    component: OAuthCallbackPage,
});

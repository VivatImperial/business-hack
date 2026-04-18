import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/settings";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";

export const Route = createFileRoute("/_app/settings")({
    component: SettingsPage,
    errorComponent: RouteErrorFallback,
});

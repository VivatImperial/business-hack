import { createFileRoute } from "@tanstack/react-router";
import { AdminUtmPage } from "@/features/admin";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";

export const Route = createFileRoute("/admin/utm/new")({
    component: AdminUtmNew,
    errorComponent: RouteErrorFallback,
});

function AdminUtmNew() {
    return <AdminUtmPage />;
}

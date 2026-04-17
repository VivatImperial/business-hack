import { createFileRoute } from "@tanstack/react-router";
import { AdminUtmListPage } from "@/features/admin";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";

export const Route = createFileRoute("/admin/utm/")({
    component: AdminUtm,
    errorComponent: RouteErrorFallback,
});

function AdminUtm() {
    return <AdminUtmListPage />;
}

import { createFileRoute } from "@tanstack/react-router";
import { AdminClientsListPage } from "@/features/admin";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";

export const Route = createFileRoute("/admin/clients")({
    component: AdminClients,
    errorComponent: RouteErrorFallback,
});

function AdminClients() {
    return <AdminClientsListPage />;
}

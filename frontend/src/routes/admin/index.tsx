import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardPage } from "@/features/admin";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";

export const Route = createFileRoute("/admin/")({
    component: AdminDashboard,
    errorComponent: RouteErrorFallback,
});

function AdminDashboard() {
    return <AdminDashboardPage />;
}

import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginPage } from "@/features/auth/ui/admin-login-page";

export const Route = createFileRoute("/_auth/admin/login")({
    component: AdminLoginPage,
});

import { createFileRoute } from "@tanstack/react-router";
import { AccessPage } from "@/features/access/ui/access-page";

export const Route = createFileRoute("/_app/access")({
    component: AccessPage,
});

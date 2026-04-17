import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

import { resolveUtmLink } from "@/lib/queries/admin";
import { getToken, getTenantId } from "@/lib/auth";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

export const Route = createFileRoute("/utm/$code")({
    component: UtmLandingPage,
});

function UtmLandingPage() {
    const { code } = Route.useParams();
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const data = await resolveUtmLink(code);
                if (cancelled) return;

                sessionStorage.setItem("utm_pending", JSON.stringify(data));

                const token = getToken();
                const tenantId = getTenantId();

                if (token && tenantId) {
                    window.location.href = "/dashboard";
                } else {
                    window.location.href = "/login";
                }
            } catch {
                if (!cancelled) {
                    setError(true);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [code]);

    if (error) {
        return (
            <div
                className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
                style={{ backgroundColor: "oklch(0.975 0.008 245)" }}
            >
                <div className="flex flex-col items-center max-w-lg">
                    <h1 className="font-heading text-[24px] font-extrabold text-foreground mb-2 tracking-tight">
                        Ссылка не найдена
                    </h1>
                    <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-xs">
                        Эта UTM-ссылка не существует или была деактивирована.
                    </p>
                    <Link to="/login">
                        <Button className="h-11 px-6 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all font-medium shadow-sm">
                            <ArrowLeftIcon className="mr-2 size-4" />
                            На главную
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center p-6"
            style={{ backgroundColor: "oklch(0.975 0.008 245)" }}
        >
            <Spinner className="size-8" />
            <p className="mt-4 text-[14px] text-muted-foreground">
                Подготавливаем настройки…
            </p>
        </div>
    );
}

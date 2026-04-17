import { useState, useEffect, useCallback } from "react";
import { BASE_URL } from "@/lib/api/client";
import { setToken, fetchTenants, setTenantId } from "@/lib/auth";
import { useRouter } from "@tanstack/react-router";
import { getDisplayError } from "@/shared/lib/get-display-error";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { Spinner } from "@/shared/ui/spinner";

function TelegramIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="21 16 80 80" fill="currentColor">
            <path d="M23.775 58.77a3278.85 3278.85 0 0 1 39.27-16.223c18.698-7.454 21.3-8.542 23.828-8.58a4.995 4.995 0 0 1 2.977 1.103c1.058.9 1.38 1.47 1.47 1.972.083.503.075 2.07-.015 2.963-1.013 10.207-4.86 33.78-7.088 45.225-.945 4.837-2.805 6.457-4.605 6.615-3.907.345-6.877-2.475-10.664-4.86-5.925-3.728-7.905-5.1-13.65-8.737-6.653-4.2-3.916-5.663-.128-9.436.99-.982 17.415-15.974 17.662-17.34.21-1.2.286-1.357-.254-1.897-.548-.54-1.2-.473-1.62-.383-.6.128-9.645 5.85-27.15 17.176-2.685 1.777-5.115 2.64-7.298 2.595-2.4-.053-7.027-1.305-10.462-2.378-4.223-1.32-7.575-2.01-7.275-4.245.15-1.163 1.814-2.355 5.002-3.57Z" />
        </svg>
    );
}

interface OAuthConfig {
    telegram_bot_id: string | null;
    telegram_bot_username: string | null;
    yandex_client_id: string | null;
    yandex_redirect_uri: string | null;
    vk_app_id: string | null;
    vk_redirect_uri: string | null;
}

export function SocialAuthButtons() {
    const router = useRouter();
    const [config, setConfig] = useState<OAuthConfig | null>(null);
    const [loading, setLoading] = useState(false);

    const handleOAuthSuccess = useCallback(
        async (token: string) => {
            setToken(token);
            const tenants = await fetchTenants();
            if (tenants.length > 0) {
                setTenantId(tenants[0].id);
            } else {
                throw new Error(
                    "Для вашего аккаунта пока не назначен проект. Напишите менеджеру.",
                );
            }
            await router.invalidate();
            await router.navigate({ to: "/dashboard" });
        },
        [router],
    );

    useEffect(() => {
        fetch(`${BASE_URL}/api/auth/oauth/config`)
            .then((r) => r.json())
            .then(setConfig)
            .catch(() => {});
    }, []);

    const handleTelegram = () => {
        if (!config?.telegram_bot_id) return;
        setLoading(true);

        const botId = config.telegram_bot_id;
        const origin = window.location.origin;
        const popup = window.open(
            `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(origin)}&request_access=write`,
            "telegram_auth",
            "width=550,height=470,resizable=yes,scrollbars=yes",
        );

        const handler = async (e: MessageEvent) => {
            if (e.origin !== "https://oauth.telegram.org") return;
            window.removeEventListener("message", handler);
            popup?.close();

            try {
                let raw = e.data;
                if (typeof raw === "string") {
                    try {
                        raw = JSON.parse(raw);
                    } catch {
                        /* use as-is */
                    }
                }
                const authData = raw?.result ?? raw;
                const res = await fetch(`${BASE_URL}/api/auth/oauth/telegram`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(authData),
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.detail ?? "");
                }
                const data = await res.json();
                await handleOAuthSuccess(data.access_token);
            } catch (err) {
                snackbarStore.showError(getDisplayError(err, "Ошибка авторизации через Telegram"));
            } finally {
                setLoading(false);
            }
        };
        window.addEventListener("message", handler);

        setTimeout(() => {
            window.removeEventListener("message", handler);
            setLoading(false);
        }, 120000);
    };

    if (!config?.telegram_bot_id) return null;

    return (
        <div className="flex flex-col gap-4">
            <button
                type="button"
                onClick={handleTelegram}
                disabled={loading}
                className="
                    w-full h-[52px] rounded-xl border border-[#dce0e5]
                    bg-white hover:bg-[#f8f9fa] active:bg-[#f0f1f3]
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-colors duration-150
                    flex items-center justify-center gap-2.5
                    text-[15px] font-semibold text-[#1a1a1a]
                "
            >
                {loading ? (
                    <Spinner className="size-5 animate-spin" />
                ) : (
                    <TelegramIcon className="size-5 text-[#27A7E7]" />
                )}
                Войти через Telegram
            </button>
        </div>
    );
}

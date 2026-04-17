import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { BASE_URL } from "@/lib/api/client";
import { setToken, fetchTenants, setTenantId } from "@/lib/auth";
import { getDisplayError } from "@/shared/lib/get-display-error";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { Spinner } from "@/shared/ui/spinner";

export function OAuthCallbackPage() {
    const router = useRouter();
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        handleCallback();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleCallback() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        const deviceId = params.get("device_id");

        // Try sessionStorage first, then fall back to state-encoded provider
        let provider = sessionStorage.getItem("oauth_provider");
        const savedState = sessionStorage.getItem("oauth_state");

        // Cleanup
        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("oauth_provider");

        // If no provider in sessionStorage, try to detect from URL or state
        if (!provider) {
            // Check if there's a 'provider' param in the hash or search
            const hashParams = new URLSearchParams(
                window.location.hash.replace("#", ""),
            );
            provider = hashParams.get("provider");
        }

        // Last resort: if we have a code but no provider, try yandex (most common redirect-based)
        if (!provider && code) {
            provider = "yandex";
        }

        if (!code || !provider) {
            snackbarStore.showError("Не удалось получить код авторизации. Попробуйте ещё раз.");
            setFailed(true);
            return;
        }

        if (state && savedState && state !== savedState) {
            snackbarStore.showError("Ошибка безопасности: несовпадение state");
            setFailed(true);
            return;
        }

        try {
            const body: Record<string, string> = {
                code,
                redirect_uri: `${window.location.origin}/auth/oauth/callback`,
            };

            if (provider === "vk") {
                const codeVerifier = sessionStorage.getItem("vk_code_verifier");
                sessionStorage.removeItem("vk_code_verifier");
                if (codeVerifier) body.code_verifier = codeVerifier;
                if (deviceId) body.device_id = deviceId;
            }

            const res = await fetch(`${BASE_URL}/api/auth/oauth/${provider}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail ?? "");
            }

            const data = await res.json();
            setToken(data.access_token);

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
        } catch (err) {
            snackbarStore.showError(getDisplayError(err, "Ошибка авторизации"));
            setFailed(true);
        }
    }

    return (
        <div className="w-full max-w-[420px] text-center">
            <div className="bg-white rounded-2xl border border-slate-200 px-8 py-10">
                {failed ? (
                    <div className="flex flex-col items-center gap-4">
                        <a
                            href="/login"
                            className="text-[14px] text-blue-500 hover:text-[#2599d3] font-medium transition-colors"
                        >
                            Вернуться к входу
                        </a>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <Spinner className="size-8 animate-spin text-blue-500" />
                        <p className="text-[15px] text-muted-foreground">
                            Выполняется вход...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

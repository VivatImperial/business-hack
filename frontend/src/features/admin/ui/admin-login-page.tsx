import { useState } from "react";
import { useRouter, isRedirect } from "@tanstack/react-router";
import { login, removeToken } from "@/lib/auth";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { BASE_URL } from "@/lib/api/client";
import { snackbarStore } from "@/shared/lib/snackbar-store";

export function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) return;

        setLoading(true);

        try {
            const token = await login(username, password);
            if (token === null) {
                snackbarStore.showError("Неверный логин или пароль");
                setLoading(false);
                return;
            }

            const res = await fetch(`${BASE_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                removeToken();
                snackbarStore.showError("Ошибка проверки доступа");
                setLoading(false);
                return;
            }

            const me = await res.json();

            if (!me.canAccessAdmin) {
                removeToken();
                snackbarStore.showError(
                    "У этого аккаунта нет доступа к админке",
                );
                setLoading(false);
                return;
            }

            await router.invalidate();
            window.location.href = "/admin";
        } catch (err) {
            if (isRedirect(err)) {
                throw err;
            }
            snackbarStore.showError(
                err instanceof Error ? err.message : "Ошибка авторизации",
            );
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4">
            <div className="w-full max-w-[380px]">
                <div className="rounded-2xl border border-border bg-card p-8">
                    <h1 className="text-center text-[20px] font-semibold text-foreground">
                        Вход в панель администратора
                    </h1>
                    <p className="mt-2 text-center text-[13px] text-muted-foreground">
                        Доступ только для администраторов платформы
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        className="mt-6 flex flex-col gap-4"
                    >
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Логин"
                            autoComplete="username"
                            autoFocus
                            className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                        />

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Пароль"
                            autoComplete="current-password"
                            className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                        />

                        <button
                            type="submit"
                            disabled={
                                loading || !username.trim() || !password.trim()
                            }
                            className="h-[48px] w-full rounded-xl bg-foreground text-[15px] font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                        >
                            {loading ? (
                                <ArrowPathIcon className="mx-auto size-5 animate-spin" />
                            ) : (
                                "Войти"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

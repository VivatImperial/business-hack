import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { useLoginApiV1AdminAuthLoginPost } from "@/lib/api/generated/admin-auth/admin-auth";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { setToken } from "@/lib/auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import { ApiError } from "@/lib/api/client";

export function LoginPage() {
    const navigate = useNavigate();
    const { showError } = useSnackbar();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const loginMutation = useLoginApiV1AdminAuthLoginPost({
        mutation: {
            onSuccess: (res) => {
                if (res.status === 200) {
                    setToken(res.data.access_token);
                    navigate({ to: "/dashboard" });
                }
            },
            onError: (err) => {
                if (err instanceof ApiError && err.status === 401) {
                    showError("Неверная почта или пароль");
                    return;
                }
                const message =
                    err instanceof Error
                        ? err.message
                        : "Не удалось войти. Попробуйте позже.";
                showError(message);
            },
        },
    });

    const disabled =
        loginMutation.isPending || email.trim() === "" || password === "";

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabled) return;
        loginMutation.mutate({ data: { email: email.trim(), password } });
    };

    return (
        <div className="min-h-svh grid lg:grid-cols-[minmax(0,1fr)_minmax(560px,0.85fr)]">
            {/* Left brand panel */}
            <div className="relative hidden lg:flex items-center justify-start overflow-hidden bg-background">
                <img
                    src="/images/layout/login-bg.png"
                    alt=""
                    className="h-full w-auto object-cover"
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
            </div>

            {/* Right form panel */}
            <div className="flex items-center justify-center px-6 sm:px-16 py-10 bg-background">
                <form
                    onSubmit={onSubmit}
                    className="w-full max-w-md space-y-7 animate-fade-in-up"
                    noValidate
                >
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold text-foreground">
                            Вход
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Войдите, чтобы перейти к админке и чату ассистента.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium text-muted-foreground"
                            >
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="example@bereg.ru"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loginMutation.isPending}
                                className="h-12"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-muted-foreground"
                            >
                                Пароль
                            </label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loginMutation.isPending}
                                className="h-12"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={disabled}
                        className="w-full h-12 bg-primary hover:bg-navy-800 text-primary-foreground text-base font-medium"
                    >
                        {loginMutation.isPending ? (
                            <Spinner size="sm" />
                        ) : (
                            <>
                                Войти
                                <ArrowRightIcon className="ml-2 size-4" />
                            </>
                        )}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        Нет аккаунта?{" "}
                        <Link
                            to="/register"
                            className="text-primary hover:underline font-medium"
                        >
                            Зарегистрироваться
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

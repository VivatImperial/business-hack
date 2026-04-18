import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { useSnackbar } from "@/hooks/use-snackbar";

export function RegisterPage() {
    const navigate = useNavigate();
    const { showError, show } = useSnackbar();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const disabled =
        isLoading ||
        email.trim() === "" ||
        password === "" ||
        passwordConfirm === "";

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabled) return;

        if (password !== passwordConfirm) {
            showError("Пароли не совпадают");
            return;
        }

        setIsLoading(true);

        // Mock registration since there is no endpoint
        setTimeout(() => {
            setIsLoading(false);
            show("Регистрация успешна! Теперь вы можете войти.");
            navigate({ to: "/login" });
        }, 1000);
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
                            Регистрация
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Создайте аккаунт для доступа к админке.
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
                                disabled={isLoading}
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
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="h-12"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="passwordConfirm"
                                className="text-sm font-medium text-muted-foreground"
                            >
                                Повторите пароль
                            </label>
                            <Input
                                id="passwordConfirm"
                                type="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={passwordConfirm}
                                onChange={(e) =>
                                    setPasswordConfirm(e.target.value)
                                }
                                disabled={isLoading}
                                className="h-12"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={disabled}
                        className="w-full h-12 bg-primary hover:bg-navy-800 text-primary-foreground text-base font-medium"
                    >
                        {isLoading ? (
                            <Spinner size="sm" />
                        ) : (
                            <>
                                Зарегистрироваться
                                <ArrowRightIcon className="ml-2 size-4" />
                            </>
                        )}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        Уже есть аккаунт?{" "}
                        <Link
                            to="/login"
                            className="text-primary hover:underline font-medium"
                        >
                            Войти
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { useLoginApiV1ClientAuthLoginPost } from "@/lib/api/generated/client-auth/client-auth";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { FloatingInput } from "@/shared/ui/floating-input";
import { setToken, setRole } from "@/lib/auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import { ApiError } from "@/lib/api/client";
import { AuthShell } from "./auth-shell";
import { validateEmail, validatePassword } from "../lib/validate";
import {
    motion,
    blurFadeUp,
    scaleFadeIn,
    springPop,
    staggerContainerDelayed,
    fadeIn,
} from "@/shared/animations/motion";

type Touched = { email: boolean; password: boolean };

export function LoginPage() {
    const navigate = useNavigate();
    const { showError } = useSnackbar();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [touched, setTouched] = useState<Touched>({
        email: false,
        password: false,
    });
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const loginMutation = useLoginApiV1ClientAuthLoginPost({
        mutation: {
            onSuccess: (res) => {
                if (res.status === 200) {
                    setToken(res.data.access_token);
                    setRole("client");
                    navigate({ to: "/chat" });
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

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const showEmailError =
        (touched.email || submitAttempted) && emailError !== null;
    const showPasswordError =
        (touched.password || submitAttempted) && passwordError !== null;

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitAttempted(true);
        if (loginMutation.isPending) return;
        if (emailError || passwordError) return;
        loginMutation.mutate({ data: { email: email.trim(), password } });
    };

    return (
        <AuthShell>
            <motion.form
                onSubmit={onSubmit}
                className="w-full max-w-md space-y-7"
                noValidate
                variants={staggerContainerDelayed(0.08, 0.05)}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={scaleFadeIn} className="space-y-2">
                    <h1 className="text-3xl font-semibold text-foreground">
                        Вход
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Войдите, чтобы перейти в чат с ассистентом.
                    </p>
                </motion.div>

                <motion.div variants={blurFadeUp} className="space-y-4">
                    <FloatingInput
                        id="login-email"
                        label="Email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() =>
                            setTouched((t) => ({ ...t, email: true }))
                        }
                        disabled={loginMutation.isPending}
                        error={showEmailError ? emailError : null}
                    />
                    <FloatingInput
                        id="login-password"
                        label="Пароль"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() =>
                            setTouched((t) => ({ ...t, password: true }))
                        }
                        disabled={loginMutation.isPending}
                        error={showPasswordError ? passwordError : null}
                    />
                </motion.div>

                <motion.div variants={springPop}>
                    <Button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="h-12 w-full bg-primary text-base font-medium text-primary-foreground hover:bg-navy-800"
                    >
                        {loginMutation.isPending ? (
                            <Spinner />
                        ) : (
                            <>
                                Войти
                                <ArrowRightIcon className="ml-2 size-4" />
                            </>
                        )}
                    </Button>
                </motion.div>

                <motion.div
                    variants={fadeIn}
                    className="space-y-3 text-center text-sm text-muted-foreground"
                >
                    <div>
                        Нет аккаунта?{" "}
                        <Link
                            to="/register"
                            className="font-medium text-primary hover:underline"
                        >
                            Зарегистрироваться
                        </Link>
                    </div>
                    <div>
                        <Link
                            to="/admin/login"
                            className="text-[13px] text-muted-foreground/80 hover:text-primary hover:underline"
                        >
                            Войти как админ →
                        </Link>
                    </div>
                </motion.div>
            </motion.form>
        </AuthShell>
    );
}

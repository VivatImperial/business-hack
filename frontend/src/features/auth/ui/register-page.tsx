import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { useRegisterApiV1ClientAuthRegisterPost } from "@/lib/api/generated/client-auth/client-auth";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { FloatingInput } from "@/shared/ui/floating-input";
import { setToken, setRole } from "@/lib/auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import { ApiError } from "@/lib/api/client";
import { AuthShell } from "./auth-shell";
import {
    validateEmail,
    validateLogin,
    validatePassword,
    validatePasswordMatch,
} from "../lib/validate";
import {
    motion,
    blurFadeUp,
    scaleFadeIn,
    springPop,
    staggerContainerDelayed,
    fadeIn,
} from "@/shared/animations/motion";

type Touched = {
    login: boolean;
    email: boolean;
    password: boolean;
    passwordConfirm: boolean;
};

export function RegisterPage() {
    const navigate = useNavigate();
    const { showError } = useSnackbar();
    const [login, setLogin] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [touched, setTouched] = useState<Touched>({
        login: false,
        email: false,
        password: false,
        passwordConfirm: false,
    });
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const registerMutation = useRegisterApiV1ClientAuthRegisterPost({
        mutation: {
            onSuccess: (res) => {
                if (res.status === 201) {
                    setToken(res.data.access_token);
                    setRole("client");
                    navigate({ to: "/chat" });
                }
            },
            onError: (err) => {
                if (err instanceof ApiError && err.status === 409) {
                    showError("Аккаунт с таким email уже существует");
                    return;
                }
                if (err instanceof ApiError && err.status === 422) {
                    showError("Проверьте правильность полей");
                    return;
                }
                const message =
                    err instanceof Error
                        ? err.message
                        : "Не удалось зарегистрироваться. Попробуйте позже.";
                showError(message);
            },
        },
    });

    const loginError = validateLogin(login);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const passwordConfirmError = validatePasswordMatch(
        password,
        passwordConfirm,
    );

    const showLoginError =
        (touched.login || submitAttempted) && loginError !== null;
    const showEmailError =
        (touched.email || submitAttempted) && emailError !== null;
    const showPasswordError =
        (touched.password || submitAttempted) && passwordError !== null;
    const showPasswordConfirmError =
        (touched.passwordConfirm || submitAttempted) &&
        passwordConfirmError !== null;

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitAttempted(true);
        if (registerMutation.isPending) return;
        if (loginError || emailError || passwordError || passwordConfirmError)
            return;

        registerMutation.mutate({
            data: {
                email: email.trim(),
                password,
                login: login.trim(),
            },
        });
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
                        Регистрация
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Создайте аккаунт, чтобы задать вопрос ассистенту.
                    </p>
                </motion.div>

                <motion.div variants={blurFadeUp} className="space-y-4">
                    <FloatingInput
                        id="register-login"
                        label="Логин"
                        type="text"
                        autoComplete="username"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        onBlur={() =>
                            setTouched((t) => ({ ...t, login: true }))
                        }
                        disabled={registerMutation.isPending}
                        error={showLoginError ? loginError : null}
                        hint={!showLoginError ? "3–64 символа" : undefined}
                    />
                    <FloatingInput
                        id="register-email"
                        label="Email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() =>
                            setTouched((t) => ({ ...t, email: true }))
                        }
                        disabled={registerMutation.isPending}
                        error={showEmailError ? emailError : null}
                    />
                    <FloatingInput
                        id="register-password"
                        label="Пароль"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() =>
                            setTouched((t) => ({ ...t, password: true }))
                        }
                        disabled={registerMutation.isPending}
                        error={showPasswordError ? passwordError : null}
                        hint={
                            !showPasswordError ? "Минимум 8 символов" : undefined
                        }
                    />
                    <FloatingInput
                        id="register-password-confirm"
                        label="Повторите пароль"
                        type="password"
                        autoComplete="new-password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        onBlur={() =>
                            setTouched((t) => ({
                                ...t,
                                passwordConfirm: true,
                            }))
                        }
                        disabled={registerMutation.isPending}
                        error={
                            showPasswordConfirmError
                                ? passwordConfirmError
                                : null
                        }
                    />
                </motion.div>

                <motion.div variants={springPop}>
                    <Button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="h-12 w-full bg-primary text-base font-medium text-primary-foreground hover:bg-orange-800"
                    >
                        {registerMutation.isPending ? (
                            <Spinner />
                        ) : (
                            <>
                                Зарегистрироваться
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
                        Уже есть аккаунт?{" "}
                        <Link
                            to="/login"
                            className="font-medium text-primary hover:underline"
                        >
                            Войти
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

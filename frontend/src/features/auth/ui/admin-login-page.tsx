import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
    ArrowRightIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/solid";

import { useLoginApiV1AdminAuthLoginPost } from "@/lib/api/generated/admin-auth/admin-auth";
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

// Default dev credentials — must match backend seed (`BACKEND_ADMIN_*` / README).
// Bootstrap creates the first admin only when the DB has no users yet.
const TEST_ADMIN_EMAIL = "admin@example.com";
const TEST_ADMIN_PASSWORD = "admin12345";

type Touched = { email: boolean; password: boolean };

export function AdminLoginPage() {
    const navigate = useNavigate();
    const { showError } = useSnackbar();
    const [email, setEmail] = useState(TEST_ADMIN_EMAIL);
    const [password, setPassword] = useState(TEST_ADMIN_PASSWORD);
    const [touched, setTouched] = useState<Touched>({
        email: false,
        password: false,
    });
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const loginMutation = useLoginApiV1AdminAuthLoginPost({
        mutation: {
            onSuccess: (res) => {
                if (res.status === 200) {
                    setToken(res.data.access_token);
                    setRole("admin");
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
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-border)] bg-[var(--brand-cream)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--brand-dark)]">
                        <ShieldCheckIcon className="size-3" />
                        Администратор
                    </div>
                    <h1 className="text-3xl font-semibold text-foreground">
                        Вход для оператора
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Доступ к метрикам, обращениям и настройкам ассистента.
                    </p>
                </motion.div>

                <motion.div
                    variants={blurFadeUp}
                    className="flex items-start gap-2.5 rounded-md border border-[var(--brand-border)] bg-[var(--brand-cream)]/60 px-3.5 py-3 text-[13px] leading-relaxed text-[var(--brand-dark)]"
                >
                    <InformationCircleIcon className="mt-[1px] size-4 shrink-0 text-[var(--brand-accent)]" />
                    <span>
                        <b className="font-semibold">Тестовые данные.</b> Email и
                        пароль совпадают с дефолтным сидом backend (см. README:
                        <code className="mx-1 rounded bg-[var(--brand-border)]/40 px-1">
                            admin@example.com
                        </code>
                        ). На сервере они должны совпадать с{" "}
                        <code className="rounded bg-[var(--brand-border)]/40 px-1">
                            BACKEND_ADMIN_EMAIL
                        </code>{" "}
                        и{" "}
                        <code className="rounded bg-[var(--brand-border)]/40 px-1">
                            BACKEND_ADMIN_PASSWORD
                        </code>
                        .
                    </span>
                </motion.div>

                <motion.div variants={blurFadeUp} className="space-y-4">
                    <FloatingInput
                        id="admin-email"
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
                        id="admin-password"
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
                    className="text-center text-sm text-muted-foreground"
                >
                    <Link
                        to="/login"
                        className="text-[13px] hover:text-primary hover:underline"
                    >
                        ← Войти как сотрудник
                    </Link>
                </motion.div>
            </motion.form>
        </AuthShell>
    );
}

import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
const logoSrc = "/images/common/logo.webp";
import {
    register as registerUser,
    fetchTenants,
    setTenantId,
} from "@/lib/auth";
import { getDisplayError } from "@/shared/lib/get-display-error";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import {
    EyeIcon,
    EyeSlashIcon,
    CheckIcon,
    XMarkIcon,
} from "@heroicons/react/24/solid";
import { SocialAuthButtons } from "./social-auth-buttons";
import { Spinner } from "@/shared/ui/spinner";

const registerSchema = z
    .object({
        username: z
            .string()
            .min(1, "Введите логин")
            .min(3, "Логин должен содержать минимум 3 символа")
            .max(50, "Логин слишком длинный")
            .regex(
                /^[a-zA-Z0-9_.-]+$/,
                "Только латинские буквы, цифры, точка, дефис и _",
            ),
        password: z
            .string()
            .min(1, "Введите пароль")
            .min(6, "Пароль должен содержать минимум 6 символов")
            .max(128, "Пароль слишком длинный")
            .regex(/[A-Z]/, "Пароль должен содержать заглавную букву")
            .regex(/[0-9]/, "Пароль должен содержать цифру"),
        confirmPassword: z.string().min(1, "Подтвердите пароль"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Пароли не совпадают",
        path: ["confirmPassword"],
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

const passwordRules = [
    { test: (v: string) => v.length >= 6, label: "Минимум 6 символов" },
    { test: (v: string) => /[A-Z]/.test(v), label: "Заглавная буква" },
    { test: (v: string) => /[0-9]/.test(v), label: "Цифра" },
];

export function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { username: "", password: "", confirmPassword: "" },
    });

    const passwordValue = watch("password");
    const showPasswordHints = passwordValue.length > 0;

    const onSubmit = async (data: RegisterFormValues) => {
        setLoading(true);

        try {
            await registerUser(data.username, data.password);
            const tenants = await fetchTenants();
            if (tenants.length > 0) {
                setTenantId(tenants[0].id);
            } else {
                throw new Error(
                    "Аккаунт создан, но проект вам назначает администратор. Напишите менеджеру.",
                );
            }
            await router.invalidate();
            await router.navigate({ to: "/settings" });
        } catch (err) {
            snackbarStore.showError(getDisplayError(err, "Ошибка регистрации. Попробуйте другой логин."));
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f3f4f8]">
            <div className="w-full max-w-[420px] mx-4">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <img
                        src={logoSrc}
                        alt="Пульсар"
                        className="size-11 rounded-xl"
                    />
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm px-8 py-10 sm:px-10">
                    <h1 className="text-[22px] font-bold text-center text-[#1a1a1a] mb-8 tracking-tight">
                        Создать аккаунт
                    </h1>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-5"
                        noValidate
                    >
                        {/* Username */}
                        <div className="flex flex-col gap-1.5">
                            <div className="relative">
                                <input
                                    {...register("username")}
                                    type="text"
                                    placeholder="Логин"
                                    autoComplete="username"
                                    autoFocus
                                    className={`
                                        w-full h-[52px] px-4 text-[15px] text-[#1a1a1a]
                                        bg-white border rounded-xl outline-none
                                        transition-colors duration-150
                                        placeholder:text-[#9299a2]
                                        ${
                                            errors.username
                                                ? "border-red-400 focus:border-red-400"
                                                : "border-[#dce0e5] hover:border-[#b8bfc7] focus:border-[#548af7]"
                                        }
                                    `}
                                />
                            </div>
                            {errors.username && (
                                <span className="text-[13px] text-red-500 pl-1">
                                    {errors.username.message}
                                </span>
                            )}
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <div className="relative">
                                <input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Пароль"
                                    autoComplete="new-password"
                                    className={`
                                        w-full h-[52px] px-4 pr-12 text-[15px] text-[#1a1a1a]
                                        bg-white border rounded-xl outline-none
                                        transition-colors duration-150
                                        placeholder:text-[#9299a2]
                                        ${
                                            errors.password
                                                ? "border-red-400 focus:border-red-400"
                                                : "border-[#dce0e5] hover:border-[#b8bfc7] focus:border-[#548af7]"
                                        }
                                    `}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9299a2] hover:text-[#6b7280] transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="size-[18px]" />
                                    ) : (
                                        <EyeIcon className="size-[18px]" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <span className="text-[13px] text-red-500 pl-1">
                                    {errors.password.message}
                                </span>
                            )}

                            {/* Password strength hints */}
                            {showPasswordHints && (
                                <div className="flex flex-col gap-1 mt-1 pl-1">
                                    {passwordRules.map((rule) => {
                                        const passed = rule.test(passwordValue);
                                        return (
                                            <div
                                                key={rule.label}
                                                className="flex items-center gap-1.5"
                                            >
                                                {passed ? (
                                                    <CheckIcon className="size-3.5 text-emerald-500" />
                                                ) : (
                                                    <XMarkIcon className="size-3.5 text-[#c4c9d1]" />
                                                )}
                                                <span
                                                    className={`text-[12px] ${
                                                        passed
                                                            ? "text-emerald-600"
                                                            : "text-[#9299a2]"
                                                    }`}
                                                >
                                                    {rule.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="flex flex-col gap-1.5">
                            <div className="relative">
                                <input
                                    {...register("confirmPassword")}
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Повторите пароль"
                                    autoComplete="new-password"
                                    className={`
                                        w-full h-[52px] px-4 pr-12 text-[15px] text-[#1a1a1a]
                                        bg-white border rounded-xl outline-none
                                        transition-colors duration-150
                                        placeholder:text-[#9299a2]
                                        ${
                                            errors.confirmPassword
                                                ? "border-red-400 focus:border-red-400"
                                                : "border-[#dce0e5] hover:border-[#b8bfc7] focus:border-[#548af7]"
                                        }
                                    `}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9299a2] hover:text-[#6b7280] transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirm ? (
                                        <EyeSlashIcon className="size-[18px]" />
                                    ) : (
                                        <EyeIcon className="size-[18px]" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <span className="text-[13px] text-red-500 pl-1">
                                    {errors.confirmPassword.message}
                                </span>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="
                                w-full h-[52px] mt-1 rounded-xl
                                bg-[#548af7] text-white font-semibold text-[15px]
                                hover:bg-[#4678e0] active:bg-[#3b6ad4]
                                disabled:opacity-60 disabled:cursor-not-allowed
                                transition-colors duration-150
                                flex items-center justify-center
                            "
                        >
                            {loading ? (
                                <Spinner className="size-5 animate-spin" />
                            ) : (
                                "Создать аккаунт"
                            )}
                        </button>
                    </form>

                    <SocialAuthButtons />
                </div>

                {/* Login link */}
                <div className="text-center mt-6 text-[14px] text-[#9299a2]">
                    Уже есть аккаунт?{" "}
                    <Link
                        to="/login"
                        className="text-[#548af7] hover:text-[#4678e0] font-medium transition-colors"
                    >
                        Войти
                    </Link>
                </div>
            </div>
        </div>
    );
}

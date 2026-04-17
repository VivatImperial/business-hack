import { useState, useRef, useCallback, useEffect } from "react";
import {
    CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { Input } from "@/shared/ui/input";
import { motion, springPop } from "@/shared/animations/motion";
import {
    startPhoneRegistration,
    submitPhoneCode,
    submitPhonePassword,
} from "@/lib/auth";
import { getDisplayError } from "@/shared/lib/get-display-error";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import {
    COUNTRIES,
    DEFAULT_COUNTRY,
    findCountryByDialCode,
} from "@/features/auth/constants";
import type { CountryEntry } from "@/features/auth/constants";
import { Spinner } from "@/shared/ui/spinner";

interface PhoneAuthProps {
    onSuccess: (token: string, tenantId: number, isNewUser: boolean) => void;
}

type Step = "phone" | "code" | "password" | "success";

/** Format raw digits like "79991234567" → "+7 999 123 45 67" */
function formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, "");
    if (d.length === 0) return "+";
    // Try to find country to know dial code length
    const match = findCountryByDialCode(`+${d}`);
    const codeLen = match ? match.dialCode.replace("+", "").length : 1;
    const code = d.slice(0, codeLen);
    const rest = d.slice(codeLen);
    // Group the rest in chunks: 3 3 2 2 (common pattern)
    const parts: string[] = [];
    let i = 0;
    for (const len of [3, 3, 2, 2, 2, 2]) {
        if (i >= rest.length) break;
        parts.push(rest.slice(i, i + len));
        i += len;
    }
    if (i < rest.length) parts.push(rest.slice(i));
    return `+${code}${parts.length > 0 ? " " : ""}${parts.join(" ")}`;
}

/** Extract raw digits from formatted string, keeping leading context */
function stripToDigits(value: string): string {
    return value.replace(/\D/g, "");
}

export function PhoneAuth({ onSuccess }: PhoneAuthProps) {
    const [step, setStep] = useState<Step>("phone");
    const [country, setCountry] = useState<CountryEntry>(DEFAULT_COUNTRY);
    // Raw digits without "+" (e.g. "79991234567")
    const [rawDigits, setRawDigits] = useState(
        DEFAULT_COUNTRY.dialCode.replace("+", ""),
    );
    const [countrySearch, setCountrySearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const codeInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fullPhone = `+${rawDigits}`;
    const displayPhone = formatPhone(rawDigits);
    const dialCodeLen = country.dialCode.replace("+", "").length;
    const hasNumber = rawDigits.length > dialCodeLen;

    // Close dropdown on outside click
    useEffect(() => {
        if (!showDropdown) return;
        const handler = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
                setCountrySearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showDropdown]);

    const handlePhoneChange = useCallback((value: string) => {
        const digits = stripToDigits(value);
        setRawDigits(digits);
        const match = findCountryByDialCode(`+${digits}`);
        if (match) setCountry(match);
    }, []);

    const handlePhonePaste = useCallback((e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").trim();
        if (pasted.startsWith("+") || /^\d{7,}$/.test(pasted)) {
            e.preventDefault();
            const digits = stripToDigits(pasted);
            setRawDigits(digits);
            const match = findCountryByDialCode(`+${digits}`);
            if (match) setCountry(match);
        }
    }, []);

    const selectCountry = useCallback(
        (c: CountryEntry) => {
            setCountry(c);
            const newCode = c.dialCode.replace("+", "");
            // Keep existing number after dial code, or just set the code
            const currentLocalPart = rawDigits.slice(dialCodeLen);
            setRawDigits(newCode + currentLocalPart);
            setShowDropdown(false);
            setCountrySearch("");
            phoneInputRef.current?.focus();
        },
        [rawDigits, dialCodeLen],
    );

    const handlePhoneSubmit = useCallback(async () => {
        if (!hasNumber) return;
        setLoading(true);
        try {
            const result = await startPhoneRegistration(fullPhone);
            setSessionId(result.session_id);
            setStep("code");
            setTimeout(() => codeInputRef.current?.focus(), 100);
        } catch (err: unknown) {
            snackbarStore.showError(getDisplayError(err, "Не удалось отправить код"));
        } finally {
            setLoading(false);
        }
    }, [fullPhone, hasNumber]);

    const handleCodeSubmit = useCallback(
        async (codeValue: string) => {
            if (!sessionId || codeValue.length < 5) return;
            setLoading(true);
            try {
                const result = await submitPhoneCode(sessionId, codeValue);
                if (result.status === "waiting_password") {
                    setStep("password");
                } else if (
                    result.status === "success" &&
                    result.access_token &&
                    result.tenant_id != null
                ) {
                    setStep("success");
                    setTimeout(
                        () =>
                            onSuccess(
                                result.access_token!,
                                result.tenant_id!,
                                !!result.is_new_user,
                            ),
                        500,
                    );
                }
            } catch (err: unknown) {
                snackbarStore.showError(getDisplayError(err, "Неверный код"));
            } finally {
                setLoading(false);
            }
        },
        [sessionId, onSuccess],
    );

    const handleCodeChange = useCallback(
        (value: string) => {
            const digits = value.replace(/\D/g, "").slice(0, 6);
            setCode(digits);
            if (digits.length >= 5) handleCodeSubmit(digits);
        },
        [handleCodeSubmit],
    );

    const handlePasswordSubmit = useCallback(async () => {
        if (!sessionId || !password.trim()) return;
        setLoading(true);
        try {
            const result = await submitPhonePassword(sessionId, password);
            if (
                result.status === "success" &&
                result.access_token &&
                result.tenant_id != null
            ) {
                setStep("success");
                setTimeout(
                    () =>
                        onSuccess(
                            result.access_token!,
                            result.tenant_id!,
                            !!result.is_new_user,
                        ),
                    500,
                );
            }
        } catch (err: unknown) {
            snackbarStore.showError(getDisplayError(err, "Неверный пароль"));
        } finally {
            setLoading(false);
        }
    }, [sessionId, password, onSuccess]);

    const filteredCountries = countrySearch
        ? COUNTRIES.filter(
              (c) =>
                  c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                  c.dialCode.includes(countrySearch) ||
                  c.code.toLowerCase().includes(countrySearch.toLowerCase()),
          )
        : COUNTRIES;

    const stepTransition = {
        duration: 0.18,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    };

    // ── Success ──
    if (step === "success") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={stepTransition}
                className="flex flex-col items-center justify-center gap-3 py-10"
            >
                <motion.div
                    variants={springPop}
                    initial="hidden"
                    animate="show"
                    className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10"
                >
                    <CheckCircleIcon className="size-8 text-emerald-500" />
                </motion.div>
                <h3 className="text-[15px] font-semibold text-foreground">
                    Вход выполнен
                </h3>
            </motion.div>
        );
    }

    // ── 2FA Password ──
    if (step === "password") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={stepTransition}
                className="flex w-full flex-col items-center gap-4"
            >
                <div className="text-center">
                    <h3 className="text-[15px] font-semibold text-foreground">
                        Двухэтапная аутентификация
                    </h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        Ваш аккаунт защищён паролем
                    </p>
                </div>
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    className="h-[54px] rounded-xl text-[15px]"
                    onKeyDown={(e) =>
                        e.key === "Enter" && handlePasswordSubmit()
                    }
                />
                <button
                    type="button"
                    onClick={handlePasswordSubmit}
                    disabled={loading || !password.trim()}
                    className="h-[54px] w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                    {loading ? (
                        <Spinner className="mx-auto size-5 animate-spin" />
                    ) : (
                        "Подтвердить"
                    )}
                </button>
            </motion.div>
        );
    }

    // ── Code Input ──
    if (step === "code") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={stepTransition}
                className="flex w-full flex-col items-center gap-4"
            >
                <div className="text-center">
                    <p className="text-[15px] font-semibold text-foreground">
                        {displayPhone}
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        Мы отправили код подтверждения в Telegram
                    </p>
                </div>
                <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="Код"
                    className="h-[54px] w-full rounded-xl border border-border bg-background px-4 text-[15px] text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
                    autoFocus
                    disabled={loading}
                />
                {loading && (
                    <Spinner className="size-5 animate-spin text-primary" />
                )}
            </motion.div>
        );
    }

    // ── Phone Input (default) ──
    return (
        <div className="flex w-full flex-col items-center gap-4">
            {/* Country selector */}
            <div className="relative w-full" ref={dropdownRef}>
                <input
                    type="text"
                    value={
                        showDropdown
                            ? countrySearch
                            : `${country.flag} ${country.name}`
                    }
                    onChange={(e) => {
                        setCountrySearch(e.target.value);
                        if (!showDropdown) setShowDropdown(true);
                    }}
                    onFocus={() => {
                        setShowDropdown(true);
                        setCountrySearch("");
                    }}
                    placeholder="Страна"
                    className="h-[54px] w-full rounded-xl border border-border bg-background px-4 text-[15px] text-foreground outline-none transition-colors focus:border-primary"
                />

                {showDropdown && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[240px] overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
                        {filteredCountries.map((c, i) => (
                            <button
                                key={`${c.code}-${c.dialCode}-${i}`}
                                type="button"
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-muted"
                                onClick={() => selectCountry(c)}
                            >
                                <span className="shrink-0 text-[18px]">
                                    {c.flag}
                                </span>
                                <span className="flex-1 text-foreground">
                                    {c.name}
                                </span>
                                <span className="text-muted-foreground">
                                    {c.dialCode}
                                </span>
                            </button>
                        ))}
                        {filteredCountries.length === 0 && (
                            <div className="px-4 py-3 text-[13px] text-muted-foreground">
                                Ничего не найдено
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Single phone input with formatting */}
            <input
                ref={phoneInputRef}
                type="tel"
                value={displayPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onPaste={handlePhonePaste}
                placeholder="+7"
                className="h-[54px] w-full rounded-xl border border-border bg-background px-4 text-[15px] text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
                onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                autoFocus
            />

            {/* Submit */}
            <button
                type="button"
                onClick={handlePhoneSubmit}
                disabled={loading || !hasNumber}
                className="h-[54px] w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
                {loading ? (
                    <Spinner className="mx-auto size-5 animate-spin" />
                ) : (
                    "Далее"
                )}
            </button>
        </div>
    );
}

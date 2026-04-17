import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import { TelegramQrInstructions } from "@/shared/ui/telegram-qr-instructions";
import { BASE_URL } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { getDisplayError, getDisplayErrorFromString } from "@/shared/lib/get-display-error";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { COUNTRIES, DEFAULT_COUNTRY, findCountryByDialCode } from "@/features/auth/constants";
import type { CountryEntry } from "@/features/auth/constants";

interface TelegramConnectFlowProps {
    tenantId: number;
    onSuccess: (stringSession: string) => void;
    phoneOnly?: boolean;
}

type View = "qr" | "phone";
type QrState = "idle" | "loading" | "scanning" | "password" | "success" | "error";
type PhoneStep = "input" | "code" | "password" | "success";

function formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, "");
    if (d.length === 0) return "+";
    const match = findCountryByDialCode(`+${d}`);
    const codeLen = match ? match.dialCode.replace("+", "").length : 1;
    const code = d.slice(0, codeLen);
    const rest = d.slice(codeLen);
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

export function TelegramConnectFlow({
    tenantId,
    onSuccess,
    phoneOnly = false,
}: TelegramConnectFlowProps) {
    const token = getToken();
    const [view, setView] = useState<View>(phoneOnly ? "phone" : "qr");

    // ── QR state ──
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [qrState, setQrState] = useState<QrState>("idle");
    const [qrPassword, setQrPassword] = useState("");
    const [qrSubmitting, setQrSubmitting] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const didAutoFetch = useRef(false);

    // ── Phone state ──
    const [phoneStep, setPhoneStep] = useState<PhoneStep>("input");
    const [country, setCountry] = useState<CountryEntry>(DEFAULT_COUNTRY);
    const [rawDigits, setRawDigits] = useState(DEFAULT_COUNTRY.dialCode.replace("+", ""));
    const [countrySearch, setCountrySearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [phoneCode, setPhoneCode] = useState("");
    const [phonePassword, setPhonePassword] = useState("");
    const [phoneLoading, setPhoneLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const codeInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);

    const fullPhone = `+${rawDigits}`;
    const displayPhone = formatPhone(rawDigits);
    const dialCodeLen = country.dialCode.replace("+", "").length;
    const hasNumber = rawDigits.length > dialCodeLen;

    const stopPolling = useCallback(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }, []);
    useEffect(() => () => stopPolling(), [stopPolling]);

    // Close country dropdown on outside click
    useEffect(() => {
        if (!showDropdown) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
                setCountrySearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showDropdown]);

    // ── QR methods ──
    const checkQrStatus = useCallback(async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/tenants/${tenantId}/telegram/qr/status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.status === "success" && data.string_session) {
                stopPolling();
                setQrState("success");
                setQrUrl(null);
                setTimeout(() => onSuccess(data.string_session), 500);
            } else if (data.status === "waiting_qr" && data.url) {
                                setQrUrl((prev) => (prev !== data.url ? data.url : prev));
            } else if (data.status === "waiting_password") {
                stopPolling();
                setQrState("password");
                setQrUrl(null);
                            } else if (data.status === "failed") {
                stopPolling();
                setQrUrl(null);
                snackbarStore.showError(getDisplayErrorFromString(data.error, "Не удалось подключиться"));
                setQrState("error");
            }
        } catch { /* transient */ }
    }, [tenantId, token, stopPolling, onSuccess]);

    const startQr = useCallback(async () => {
        setQrState("loading");
                setQrUrl(null);
        setQrPassword("");
        try {
            const res = await fetch(`${BASE_URL}/api/tenants/${tenantId}/telegram/qr/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({}),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail ?? `Ошибка ${res.status}`);
            }
            const data = await res.json();
            setQrUrl(data.url);
            setQrState("scanning");
            pollRef.current = setInterval(checkQrStatus, 3000);
        } catch (err: unknown) {
            snackbarStore.showError(getDisplayError(err, "Не удалось получить QR-код"));
            setQrState("error");
        }
    }, [tenantId, token, checkQrStatus]);

    const submitQrPassword = useCallback(async () => {
        if (!qrPassword.trim()) return;
        setQrSubmitting(true);
                try {
            const res = await fetch(`${BASE_URL}/api/tenants/${tenantId}/telegram/qr/password`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ password: qrPassword }),
            });
            const data = res.ok ? await res.json() : null;
            if (!res.ok) throw new Error(data?.detail ?? "Ошибка 2FA");
            if (data?.status === "success" && data.string_session) {
                setQrState("success");
                setTimeout(() => onSuccess(data.string_session), 500);
                return;
            }
            throw new Error("Не удалось подтвердить пароль");
        } catch (err: unknown) {
            snackbarStore.showError(getDisplayError(err, "Ошибка 2FA"));
        } finally {
            setQrSubmitting(false);
        }
    }, [tenantId, token, qrPassword, onSuccess]);

    // ── Phone methods (authenticated — /tenants/{id}/telegram/phone/*) ──
    const handlePhoneSubmit = useCallback(async () => {
        if (!hasNumber) return;
        setPhoneLoading(true);
                try {
            const res = await fetch(`${BASE_URL}/api/tenants/${tenantId}/telegram/phone/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ phone: fullPhone }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail ?? `Ошибка ${res.status}`);
            }
            setPhoneStep("code");
            setTimeout(() => codeInputRef.current?.focus(), 100);
        } catch (err: unknown) {
            snackbarStore.showError(getDisplayError(err, "Не удалось отправить код"));
        } finally {
            setPhoneLoading(false);
        }
    }, [tenantId, token, fullPhone, hasNumber]);

    const handlePhoneCode = useCallback(async (codeValue: string) => {
        if (codeValue.length < 5) return;
        setPhoneLoading(true);
                try {
            const res = await fetch(`${BASE_URL}/api/tenants/${tenantId}/telegram/phone/code`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ code: codeValue }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail ?? "Неверный код");
            }
            const data = await res.json();
            if (data.status === "waiting_password") {
                setPhoneStep("password");
            } else if (data.status === "success" && data.string_session) {
                setPhoneStep("success");
                setTimeout(() => onSuccess(data.string_session), 500);
            }
        } catch (err: unknown) {
            snackbarStore.showError(getDisplayError(err, "Неверный код"));
        } finally {
            setPhoneLoading(false);
        }
    }, [tenantId, token, onSuccess]);

    const handlePhonePassword = useCallback(async () => {
        if (!phonePassword.trim()) return;
        setPhoneLoading(true);
                try {
            const res = await fetch(`${BASE_URL}/api/tenants/${tenantId}/telegram/phone/password`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ password: phonePassword }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail ?? "Неверный пароль");
            }
            const data = await res.json();
            if (data.status === "success" && data.string_session) {
                setPhoneStep("success");
                setTimeout(() => onSuccess(data.string_session), 500);
            }
        } catch (err: unknown) {
            snackbarStore.showError(getDisplayError(err, "Ошибка 2FA"));
        } finally {
            setPhoneLoading(false);
        }
    }, [tenantId, token, phonePassword, onSuccess]);

    const handleCodeChange = useCallback((value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 6);
        setPhoneCode(digits);
        if (digits.length >= 5) handlePhoneCode(digits);
    }, [handlePhoneCode]);

    const handlePhoneChange = useCallback((value: string) => {
        const digits = value.replace(/\D/g, "");
        setRawDigits(digits);
        const match = findCountryByDialCode(`+${digits}`);
        if (match) setCountry(match);
    }, []);

    const selectCountry = useCallback((c: CountryEntry) => {
        setCountry(c);
        const newCode = c.dialCode.replace("+", "");
        const currentLocalPart = rawDigits.slice(dialCodeLen);
        setRawDigits(newCode + currentLocalPart);
        setShowDropdown(false);
        setCountrySearch("");
        phoneInputRef.current?.focus();
    }, [rawDigits, dialCodeLen]);

    const filteredCountries = countrySearch
        ? COUNTRIES.filter((c) =>
            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
            c.dialCode.includes(countrySearch) ||
            c.code.toLowerCase().includes(countrySearch.toLowerCase()))
        : COUNTRIES;

    // Auto-start QR
    useEffect(() => {
        if (view === "qr" && !didAutoFetch.current && qrState === "idle") {
            didAutoFetch.current = true;
            startQr();
        }
    }, [view, qrState, startQr]);

    // ── Shared states ──
    const isSuccess = qrState === "success" || phoneStep === "success";
    if (isSuccess) {
        return (
            <div className="flex w-full max-w-[380px] flex-col items-center gap-3 py-8">
                <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircleIcon className="size-8 text-emerald-500" />
                </div>
                <p className="text-[15px] font-semibold text-foreground">Аккаунт подключён</p>
            </div>
        );
    }

    // ── QR 2FA Password ──
    if (qrState === "password") {
        return (
            <div className="flex w-full max-w-[380px] flex-col items-center gap-4 py-4">
                <div className="text-center">
                    <h3 className="text-[15px] font-semibold text-foreground">Двухэтапная аутентификация</h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">Ваш аккаунт защищён паролем</p>
                </div>
                <Input type="password" value={qrPassword} onChange={(e) => setQrPassword(e.target.value)} placeholder="Пароль" className="h-[54px] rounded-xl text-center text-[15px]" onKeyDown={(e) => e.key === "Enter" && submitQrPassword()} />
                <button type="button" onClick={submitQrPassword} disabled={qrSubmitting} className="h-[54px] w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                    {qrSubmitting ? <Spinner className="mx-auto size-5 animate-spin" /> : "Подтвердить"}
                </button>
            </div>
        );
    }

    // ── Phone view ──
    if (view === "phone") {
        // Phone 2FA
        if (phoneStep === "password") {
            return (
                <div className="flex w-full max-w-[380px] flex-col items-center gap-4 py-4">
                    <div className="text-center">
                        <h3 className="text-[15px] font-semibold text-foreground">Двухэтапная аутентификация</h3>
                        <p className="mt-1 text-[13px] text-muted-foreground">Ваш аккаунт защищён паролем</p>
                    </div>
                    <Input type="password" value={phonePassword} onChange={(e) => setPhonePassword(e.target.value)} placeholder="Пароль" className="h-[54px] rounded-xl text-center text-[15px]" onKeyDown={(e) => e.key === "Enter" && handlePhonePassword()} />
                    <button type="button" onClick={handlePhonePassword} disabled={phoneLoading} className="h-[54px] w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                        {phoneLoading ? <Spinner className="mx-auto size-5 animate-spin" /> : "Подтвердить"}
                    </button>
                </div>
            );
        }
        // Phone code
        if (phoneStep === "code") {
            return (
                <div className="flex w-full max-w-[380px] flex-col items-center gap-4 py-4">
                    <div className="text-center">
                        <p className="text-[15px] font-semibold text-foreground">{displayPhone}</p>
                        <p className="mt-1 text-[13px] text-muted-foreground">Мы отправили код подтверждения в Telegram</p>
                    </div>
                    <input ref={codeInputRef} type="text" inputMode="numeric" value={phoneCode} onChange={(e) => handleCodeChange(e.target.value)} placeholder="Код" className="h-[54px] w-full rounded-xl border border-border bg-background text-center text-[22px] font-mono tracking-[0.3em] outline-none transition-colors focus:border-primary" autoFocus disabled={phoneLoading} />
                    {phoneLoading && <Spinner className="size-5 animate-spin text-primary" />}
                </div>
            );
        }
        // Phone input
        return (
            <div className="flex w-full max-w-[380px] flex-col items-center gap-4 py-4">
                <div className="relative w-full" ref={dropdownRef}>
                    <input type="text" value={showDropdown ? countrySearch : `${country.flag} ${country.name}`} onChange={(e) => { setCountrySearch(e.target.value); if (!showDropdown) setShowDropdown(true); }} onFocus={() => { setShowDropdown(true); setCountrySearch(""); }} placeholder="Страна" className="h-[54px] w-full rounded-xl border border-border bg-background px-4 text-[15px] text-foreground outline-none transition-colors focus:border-primary" />
                    {showDropdown && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[240px] overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
                            {filteredCountries.map((c, i) => (
                                <button key={`${c.code}-${c.dialCode}-${i}`} type="button" className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-muted" onClick={() => selectCountry(c)}>
                                    <span className="shrink-0 text-[18px]">{c.flag}</span>
                                    <span className="flex-1 text-foreground">{c.name}</span>
                                    <span className="text-muted-foreground">{c.dialCode}</span>
                                </button>
                            ))}
                            {filteredCountries.length === 0 && <div className="px-4 py-3 text-[13px] text-muted-foreground">Ничего не найдено</div>}
                        </div>
                    )}
                </div>
                <input ref={phoneInputRef} type="tel" value={displayPhone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="+7" className="h-[54px] w-full rounded-xl border border-border bg-background px-4 text-[15px] text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground" onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()} autoFocus />
                <button type="button" onClick={handlePhoneSubmit} disabled={phoneLoading || !hasNumber} className="h-[54px] w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                    {phoneLoading ? <Spinner className="mx-auto size-5 animate-spin" /> : "Далее"}
                </button>
                {!phoneOnly && (
                    <button type="button" onClick={() => { setView("qr"); if (qrState === "idle" || qrState === "error") didAutoFetch.current = false; }} className="mt-2 text-[14px] font-medium uppercase tracking-[0.06em] text-primary transition-colors hover:text-primary/80">
                        Вход по QR-коду
                    </button>
                )}
            </div>
        );
    }

    // ── QR view (default) ──
    return (
        <div className="flex w-full max-w-[380px] flex-col items-center gap-6 py-4">
            <div className="relative rounded-3xl bg-card p-5 shadow-sm border border-border/40">
                {qrUrl ? (
                    <>
                        <QRCodeSVG value={qrUrl} size={220} level="M" />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-[#3390ec] shadow-lg ring-4 ring-card">
                                <svg className="size-7 text-white" viewBox="21 16 80 80" fill="currentColor">
                                    <path d="M23.775 58.77a3278.85 3278.85 0 0 1 39.27-16.223c18.698-7.454 21.3-8.542 23.828-8.58a4.995 4.995 0 0 1 2.977 1.103c1.058.9 1.38 1.47 1.47 1.972.083.503.075 2.07-.015 2.963-1.013 10.207-4.86 33.78-7.088 45.225-.945 4.837-2.805 6.457-4.605 6.615-3.907.345-6.877-2.475-10.664-4.86-5.925-3.728-7.905-5.1-13.65-8.737-6.653-4.2-3.916-5.663-.128-9.436.99-.982 17.415-15.974 17.662-17.34.21-1.2.286-1.357-.254-1.897-.548-.54-1.2-.473-1.62-.383-.6.128-9.645 5.85-27.15 17.176-2.685 1.777-5.115 2.64-7.298 2.595-2.4-.053-7.027-1.305-10.462-2.378-4.223-1.32-7.575-2.01-7.275-4.245.15-1.163 1.814-2.355 5.002-3.57Z" fill="#FFF" />
                                </svg>
                            </div>
                        </div>
                    </>
                ) : qrState === "loading" ? (
                    <div className="flex size-[220px] items-center justify-center">
                        <Spinner className="size-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex size-[220px] items-center justify-center">
                        <button type="button" onClick={startQr} className="text-[14px] text-primary hover:underline">Получить QR-код</button>
                    </div>
                )}
            </div>
            <TelegramQrInstructions />
            <button type="button" onClick={() => setView("phone")} className="text-[14px] font-medium uppercase tracking-[0.06em] text-primary transition-colors hover:text-primary/80">
                Вход по номеру телефона
            </button>
        </div>
    );
}

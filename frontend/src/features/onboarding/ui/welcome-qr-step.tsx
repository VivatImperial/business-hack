import {
    LockClosedIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/shared/ui/input";
import { TelegramQrInstructions } from "@/shared/ui/telegram-qr-instructions";
import { getToken } from "@/lib/auth";
import { BASE_URL } from "@/lib/api/client";
import { getDisplayError } from "@/shared/lib/get-display-error";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { Spinner } from "@/shared/ui/spinner";

interface WelcomeQrStepProps {
    tenantId: number;
    hasActiveSession: boolean;
    onComplete: () => void;
}

export function WelcomeQrStep({
    tenantId,
    hasActiveSession,
    onComplete,
}: WelcomeQrStepProps) {
    const token = getToken();
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [, setLoadingQr] = useState(false);
    const [waitingForQrPassword, setWaitingForQrPassword] = useState(false);
    const [qrPassword, setQrPassword] = useState("");
    const [submittingQrPassword, setSubmittingQrPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stopPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    };

    const clearRetry = () => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            stopPolling();
            clearRetry();
        };
    }, []);

    useEffect(() => {
        if (hasActiveSession) {
            setSuccess(true);
            stopPolling();
            clearRetry();
        }
    }, [hasActiveSession]);

    const handleSuccess = () => {
        setSuccess(true);
        stopPolling();
        clearRetry();
        // Slight delay for celebration
        setTimeout(() => onComplete(), 700);
    };

    const checkQrStatus = async () => {
        try {
            const res = await fetch(
                `${BASE_URL}/api/tenants/${tenantId}/telegram/qr/status`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            if (!res.ok) return;

            const resData = await res.json();
            if (resData.status === "success" && resData.string_session) {
                handleSuccess();
            } else if (resData.status === "waiting_qr" && resData.url) {
                                setQrUrl((prev) => (prev !== resData.url ? resData.url : prev));
            } else if (resData.status === "waiting_password") {
                stopPolling();
                setWaitingForQrPassword(true);
                setQrUrl(null);
                            } else if (resData.status === "failed") {
                stopPolling();
                setQrUrl(null);
                scheduleRetry();
            }
        } catch (err) {
            console.error("Error checking QR status", err);
        }
    };

    const handleGetQr = async () => {
        clearRetry();
        setLoadingQr(true);
                setQrUrl(null);
        setQrPassword("");
        setWaitingForQrPassword(false);

        try {
            const res = await fetch(
                `${BASE_URL}/api/tenants/${tenantId}/telegram/qr/start`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({}),
                },
            );

            if (!res.ok) {
                const ct = res.headers.get("content-type") || "";
                if (ct.includes("application/json")) {
                    const errData = await res.json();
                    let msg = "";
                    if (Array.isArray(errData.detail)) {
                        msg = errData.detail
                            .map((e: { msg: string }) => e.msg)
                            .join("; ");
                    } else if (typeof errData.detail === "string") {
                        msg = errData.detail;
                    }
                    throw new Error(msg);
                }
                throw new Error("");
            }

            const resData = await res.json();
            setQrUrl(resData.url);
            pollInterval.current = setInterval(checkQrStatus, 3000);
        } catch (err: unknown) {
            snackbarStore.showError(getDisplayError(err, "Не удалось получить QR-код"));
            scheduleRetry();
        } finally {
            setLoadingQr(false);
        }
    };

    const scheduleRetry = (seconds = 5) => {
        clearRetry();
        retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            handleGetQr();
        }, seconds * 1000);
    };

    const handleSubmitQrPassword = async () => {
        if (!qrPassword.trim()) {
            snackbarStore.showError("Введите пароль двухэтапной аутентификации");
            return;
        }
        setSubmittingQrPassword(true);
                try {
            const res = await fetch(
                `${BASE_URL}/api/tenants/${tenantId}/telegram/qr/password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ password: qrPassword }),
                },
            );
            const ct = res.headers.get("content-type") || "";
            const resData = ct.includes("application/json")
                ? await res.json()
                : null;
            if (!res.ok) {
                throw new Error(resData?.detail ?? "");
            }
            if (resData?.status === "success" && resData.string_session) {
                handleSuccess();
                return;
            }
            throw new Error("Сервер не вернул сессию после ввода 2FA");
        } catch (err: unknown) {
            snackbarStore.showError(getDisplayError(err, "Не удалось подтвердить пароль 2FA"));
        } finally {
            setSubmittingQrPassword(false);
        }
    };

    // Auto-fetch QR on mount when no active session
    const didAutoFetch = useRef(false);
    useEffect(() => {
        if (hasActiveSession || didAutoFetch.current) return;
        didAutoFetch.current = true;
        handleGetQr();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasActiveSession]);

    if (success || hasActiveSession) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircleIcon className="size-8 text-emerald-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-[15px] font-semibold text-foreground">
                        Аккаунт подключён
                    </h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        Telegram готов к работе
                    </p>
                </div>
            </div>
        );
    }

    if (waitingForQrPassword) {
        return (
            <div className="mx-auto flex w-full flex-col items-center gap-4 py-2">
                <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/10">
                    <LockClosedIcon className="size-6 text-blue-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-[15px] font-semibold text-foreground">
                        Двухэтапная аутентификация
                    </h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        Telegram запросил пароль вашего аккаунта
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3">
                    <Input
                        type="password"
                        value={qrPassword}
                        onChange={(e) => setQrPassword(e.target.value)}
                        placeholder="Введите пароль"
                        className="h-12 rounded-xl text-center text-[15px]"
                        onKeyDown={(e) =>
                            e.key === "Enter" && handleSubmitQrPassword()
                        }
                    />
                    <button
                        type="button"
                        onClick={handleSubmitQrPassword}
                        disabled={submittingQrPassword}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-500 text-[14px] font-semibold text-white transition-colors hover:bg-[#2599d3] active:bg-[#218bbf] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submittingQrPassword && (
                            <Spinner className="size-4 animate-spin" />
                        )}
                        Подтвердить
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full max-w-[400px] flex-col items-center gap-6 py-1">
            {/* QR */}
            <div className="flex flex-col items-center gap-2">
                <div className="relative rounded-2xl border border-slate-200 bg-white p-4">
                    {qrUrl ? (
                        <>
                            <QRCodeSVG value={qrUrl} size={180} level="M" />
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="flex size-11 items-center justify-center rounded-full bg-[#3390ec] shadow-lg ring-4 ring-white">
                                    <svg
                                        className="size-5 text-white"
                                        viewBox="21 16 80 80"
                                        fill="currentColor"
                                    >
                                        <path d="M23.775 58.77a3278.85 3278.85 0 0 1 39.27-16.223c18.698-7.454 21.3-8.542 23.828-8.58a4.995 4.995 0 0 1 2.977 1.103c1.058.9 1.38 1.47 1.47 1.972.083.503.075 2.07-.015 2.963-1.013 10.207-4.86 33.78-7.088 45.225-.945 4.837-2.805 6.457-4.605 6.615-3.907.345-6.877-2.475-10.664-4.86-5.925-3.728-7.905-5.1-13.65-8.737-6.653-4.2-3.916-5.663-.128-9.436.99-.982 17.415-15.974 17.662-17.34.21-1.2.286-1.357-.254-1.897-.548-.54-1.2-.473-1.62-.383-.6.128-9.645 5.85-27.15 17.176-2.685 1.777-5.115 2.64-7.298 2.595-2.4-.053-7.027-1.305-10.462-2.378-4.223-1.32-7.575-2.01-7.275-4.245.15-1.163 1.814-2.355 5.002-3.57Z" fill="#FFF" />
                                    </svg>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex size-[180px] items-center justify-center">
                            <Spinner className="size-7 animate-spin text-blue-500" />
                        </div>
                    )}
                </div>
            </div>

            <TelegramQrInstructions />
        </div>
    );
}

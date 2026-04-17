import { useEffect, useRef, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
    CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { Input } from "@/shared/ui/input";
import { motion } from "@/shared/animations/motion";
import { TelegramQrInstructions } from "@/shared/ui/telegram-qr-instructions";
import {
    startQrRegistration,
    checkQrRegistrationStatus,
    submitQrRegistrationPassword,
} from "@/lib/auth";
import { getDisplayError, getDisplayErrorFromString } from "@/shared/lib/get-display-error";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { Spinner } from "@/shared/ui/spinner";

interface QrRegistrationProps {
    onSuccess: (token: string, tenantId: number, isNewUser: boolean) => void;
    qrSize?: number;
    borderless?: boolean;
    hideInstructions?: boolean;
    onPasswordRequired?: (required: boolean) => void;
}

export function QrRegistration({ onSuccess, qrSize = 180, borderless = false, hideInstructions = false, onPasswordRequired }: QrRegistrationProps) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [waitingForPassword, setWaitingForPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [submittingPassword, setSubmittingPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    }, []);

    const clearRetry = useCallback(() => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            stopPolling();
            clearRetry();
        };
    }, [stopPolling, clearRetry]);

    const handleSuccess = useCallback(
        (token: string, tenantId: number, isNewUser: boolean) => {
            setSuccess(true);
            stopPolling();
            clearRetry();
            setTimeout(() => onSuccess(token, tenantId, isNewUser), 500);
        },
        [onSuccess, stopPolling, clearRetry],
    );

    const checkStatus = useCallback(
        async (sid: string) => {
            try {
                const data = await checkQrRegistrationStatus(sid);
                if (data.status === "success" && data.access_token && data.tenant_id != null) {
                    handleSuccess(data.access_token, data.tenant_id, !!data.is_new_user);
                } else if (data.status === "waiting_qr" && data.url) {
                    setQrUrl((prev) => (prev !== data.url ? data.url : prev));
                } else if (data.status === "waiting_password") {
                    stopPolling();
                    setWaitingForPassword(true);
                    setQrUrl(null);
                    onPasswordRequired?.(true);
                } else if (data.status === "failed") {
                    stopPolling();
                    setQrUrl(null);
                    snackbarStore.showError(getDisplayErrorFromString(data.error, "Не ��далось получить QR-код"));
                    scheduleRetry();
                }
            } catch (err) {
                console.error("Error checking QR registration status", err);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [handleSuccess, stopPolling],
    );

    const scheduleRetry = (seconds = 5) => {
        clearRetry();
        retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            handleGetQr();
        }, seconds * 1000);
    };

    const handleGetQr = async () => {
        clearRetry();
        setQrUrl(null);
        setPassword("");
        setWaitingForPassword(false);

        try {
            const data = await startQrRegistration();
            setSessionId(data.session_id);
            setQrUrl(data.url);

            const sid = data.session_id;
            pollInterval.current = setInterval(() => checkStatus(sid), 3000);
        } catch (err: unknown) {
            snackbarStore.showError(getDisplayError(err, "Не удалось получить QR-код"));
            scheduleRetry();
        }
    };

    const handleSubmitPassword = async () => {
        if (!password.trim() || !sessionId) {
            snackbarStore.showError("Введите пароль двухэтапной аутентификации");
            return;
        }
        setSubmittingPassword(true);
        try {
            const data = await submitQrRegistrationPassword(sessionId, password);
            if (data.status === "success" && data.access_token && data.tenant_id != null) {
                handleSuccess(data.access_token, data.tenant_id, !!data.is_new_user);
                return;
            }
            throw new Error("Сервер не вернул сессию после ввода 2FA");
        } catch (err: unknown) {
            snackbarStore.showError(getDisplayError(err, "Ошибка подтверждения 2FA"));
        } finally {
            setSubmittingPassword(false);
        }
    };

    // Auto-fetch QR on mount
    const didAutoFetch = useRef(false);
    useEffect(() => {
        if (didAutoFetch.current) return;
        didAutoFetch.current = true;
        handleGetQr();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (success) {
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

    if (waitingForPassword) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
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
                        e.key === "Enter" && handleSubmitPassword()
                    }
                />
                <button
                    type="button"
                    onClick={handleSubmitPassword}
                    disabled={submittingPassword || !password.trim()}
                    className="h-[54px] w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                    {submittingPassword ? (
                        <Spinner className="mx-auto size-5 animate-spin" />
                    ) : (
                        "Подтвердить"
                    )}
                </button>
            </motion.div>
        );
    }

    return (
        <div className="flex w-full max-w-[400px] flex-col items-center gap-6 py-1">
            {/* QR */}
            <div className="flex flex-col items-center gap-2">
                <div className={borderless ? "relative rounded-3xl bg-white p-5" : "relative rounded-3xl border border-slate-200 bg-white p-5"}>
                    {qrUrl ? (
                        <>
                            <QRCodeSVG value={qrUrl} size={qrSize} level="M" className="rounded-2xl" />
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
                        <div className="flex items-center justify-center" style={{ width: qrSize, height: qrSize }}>
                            <Spinner className="size-7 animate-spin text-blue-500" />
                        </div>
                    )}
                </div>
            </div>

            {!hideInstructions && <TelegramQrInstructions />}
        </div>
    );
}

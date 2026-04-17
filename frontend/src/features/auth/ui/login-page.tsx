import { useRouter, useRouteContext } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { setToken, setTenantId } from "@/lib/auth";
import {
    motion,
    AnimatePresence,
    staggerContainerFast,
    springExpand,
    springPop,
} from "@/shared/animations/motion";
import { TelegramQrInstructions } from "@/shared/ui/telegram-qr-instructions";
import { QrRegistration } from "./qr-registration";
import { PhoneAuth } from "./phone-auth";


function TelegramLogo() {
    return (
        <motion.div
            variants={springPop}
            className="mx-auto flex size-[120px] items-center justify-center rounded-full bg-primary"
        >
            <svg
                className="size-[56px] text-primary-foreground"
                viewBox="21 16 80 80"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M23.775 58.77a3278.85 3278.85 0 0 1 39.27-16.223c18.698-7.454 21.3-8.542 23.828-8.58a4.995 4.995 0 0 1 2.977 1.103c1.058.9 1.38 1.47 1.47 1.972.083.503.075 2.07-.015 2.963-1.013 10.207-4.86 33.78-7.088 45.225-.945 4.837-2.805 6.457-4.605 6.615-3.907.345-6.877-2.475-10.664-4.86-5.925-3.728-7.905-5.1-13.65-8.737-6.653-4.2-3.916-5.663-.128-9.436.99-.982 17.415-15.974 17.662-17.34.21-1.2.286-1.357-.254-1.897-.548-.54-1.2-.473-1.62-.383-.6.128-9.645 5.85-27.15 17.176-2.685 1.777-5.115 2.64-7.298 2.595-2.4-.053-7.027-1.305-10.462-2.378-4.223-1.32-7.575-2.01-7.275-4.245.15-1.163 1.814-2.355 5.002-3.57Z"
                    fill="#FFF"
                />
            </svg>
        </motion.div>
    );
}

type View = "qr" | "phone";

export function LoginPage() {
    const router = useRouter();
    const { isMobile } = useRouteContext({ strict: false });
    // Mobile: phone only. Desktop: QR default with toggle.
    const [view, setView] = useState<View>(isMobile ? "phone" : "qr");
    const [qrPasswordMode, setQrPasswordMode] = useState(false);

    const handleSuccess = useCallback(
        async (token: string, tenantId: number, isNewUser: boolean) => {
            setToken(token);
            setTenantId(tenantId);
            await router.invalidate();
            await router.navigate({
                to: isNewUser ? "/welcome" : "/dashboard",
            });
        },
        [router],
    );

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <div className="flex flex-1 items-start justify-center px-4 pt-20">
                <div className="w-full max-w-[380px]">
                    <AnimatePresence mode="wait">
                        {view === "qr" ? (
                            <motion.div
                                key="qr"
                                variants={staggerContainerFast(0.05)}
                                initial="hidden"
                                animate="show"
                                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                className={`flex flex-col items-center ${qrPasswordMode ? "pt-12" : ""}`}
                            >
                                {qrPasswordMode && <TelegramLogo />}

                                <motion.div variants={springExpand} className={qrPasswordMode ? "mt-7 w-full" : ""}>
                                    <QrRegistration
                                        onSuccess={handleSuccess}
                                        qrSize={280}
                                        borderless
                                        hideInstructions
                                        onPasswordRequired={setQrPasswordMode}
                                    />
                                </motion.div>

                                {!qrPasswordMode && (
                                    <>
                                        <motion.h1
                                            variants={springExpand}
                                            className="mt-3 text-center text-[18px] font-semibold text-foreground"
                                        >
                                            Вход в Пульсар по QR-коду
                                        </motion.h1>

                                        <motion.div variants={springExpand} className="mt-5">
                                            <TelegramQrInstructions />
                                        </motion.div>
                                    </>
                                )}

                                <motion.button
                                    variants={springExpand}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={() => setView("phone")}
                                    className="mt-8 w-full rounded-xl px-6 py-3 text-[14px] font-medium uppercase tracking-[0.06em] text-primary transition-colors hover:bg-primary/10"
                                >
                                    Вход по номеру телефона
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="phone"
                                variants={staggerContainerFast(0.05)}
                                initial="hidden"
                                animate="show"
                                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                className="flex flex-col items-center pt-12"
                            >
                                <TelegramLogo />

                                <motion.h1
                                    variants={springExpand}
                                    className="mt-5 text-center text-[24px] font-semibold text-foreground"
                                >
                                    Пульсар
                                </motion.h1>
                                <motion.p
                                    variants={springExpand}
                                    className="mt-2 text-center text-[14px] text-muted-foreground"
                                >
                                    Проверьте код страны и введите свой номер
                                    телефона
                                </motion.p>

                                <motion.div
                                    variants={springExpand}
                                    className="mt-7 w-full"
                                >
                                    <PhoneAuth onSuccess={handleSuccess} />
                                </motion.div>

                                {/* Toggle to QR — only on desktop */}
                                {!isMobile && (
                                    <motion.button
                                        variants={springExpand}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={() => setView("qr")}
                                        className="mt-8 w-full rounded-xl px-6 py-3 text-[14px] font-medium uppercase tracking-[0.06em] text-primary transition-colors hover:bg-primary/10"
                                    >
                                        Вход по QR-коду
                                    </motion.button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="border-t border-border px-6 py-4"
            >
                <div className="mx-auto flex max-w-[480px] flex-col items-center gap-2 text-center text-[12px] text-muted-foreground">
                    <p>
                        Продолжая, вы соглашаетесь с{" "}
                        <a
                            href="/documents/Политика_конфиденциальности.docx"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                        >
                            Политикой конфиденциальности
                        </a>{" "}
                        и даёте{" "}
                        <a
                            href="/documents/Согласие_на_обработку_персональных_данных1.docx"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                        >
                            Согласие на обработку персональных данных
                        </a>
                    </p>
                </div>
            </motion.footer>
        </div>
    );
}

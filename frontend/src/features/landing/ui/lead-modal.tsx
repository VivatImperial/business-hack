import { type FormEvent, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "@/shared/animations/motion";
import {
    CheckIcon,
    Cog6ToothIcon,
    ShieldCheckIcon,
    BoltIcon,
} from "@heroicons/react/24/solid";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
    MANAGER_CONTACT_URL,
    buildManagerContactUrl,
} from "@/shared/config/contact";

interface LeadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tariffId: string;
    tariffName: string;
    tariffPrice: string;
}

const VALUE_BULLETS = [
    { icon: Cog6ToothIcon, text: "Настроим критерии под ваш продукт" },
    { icon: ShieldCheckIcon, text: "Подключим через MTProto без ботов" },
    { icon: BoltIcon, text: "Первые лиды — в день запуска" },
];

export function LeadModal({
    open,
    onOpenChange,
    tariffName,
    tariffPrice,
}: LeadModalProps) {
    const [tgLogin, setTgLogin] = useState("");

    const normalizedTg = useMemo(
        () => tgLogin.trim().replace(/^@/, ""),
        [tgLogin],
    );

    async function onSubmit(event: FormEvent) {
        event.preventDefault();

        const messageText = `Здравствуйте! Хочу запустить Пульсар.
Тариф: ${tariffName} (${tariffPrice})

Мой ник: @${normalizedTg}`;

        window.open(buildManagerContactUrl(messageText), "_blank");
        onOpenChange(false);
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {open && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.12 }}
                            />
                        </Dialog.Overlay>
                        <Dialog.Content asChild>
                            <motion.div
                                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.12 }}
                            >
                                <motion.div
                                    className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{
                                        duration: 0.15,
                                        ease: "easeOut",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Dialog.Close className="absolute top-4 right-4 rounded-full p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500">
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        >
                                            <path d="M4 4l8 8M12 4l-8 8" />
                                        </svg>
                                        <span className="sr-only">Закрыть</span>
                                    </Dialog.Close>

                                    <div className="mb-5">
                                        <Dialog.Title className="font-heading text-xl font-semibold">
                                            Запустим Пульсар за 1 день
                                        </Dialog.Title>

                                        <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm text-blue-700">
                                            <CheckIcon className="h-3.5 w-3.5" />
                                            {tariffName} — {tariffPrice}
                                        </div>

                                        {/* Value reinforcement bullets */}
                                        <ul className="mt-4 space-y-2">
                                            {VALUE_BULLETS.map((item) => (
                                                <li
                                                    key={item.text}
                                                    className="flex items-center gap-2.5 text-sm text-slate-600"
                                                >
                                                    <item.icon className="h-4 w-4 shrink-0 text-blue-500" />
                                                    {item.text}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <form onSubmit={onSubmit}>
                                        <div>
                                            <label
                                                htmlFor="modal-tg-login"
                                                className="mb-1.5 block text-sm font-medium"
                                            >
                                                Telegram для связи
                                            </label>
                                            <Input
                                                id="modal-tg-login"
                                                placeholder="@username"
                                                value={tgLogin}
                                                onChange={(e) =>
                                                    setTgLogin(e.target.value)
                                                }
                                                autoComplete="off"
                                                required
                                                className="h-11"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-4 w-full rounded-xl h-11"
                                        >
                                            Оставить заявку
                                        </Button>

                                        <p className="mt-2.5 text-center text-xs text-muted-foreground">
                                            Свяжемся в течение 2 часов
                                        </p>

                                        <div className="mt-3 text-center">
                                            <a
                                                href={MANAGER_CONTACT_URL}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 underline-offset-4 hover:underline"
                                            >
                                                или напишите напрямую в Telegram
                                            </a>
                                        </div>
                                    </form>
                                </motion.div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}

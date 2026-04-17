import { useEffect, useLayoutEffect, useState } from "react";
import Cookies from "js-cookie";
import {
    ArrowLongLeftIcon,
    ArrowLongRightIcon,
    XMarkIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "@/shared/animations/motion";

interface TourStep {
    targetId: string;
    eyebrow: string;
    title: string;
    description: string;
}

const RAW_STEPS: Omit<TourStep, "eyebrow">[] = [
    {
        targetId: "dashboard",
        title: "Главная",
        description:
            "Сколько новых клиентов пришло, как меняются цифры день ко дню и сколько средств на счёте — всё на одном экране.",
    },
    {
        targetId: "leads",
        title: "Лиды",
        description:
            "Все найденные клиенты в одном списке. Удобно отмечать, кому уже написали, а кто ещё в работе.",
    },
    {
        targetId: "chats",
        title: "Чаты",
        description:
            "Чаты и каналы, в которых Пульсар ищет вам клиентов. Здесь можно добавить новые или временно отключить старые.",
    },
    {
        targetId: "my-chat",
        title: "Мой чат",
        description:
            "Личный чат в Telegram, в который Пульсар присылает всех найденных клиентов. Можно разложить их по категориям.",
    },
    {
        targetId: "balance",
        title: "Баланс",
        description:
            "Сколько сообщений Пульсар ещё может обработать на вашем тарифе и сколько уже потрачено.",
    },
    {
        targetId: "settings",
        title: "Настройки",
        description:
            "Подключение Telegram, описание клиента, основные параметры. Всё, что нужно настроить один раз.",
    },
    {
        targetId: "guide",
        title: "Руководство",
        description:
            "Пошаговые инструкции и ответы на частые вопросы о том, как пользоваться Пульсаром.",
    },
    {
        targetId: "manager",
        title: "Ваш менеджер",
        description:
            "Если что-то непонятно или нужна помощь — напишите своему персональному менеджеру, он быстро всё подскажет.",
    },
];

const STEPS: TourStep[] = RAW_STEPS.map((step, index) => ({
    ...step,
    eyebrow: `${index + 1} из ${RAW_STEPS.length}`,
}));

const POPOVER_WIDTH = 320;
const POPOVER_GAP = 16;

interface Position {
    top: number;
    left: number;
    arrowTop: number;
}

function computePosition(rect: DOMRect): Position {
    const left = rect.right + POPOVER_GAP;
    const top = Math.max(
        16,
        Math.min(rect.top + rect.height / 2 - 80, window.innerHeight - 240),
    );
    const arrowTop = rect.top + rect.height / 2 - top;
    return { top, left, arrowTop };
}

interface SidebarTourProps {
    initialSeen: boolean;
}

export function SidebarTour({ initialSeen }: SidebarTourProps) {
    const [active, setActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [position, setPosition] = useState<Position | null>(null);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    // Start tour on mount if cookie is missing.
    useEffect(() => {
        if (initialSeen) return;
        // Re-check client cookie too, in case server context was stale.
        if (Cookies.get("sidebar_tour_seen") === "1") return;
        // Defer one frame so the sidebar items are mounted.
        const t = setTimeout(() => setActive(true), 250);
        return () => clearTimeout(t);
    }, [initialSeen]);

    const finish = () => {
        Cookies.set("sidebar_tour_seen", "1", {
            expires: 365,
            path: "/",
            sameSite: "lax",
        });
        setActive(false);
    };

    const handleNext = () => {
        if (stepIndex >= STEPS.length - 1) {
            finish();
            return;
        }
        setStepIndex((i) => i + 1);
    };

    const handleBack = () => {
        if (stepIndex === 0) return;
        setStepIndex((i) => i - 1);
    };

    const currentStep = STEPS[stepIndex];

    // Measure target on step change + on resize/scroll
    useLayoutEffect(() => {
        if (!active) return;
        const measure = () => {
            const el = document.querySelector(
                `[data-tour-target="${currentStep.targetId}"]`,
            );
            if (!el) {
                setTargetRect(null);
                setPosition(null);
                return;
            }
            const rect = el.getBoundingClientRect();
            setTargetRect(rect);
            setPosition(computePosition(rect));
        };
        measure();
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);
        return () => {
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
        };
    }, [active, currentStep.targetId]);

    if (!active || !position || !targetRect) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="tour"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-100 pointer-events-none"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40 pointer-events-auto"
                    onClick={finish}
                />

                {/* Highlight ring around target */}
                <motion.div
                    layout
                    initial={false}
                    animate={{
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                    }}
                    className="absolute rounded-xl ring-2 ring-blue-500 bg-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.0)] pointer-events-none"
                />

                {/* Popover */}
                <motion.div
                    layout
                    initial={false}
                    animate={{ top: position.top, left: position.left }}
                    transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                    }}
                    style={{ width: POPOVER_WIDTH }}
                    className="absolute rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-black/20 pointer-events-auto"
                >
                    {/* Arrow pointing to target */}
                    <div
                        className="absolute -left-2 size-4 rotate-45 bg-white border-l border-b border-slate-200"
                        style={{ top: position.arrowTop - 8 }}
                    />

                    {/* Close */}
                    <button
                        type="button"
                        onClick={finish}
                        className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors"
                        aria-label="Закрыть тур"
                    >
                        <XMarkIcon className="size-4" />
                    </button>

                    <div className="p-5 pr-9">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-500">
                            {currentStep.eyebrow}
                        </span>
                        <h3 className="font-heading text-[18px] font-extrabold tracking-tight text-foreground mt-1">
                            {currentStep.title}
                        </h3>
                        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                            {currentStep.description}
                        </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 px-5 pb-5">
                        <button
                            type="button"
                            onClick={finish}
                            className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Пропустить
                        </button>
                        <div className="flex items-center gap-2">
                            {stepIndex > 0 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-xl border border-slate-200 text-[12px] font-medium text-foreground hover:bg-slate-50 transition-colors"
                                >
                                    <ArrowLongLeftIcon className="size-3.5" />
                                    Назад
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleNext}
                                className="inline-flex items-center justify-center gap-1 h-9 px-4 rounded-xl bg-blue-500 text-white text-[12px] font-semibold hover:bg-[#2599d3] transition-colors"
                            >
                                {stepIndex === STEPS.length - 1
                                    ? "Готово"
                                    : "Дальше"}
                                {stepIndex < STEPS.length - 1 && (
                                    <ArrowLongRightIcon className="size-3.5" />
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

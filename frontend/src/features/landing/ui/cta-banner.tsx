import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "@/shared/animations/motion";

const leads = [
    {
        name: "Дмитрий | Sales",
        nameColor: "#4E9F3D",
        avatar: { initials: "ДС", color: "#4E9F3D" },
        text: "Ищем подрядчика по внедрению CRM, бюджет ~500к. Нужно стартовать в ближайшие 2 недели 🔥",
        time: "14:32",
    },
    {
        name: "Марина Юрист",
        nameColor: "#9B59B6",
        avatar: { initials: "МЮ", color: "#9B59B6" },
        text: "Ищу юриста по банкротству физлиц, Москва. Бюджет 80-120к, нужен опытный 💼",
        time: "15:01",
    },
    {
        name: "Олег Фото",
        nameColor: "#E67E22",
        avatar: { initials: "ОФ", color: "#E67E22" },
        text: "Нужен фотограф на свадьбу 15 июня, Питер. Есть примеры работ? 📸",
        time: "15:18",
    },
    {
        name: "Анна PM",
        nameColor: "#2AABEE",
        avatar: { initials: "АП", color: "#2AABEE" },
        text: "Кто делает таргет для стоматологий? Бюджет от 50к/мес, нужен результат 🎯",
        time: "15:44",
    },
    {
        name: "Сергей Dev",
        nameColor: "#E74C3C",
        avatar: { initials: "СД", color: "#E74C3C" },
        text: "Нужен фрилансер на верстку лендинга, срок — 3 дня. Оплата сразу 💻",
        time: "16:02",
    },
    {
        name: "Елена Дизайн",
        nameColor: "#F39C12",
        avatar: { initials: "ЕД", color: "#F39C12" },
        text: "Ищу дизайнера интерьера для квартиры 80м², Екатеринбург. Бюджет 200к 🏠",
        time: "16:15",
    },
    {
        name: "Илья Маркетинг",
        nameColor: "#1ABC9C",
        avatar: { initials: "ИМ", color: "#1ABC9C" },
        text: "Нужен SMM-щик для ресторана, 30 постов/мес + reels. Готовы платить 40к 📱",
        time: "16:28",
    },
    {
        name: "Ксения HR",
        nameColor: "#8E44AD",
        avatar: { initials: "КХ", color: "#8E44AD" },
        text: "Ищем аутсорс бухгалтерию для ООО, 3 юрлица. Нужен опыт с ВЭД 📊",
        time: "16:41",
    },
    {
        name: "Артём Строй",
        nameColor: "#D35400",
        avatar: { initials: "АС", color: "#D35400" },
        text: "Кто делает натяжные потолки оптом? Объём 50+ объектов/мес, ЮФО 🏗",
        time: "16:55",
    },
    {
        name: "Виктория Бьюти",
        nameColor: "#E91E63",
        avatar: { initials: "ВБ", color: "#E91E63" },
        text: "Нужен косметолог-технолог для обучения персонала, 2 филиала в Казани 💄",
        time: "17:03",
    },
];

export function CtaBanner() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % leads.length);
        }, 1800);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-12 md:py-20">
            <div className="site-container">
                <div className="flex flex-col items-center rounded-[32px] bg-[#f5f5f7] px-6 py-14 text-center sm:px-12 sm:py-20">
                    {/* Animated Telegram-style bubbles */}
                    <div className="relative mb-10 h-[120px] w-full max-w-lg overflow-hidden">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={current}
                                initial={{ y: 70, opacity: 0, scale: 0.92 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: -70, opacity: 0, scale: 0.92 }}
                                transition={{
                                    duration: 0.35,
                                    ease: [0.4, 0, 0.2, 1],
                                }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="flex items-end gap-2">
                                    {/* Avatar */}
                                    <div
                                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                        style={{
                                            backgroundColor:
                                                leads[current].avatar.color,
                                        }}
                                    >
                                        {leads[current].avatar.initials}
                                    </div>
                                    {/* Bubble with tail */}
                                    <div className="relative">
                                        <svg
                                            className="absolute -left-[7px] bottom-0 text-white"
                                            width="11"
                                            height="20"
                                            viewBox="0 0 11 20"
                                            fill="currentColor"
                                        >
                                            <path d="M11 20H0C0 20 5.5 18.5 8 13C10 8.6 11 3.4 11 0V20Z" />
                                        </svg>
                                        <div className="max-w-sm rounded-2xl rounded-bl-none bg-white px-4 py-2.5 text-left shadow-sm">
                                            <p
                                                className="text-[13px] font-semibold"
                                                style={{
                                                    color: leads[current]
                                                        .nameColor,
                                                }}
                                            >
                                                {leads[current].name}
                                            </p>
                                            <div className="mt-0.5 flex items-end gap-2">
                                                <p className="text-[14px] leading-snug text-black">
                                                    {leads[current].text}
                                                </p>
                                                <span className="mb-0.5 shrink-0 text-[11px] text-black/40">
                                                    {leads[current].time}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <h2 className="font-heading text-[28px] font-bold tracking-tight text-black sm:text-4xl md:text-5xl">
                        Найдите клиентов
                        <br />
                        уже сейчас
                    </h2>

                    <p className="mt-4 text-[17px] text-black sm:text-[18px]">
                        Первые лиды появляются в день подключения
                    </p>

                    <Link
                        to="/login"
                        className="mt-8"
                        data-track="cta_click"
                        data-source-section="cta-banner"
                    >
                        <Button
                            size="lg"
                            className="h-14 rounded-xl px-10 text-[16px] bg-blue-500 text-white hover:bg-blue-600"
                        >
                            Попробовать бесплатно
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

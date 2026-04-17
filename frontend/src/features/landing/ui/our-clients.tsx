import { useRef } from "react";
import { Button } from "@/shared/ui/button";
import { Link } from "@tanstack/react-router";
import { motion, blurFadeUp, staggerContainerFast } from "@/shared/animations/motion";

const cases = [
    {
        message: "Ищу юриста по банкротству физлиц, Москва. Бюджет 80-120к",
        result: "Нашли 3 лида в первый день",
        niche: "Юрист",
        color: "#9B59B6",
        image: "/images/landing/clients/minimalist-pastel-lawyer-2d.webp",
    },
    {
        message: "Нужен фотограф на свадьбу 15 июня, Питер. Есть примеры?",
        result: "Нашли 5 лидов в первый день",
        niche: "Фотограф",
        color: "#E67E22",
        image: "/images/landing/clients/minimalist-2d-photographer.webp",
    },
    {
        message: "Посоветуйте репетитора по математике для ЕГЭ, онлайн",
        result: "Нашли 4 лида в первый день",
        niche: "Репетитор",
        color: "#2AABEE",
        image: "/images/landing/clients/minimalist-tutor-pastel-colors.webp",
    },
    {
        message: "Нужна студия для записи подкаста на 2 часа, центр Москвы",
        result: "Нашли 2 лида в первый день",
        niche: "Студия",
        color: "#27AE60",
        image: "/images/landing/clients/2d-minimalist-studio-pastel.webp",
    },
    {
        message: "Ищу риелтора, продажа двушки в Химках. Без агентств",
        result: "Нашли 6 лидов в первый день",
        niche: "Риелтор",
        color: "#E74C3C",
        image: "/images/landing/clients/minimalist-2d-real-estate-agent.webp",
    },
    {
        message: "Нужен фрилансер на верстку лендинга, срок — 3 дня",
        result: "Нашли 4 лида в первый день",
        niche: "Фрилансер",
        color: "#8E44AD",
        image: "/images/landing/clients/freelancer-2d-minimalist-pastels.webp",
    },
];

export function OurClients() {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({
            left: direction === "right" ? 320 : -320,
            behavior: "smooth",
        });
    };

    return (
        <section
            id="our-clients"
            data-track-section="our-clients"
            className="py-12 md:py-24"
        >
            <div className="site-container">
                {/* Heading */}
                <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                    <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                        Наши клиенты
                    </h2>
                </div>

                {/* Scrollable row with arrows */}
                <div className="relative">
                    {/* Left arrow */}
                    <button
                        type="button"
                        onClick={() => scroll("left")}
                        className="absolute -left-5 top-[50%] z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-3 shadow-lg transition-transform hover:scale-110 lg:flex"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="black"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>

                    {/* Right arrow */}
                    <button
                        type="button"
                        onClick={() => scroll("right")}
                        className="absolute -right-5 top-[50%] z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-3 shadow-lg transition-transform hover:scale-110 lg:flex"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="black"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>

                    {/* Cards row */}
                    <motion.div
                        variants={staggerContainerFast(0.1)}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-50px" }}
                        ref={scrollRef}
                        className="no-scrollbar flex gap-5 overflow-x-auto scroll-smooth py-4"
                    >
                        {/* Accent stat card */}
                        <motion.div 
                            variants={blurFadeUp}
                            className="flex w-[280px] shrink-0 flex-col justify-center rounded-[28px] bg-linear-to-br from-blue-500 to-[#1a8fd4] p-7 text-white sm:w-[300px] sm:p-9 shadow-sm"
                        >
                            <p className="font-heading text-[44px] font-bold leading-none sm:text-[52px]">
                                &gt;20 000
                            </p>
                            <p className="mt-3 text-[18px] font-medium text-white">
                                сообщений анализируется ежедневно
                            </p>
                        </motion.div>

                        {/* Case cards */}
                        {cases.map((c) => (
                            <motion.div
                                variants={blurFadeUp}
                                key={c.niche}
                                className="w-[280px] shrink-0 sm:w-[300px] group"
                            >
                                {/* Image */}
                                <div className="aspect-4/3 w-full overflow-hidden rounded-2xl shadow-sm">
                                    <motion.img
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        src={c.image}
                                        alt={c.niche}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            const el =
                                                e.target as HTMLImageElement;
                                            el.parentElement!.style.background =
                                                "#e5e7eb";
                                            el.style.display = "none";
                                        }}
                                    />
                                </div>

                                {/* Text below image */}
                                <div className="mt-3 px-1">
                                    <p className="font-heading text-[18px] font-bold text-black">
                                        {c.result}
                                    </p>
                                    <span
                                        className="mt-2 inline-flex rounded-full px-3 py-1 text-[13px] font-bold text-white"
                                        style={{ backgroundColor: c.color }}
                                    >
                                        {c.niche}
                                    </span>
                                    <p className="mt-2 text-[15px] leading-relaxed text-black">
                                        &laquo;{c.message}&raquo;
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* CTA */}
                <div className="mt-10 flex justify-center">
                    <Link
                        to="/login"
                        data-track="cta_click"
                        data-source-section="our-clients"
                    >
                        <Button
                            size="lg"
                            className="h-14 rounded-xl px-8 text-[16px] bg-black text-white hover:bg-black/85"
                        >
                            Попробовать бесплатно
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

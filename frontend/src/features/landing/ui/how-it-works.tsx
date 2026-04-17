import {
    motion,
    useScroll,
    useTransform,
    blurFadeUp,
    staggerContainerFast,
} from "@/shared/animations/motion";
import { useRef } from "react";

export function HowItWorks() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });
    const imageY = useTransform(scrollYProgress, [0, 1], [50, -50]);

    return (
        <section
            ref={sectionRef}
            id="how-it-works"
            data-track-section="how-it-works"
            className="py-12 md:py-32"
        >
            <div className="site-container">
                {/* Heading */}
                <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                    <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                        Как это работает
                    </h2>
                </div>

                {/* Bento grid */}
                <motion.div
                    variants={staggerContainerFast(0.1)}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 gap-5 md:grid-cols-5 md:auto-rows-[240px]"
                >
                    {/* Large accent card — left, 2 rows */}
                    <motion.div
                        variants={blurFadeUp}
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                        }}
                        className="h-[500px] md:h-auto relative overflow-hidden rounded-[28px] bg-linear-to-br from-blue-500 to-[#1a8fd4] md:col-span-3 md:row-span-2 shadow-sm hover:shadow-xl"
                    >
                        {/* Decorative wave — full height, left side */}
                        <svg
                            className="md:block hidden absolute rotate-20 -top-12 left-8 h-[150%] w-auto text-white/30"
                            viewBox="0 0 150 500"
                            fill="none"
                            preserveAspectRatio="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M30 0C30 0 0 50 0 100C0 150 30 200 30 250C30 300 0 350 0 400C0 450 30 500 30 500"
                                stroke="currentColor"
                                strokeWidth="5"
                                vectorEffect="non-scaling-stroke"
                            />
                            <path
                                d="M70 0C70 0 40 50 40 100C40 150 70 200 70 250C70 300 40 350 40 400C40 450 70 500 70 500"
                                stroke="currentColor"
                                strokeWidth="5"
                                vectorEffect="non-scaling-stroke"
                            />
                            <path
                                d="M110 0C110 0 80 50 80 100C80 150 110 200 110 250C110 300 80 350 80 400C80 450 110 500 110 500"
                                stroke="currentColor"
                                strokeWidth="5"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>

                        <div className="relative z-10 p-7 sm:p-9">
                            <h3 className="font-heading text-[26px] font-bold leading-tight tracking-tight text-white sm:text-[32px]">
                                Опишите клиента —
                                <br />
                                мы найдем его в чатах
                            </h3>
                            <p className="mt-3 text-[20px] font-medium text-white sm:text-[22px]">
                                Без фильтров и ключевых слов
                            </p>
                        </div>

                        <motion.img
                            style={{ y: imageY }}
                            src="/images/landing/how-it-works.png"
                            alt="Клиент найден"
                            className="absolute md:max-w-[450px] bottom-0  md:w-full md:bottom-0 md:-right-[50px]"
                        />
                    </motion.div>

                    {/* Top right — query example */}
                    <motion.div
                        variants={blurFadeUp}
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                        }}
                        className="flex flex-col justify-between rounded-[28px] bg-[#f5f5f7] p-7 sm:p-9 md:col-span-2 shadow-sm hover:shadow-xl"
                    >
                        <h3 className="font-heading text-[22px] font-bold leading-snug tracking-tight text-black">
                            Подключаем чаты за вас
                        </h3>
                        <div className="mt-4 rounded-2xl bg-blue-500 p-4">
                            <p className="text-[17px] font-bold leading-relaxed text-white sm:text-[18px]">
                                «Найди тех, кто ищет подрядчика на внедрение CRM
                                с бюджетом от 300к»
                            </p>
                        </div>
                    </motion.div>

                    {/* Bottom right — stats proof */}
                    <motion.div
                        variants={blurFadeUp}
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                        }}
                        className="flex flex-col justify-between rounded-[28px] bg-[#f5f5f7] p-7 sm:p-9 md:col-span-2 shadow-sm hover:shadow-xl"
                    >
                        <h3 className="font-heading text-[22px] font-bold leading-snug tracking-tight text-black">
                            Лиды с первого дня
                        </h3>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-heading text-[28px] font-bold leading-none text-black sm:text-[32px]">
                                    94.7%
                                </p>
                                <p className="mt-1.5 text-[17px] text-black sm:text-[18px]">
                                    релевантность
                                </p>
                            </div>
                            <div>
                                <p className="font-heading text-[28px] font-bold leading-none text-black sm:text-[32px]">
                                    1 день
                                </p>
                                <p className="mt-1.5 text-[17px] text-black sm:text-[18px]">
                                    до первых лидов
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

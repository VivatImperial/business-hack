import { motion, blurFadeUp, staggerContainerFast } from "@/shared/animations/motion";

const rows = [
    {
        label: "Поиск лидов",
        without: "Вручную листаете чаты",
        with: "AI находит автоматически",
    },
    {
        label: "Скорость",
        without: "Часы на мониторинг",
        with: "Лиды в реальном времени",
    },
    {
        label: "Точность",
        without: "Ключевые слова и спам",
        with: "Анализ смысла — 94.7%",
    },
    {
        label: "Подключение",
        without: "Боты и риск блокировки",
        with: "MTProto, безопасно",
    },
    {
        label: "Запуск",
        without: "Долгая настройка",
        with: "Первые лиды за 1 день",
    },
    {
        label: "Масштаб",
        without: "1-2 чата вручную",
        with: ">20 000 сообщений / день",
    },
];

function CrossIcon() {
    return (
        <svg
            className="mt-0.5 size-5 shrink-0 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
        >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            className="mt-0.5 size-5 shrink-0 text-blue-500"
            viewBox="0 0 20 20"
            fill="currentColor"
        >
            <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
            />
        </svg>
    );
}

export function Comparison() {
    return (
        <section
            id="why-pulsar"
            data-track-section="why-pulsar"
            className="py-12 md:py-24"
        >
            <div className="site-container max-w-5xl!">
                {/* Heading */}
                <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                    <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                        Давайте сравним
                    </h2>
                </div>

                {/* ── Desktop: side-by-side ── */}
                <div className="hidden md:block">
                    {/* Column headers */}
                    <div className="mb-6 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-[#f5f5f7] px-6 py-3">
                            <span className="font-heading text-[26px] font-bold text-black">
                                Сами
                            </span>
                        </div>
                        <div className="rounded-2xl bg-blue-500 px-6 py-3">
                            <span className="font-heading text-[26px] font-bold text-white">
                                С нами
                            </span>
                        </div>
                    </div>

                    {/* Rows */}
                    <motion.div 
                        variants={staggerContainerFast(0.1)}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        className="flex flex-col"
                    >
                        {rows.map((row, i) => (
                            <motion.div
                                variants={blurFadeUp}
                                key={row.label}
                                className={`grid grid-cols-2 gap-x-6  py-6 ${i < rows.length - 1 ? "border-b border-slate-100" : ""}`}
                            >
                                <div className="pl-6">
                                    <p className="pl-7 text-[14px] text-black/40">
                                        {row.label}
                                    </p>
                                    <div className="mt-1 flex items-start gap-2">
                                        <CrossIcon />
                                        <p className="text-[17px] font-bold text-black">
                                            {row.without}
                                        </p>
                                    </div>
                                </div>
                                <div className="pl-6">
                                    <p className="pl-7 text-[14px] text-black/40">
                                        {row.label}
                                    </p>
                                    <div className="mt-1 flex items-start gap-2">
                                        <CheckIcon />
                                        <p className="text-[17px] font-bold text-black">
                                            {row.with}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* ── Mobile: 2-col table ── */}
                <div className="md:hidden">
                    <div className="mb-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-[#f5f5f7] px-4 py-2.5">
                            <span className="font-heading text-[20px] font-bold text-black">
                                Сами
                            </span>
                        </div>
                        <div className="rounded-2xl bg-blue-500 px-4 py-2.5">
                            <span className="font-heading text-[20px] font-bold text-white">
                                С нами
                            </span>
                        </div>
                    </div>

                    <motion.div 
                        variants={staggerContainerFast(0.1)}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-50px" }}
                        className="flex flex-col"
                    >
                        {rows.map((row, i) => (
                            <motion.div
                                variants={blurFadeUp}
                                key={row.label}
                                className={`grid grid-cols-2 gap-x-4 py-4 ${i < rows.length - 1 ? "border-b border-slate-100" : ""}`}
                            >
                                <div>
                                    <p className="text-[12px] text-black/40">
                                        {row.label}
                                    </p>
                                    <div className="mt-0.5 flex items-start gap-1.5">
                                        <CrossIcon />
                                        <p className="text-[15px] font-bold text-black">
                                            {row.without}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="hidden md:visible text-[12px] text-black/40">
                                        {row.label}
                                    </p>
                                    <div className="mt-[16px] md:mt-0.5 flex items-start gap-1.5">
                                        <CheckIcon />
                                        <p className="text-[15px] font-bold text-black">
                                            {row.with}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

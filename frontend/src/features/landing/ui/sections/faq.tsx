import {
    motion,
    staggerContainerDelayed,
    scaleFadeIn,
    fadeUp,
} from "@/shared/animations/motion";
import { FaqItem } from "../parts/faq-item";

const ITEMS = [
    {
        question: "Откуда ассистент берёт знания?",
        answer:
            "Из исторических тикетов IntraService (104 000 обращений) и базы знаний «Балтийского Берега». Каждый ответ содержит ссылки на конкретные тикеты и статьи.",
    },
    {
        question: "Что, если ассистент не знает ответа?",
        answer:
            "Честно говорит, что данных недостаточно, и эскалирует обращение на живого инженера. Мы не допускаем «галлюцинаций».",
    },
    {
        question: "Уходят ли данные во внешние сервисы?",
        answer:
            "Нет. Ассистент разворачивается on-prem. LLM-узлы, векторная база и история запросов — внутри инфраструктуры «Балтийского Берега».",
    },
    {
        question: "Сколько времени занимает внедрение?",
        answer:
            "Базовая интеграция — 4–6 недель: инфраструктура, загрузка данных, обучение, пилот на узкой группе, постепенное расширение.",
    },
    {
        question: "Можно ли настроить tone и ограничения ответов?",
        answer:
            "Да. В админ-панели настраиваются tone, top_k, порог уверенности, использование KB и фильтрация тем.",
    },
];

export function FaqSection() {
    return (
        <section id="faq" className="bg-[var(--brand-cream)]/50 py-24 md:py-32">
            <div className="mx-auto w-full max-w-[760px] px-5 sm:px-6">
                <motion.div
                    variants={staggerContainerDelayed(0.12, 0.05)}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.3 }}
                    className="flex flex-col items-center text-center"
                >
                    <motion.h2
                        variants={scaleFadeIn}
                        className="font-heading text-3xl font-semibold tracking-tight text-[var(--brand-dark)] sm:text-4xl md:text-5xl"
                    >
                        Что спрашивают перед внедрением
                    </motion.h2>
                </motion.div>

                <motion.div
                    variants={staggerContainerDelayed(0.06, 0.1)}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    className="mt-10 rounded-2xl border border-[var(--brand-border)]/60 bg-white px-6 md:px-10"
                >
                    {ITEMS.map((item, idx) => (
                        <motion.div key={item.question} variants={fadeUp}>
                            <FaqItem
                                question={item.question}
                                answer={item.answer}
                                defaultOpen={idx === 0}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

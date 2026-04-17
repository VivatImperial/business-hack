import { useScroll, useTransform, motion, blurFadeUp, staggerContainerFast } from "@/shared/animations/motion";
import { Button } from "@/shared/ui/button";
import { Link } from "@tanstack/react-router";

/* ── Telegram-style bubble tail (SVG) ── */
function BubbleTailLeft({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="11"
            height="20"
            viewBox="0 0 11 20"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M11 20H0C0 20 5.5 18.5 8 13C10 8.6 11 3.4 11 0V20Z" />
        </svg>
    );
}

function BubbleTailRight({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="11"
            height="20"
            viewBox="0 0 11 20"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M0 20H11C11 20 5.5 18.5 3 13C1 8.6 0 3.4 0 0V20Z" />
        </svg>
    );
}

/* ── Avatar circle ── */
function Avatar({ initials, color }: { initials: string; color: string }) {
    return (
        <div
            className="flex size-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: color }}
        >
            {initials}
        </div>
    );
}

/* ── Incoming message (left, white, with avatar + tail) ── */
function IncomingBubble({
    name,
    nameColor,
    avatar,
    children,
    time,
    dimmed,
    badge,
}: {
    name: string;
    nameColor: string;
    avatar: { initials: string; color: string };
    children: React.ReactNode;
    time: string;
    dimmed?: boolean;
    badge?: React.ReactNode;
}) {
    return (
        <div
            className={`flex items-end gap-1.5 self-start max-w-[92%] sm:max-w-[85%]${dimmed ? " opacity-70" : ""}`}
        >
            <Avatar initials={avatar.initials} color={avatar.color} />
            <div className="relative">
                <BubbleTailLeft className="absolute -left-[7px] bottom-0 text-white" />
                <div className="rounded-2xl rounded-bl-none bg-white px-3 py-2 shadow-sm">
                    <div
                        className="text-[13px] font-semibold"
                        style={{ color: nameColor }}
                    >
                        {name}
                    </div>
                    <div className="mt-0.5 flex items-end gap-2">
                        <p className="text-[14.5px] leading-snug text-slate-800">
                            {children}
                        </p>
                        <span className="mb-0.5 shrink-0 text-[11px] text-slate-400">
                            {time}
                        </span>
                    </div>
                </div>
                {badge}
            </div>
        </div>
    );
}

/* ── Outgoing message (right, green, with tail) ── */
function OutgoingBubble({
    children,
    time,
    replyTo,
}: {
    children: React.ReactNode;
    time: string;
    replyTo?: { name: string; text: string };
}) {
    return (
        <div className="relative self-end max-w-[88%] sm:max-w-[80%]">
            <BubbleTailRight className="absolute -right-[7px] bottom-0 text-[#E1FFC7]" />
            <div className="rounded-2xl rounded-br-none bg-[#E1FFC7] px-3 py-2 shadow-sm">
                {replyTo && (
                    <div className="mb-1.5 flex gap-2 rounded bg-[#CDEAA9]/60 px-2 py-1 border-l-[3px] border-[#4E9F3D]">
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[12px] font-semibold text-[#4E9F3D]">
                                {replyTo.name}
                            </span>
                            <span className="truncate text-[12px] text-[#4E9F3D]/80">
                                {replyTo.text}
                            </span>
                        </div>
                    </div>
                )}
                <div className="flex items-end gap-2">
                    <p className="text-[14.5px] leading-snug text-slate-800">
                        {children}
                    </p>
                    <div className="mb-0.5 flex shrink-0 items-center gap-1">
                        <span className="text-[11px] text-[#55A44A]">
                            {time}
                        </span>
                        <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#55A44A"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 6L7 17l-5-5" />
                            <path d="M22 10l-5.5 5.5" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Telegram message block ── */
function FloatingMessages() {
    const { scrollY } = useScroll();
    const messagesY = useTransform(scrollY, [0, 800], [0, -380]);
    const bgY = useTransform(scrollY, [0, 800], [0, 100]);

    return (
        <motion.div 
            variants={blurFadeUp}
            initial="hidden"
            animate="show"
            className="relative flex w-full flex-col overflow-hidden rounded-3xl bg-linear-to-b from-[#C4E1B9] to-[#9ABF92] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 h-[400px] sm:h-[460px]"
        >
            {/* Background pattern overlay */}
            <motion.div
                className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
                style={{
                    y: bgY,
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }}
            />

            {/* Scrollable Messages Area */}
            <div className="relative flex-1 overflow-hidden">
                <motion.div
                    style={{ y: messagesY }}
                    className="flex flex-col gap-2.5 px-4 pt-4 pb-16 sm:px-5"
                >
                    {/* Date badge */}
                    <div className="mb-1 flex justify-center">
                        <span className="rounded-xl bg-black/15 px-3 py-1 text-[13px] font-medium text-white/90 backdrop-blur-md">
                            Сегодня
                        </span>
                    </div>

                    {/* Message 1 — Алексей (casual, irrelevant) */}
                    <IncomingBubble
                        name="Алексей К."
                        nameColor="#2AABEE"
                        avatar={{ initials: "АК", color: "#2AABEE" }}
                        time="14:25"
                        dimmed
                    >
                        Кто-нибудь смотрел новый сезон? Стоит того вообще? 😄
                    </IncomingBubble>

                    {/* Message 2 — Иван (marketing, irrelevant) */}
                    <IncomingBubble
                        name="Иван Маркетинг"
                        nameColor="#E87A24"
                        avatar={{ initials: "ИМ", color: "#E87A24" }}
                        time="14:27"
                        dimmed
                    >
                        Подскажите курс по таргету, чтоб не теория, а сразу
                        практика 🎯
                    </IncomingBubble>

                    {/* Message 4 — Дмитрий | Sales (TARGET LEAD) */}
                    <IncomingBubble
                        name="Дмитрий | Sales"
                        nameColor="#4E9F3D"
                        avatar={{ initials: "ДС", color: "#4E9F3D" }}
                        time="14:32"
                        badge={
                            <div className="absolute -bottom-3 left-2 z-10">
                                <div className="flex items-center gap-1.5 rounded-xl bg-primary px-2.5 py-0.5 shadow-sm">
                                    <span className="text-[10px] font-semibold text-primary-foreground">
                                        Совпадение 94% · Лид передан
                                    </span>
                                </div>
                            </div>
                        }
                    >
                        Ищем подрядчика по внедрению CRM, бюджет ~500к, нужно
                        стартовать в ближайшие 2 недели. Есть кто живой? 🔥
                    </IncomingBubble>

                    {/* Message 5 — Our reply to the target lead */}
                    <div className="mt-3" />
                    <OutgoingBubble
                        time="14:33"
                        replyTo={{
                            name: "Дмитрий | Sales",
                            text: "Ищем подрядчика по внедрению CRM...",
                        }}
                    >
                        Здравствуйте! Написали в ЛС 🤝
                    </OutgoingBubble>

                    {/* Message 6 — Анна HR (irrelevant) */}
                    <IncomingBubble
                        name="Анна HR"
                        nameColor="#E25D7C"
                        avatar={{ initials: "АН", color: "#E25D7C" }}
                        time="14:34"
                        dimmed
                    >
                        Коллеги, посоветуйте сервис для онбординга новых
                        сотрудников? 🙋‍♀️
                    </IncomingBubble>

                    {/* Message 7 — Наталья PM (another lead comes to us) */}
                    <IncomingBubble
                        name="Наталья PM"
                        nameColor="#9B59B6"
                        avatar={{ initials: "НП", color: "#9B59B6" }}
                        time="14:36"
                    >
                        О, ребята, вас мне порекомендовали в прошлом чате!
                        Напишите и мне, пожалуйста 🙏
                    </IncomingBubble>

                    {/* Message 8 — Our happy reply */}
                    <OutgoingBubble time="14:37">
                        Конечно! Уже в ЛС 😊 Спасибо за доверие!
                    </OutgoingBubble>

                    {/* Message 9 — Сергей (irrelevant filler) */}
                    <IncomingBubble
                        name="Сергей Dev"
                        nameColor="#3498DB"
                        avatar={{ initials: "СД", color: "#3498DB" }}
                        time="14:39"
                        dimmed
                    >
                        Кто шарит в Next.js? Нужна консультация на час 💻
                    </IncomingBubble>

                    {/* Message 10 — Ольга (irrelevant) */}
                    <IncomingBubble
                        name="Ольга Финансы"
                        nameColor="#E67E22"
                        avatar={{ initials: "ОФ", color: "#E67E22" }}
                        time="14:41"
                        dimmed
                    >
                        Подскажите бухгалтера на аутсорсе для ИП? 📊
                    </IncomingBubble>
                </motion.div>
            </div>

            {/* Input field area */}
            <div className="relative z-10 mt-auto px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
                <div className="flex items-center gap-3 rounded-xl bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-md">
                    <svg
                        className="shrink-0 text-slate-400"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                    <div className="flex-1 text-[14.5px] text-slate-400">
                        Сообщение
                    </div>
                    <div className="flex items-center gap-3">
                        <svg
                            className="shrink-0 text-slate-400"
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                        <svg
                            className="shrink-0 text-slate-400"
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                            <path d="M19 10v2a7 7 0 01-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ── Arrow icon ── */
function ArrowRight({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M3 8h10m0 0L9 4m4 4L9 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/* ── Hero ── */
function Hero() {
    return (
        <section
            id="hero"
            data-track-section="hero"
            className="relative w-full overflow-hidden pt-10 pb-6 md:pt-16 md:pb-10 lg:pt-20 lg:pb-12"
        >
            <div className="site-container">
                <div className="flex flex-col items-center gap-8 lg:gap-12">
                    {/* Text block — centered */}
                    <motion.div 
                        variants={staggerContainerFast()}
                        initial="hidden"
                        animate="show"
                        className="flex max-w-3xl flex-col items-center gap-6 text-center"
                    >
                        <motion.h1 
                            variants={blurFadeUp}
                            className="font-heading text-[40px] font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-[64px]"
                        >
                            Горячие лиды из
                            <br />
                            Telegram-чатов
                        </motion.h1>
                        <motion.p 
                            variants={blurFadeUp}
                            className="text-[17px] leading-relaxed text-[#4A4A55] sm:text-lg"
                        >
                            Пульсар читает чаты по смыслу и отдает только
                            релевантные запросы
                        </motion.p>

                        {/* CTA buttons */}
                        <motion.div 
                            variants={blurFadeUp}
                            className="flex flex-col gap-3 sm:flex-row"
                        >
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link to="/login">
                                    <Button
                                        size="lg"
                                        className="h-14 w-full gap-2.5 rounded-xl px-8 sm:w-auto text-[16px] bg-primary text-primary-foreground hover:bg-primary/90"
                                        data-track="cta_click"
                                        data-source-section="hero-primary"
                                    >
                                        Попробовать бесплатно
                                    </Button>
                                </Link>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <a href="#how-it-works">
                                    <Button
                                        size="lg"
                                        className="h-14 w-full gap-2.5 rounded-xl border-2 border-slate-200 px-8 sm:w-auto text-[16px] text-slate-700 hover:bg-slate-50"
                                        variant="outline"
                                        data-track="cta_click"
                                        data-source-section="hero-secondary"
                                    >
                                        Как это работает
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </a>
                            </motion.div>
                        </motion.div>
                    </motion.div>

                    {/* Telegram messages block — wide, centered */}
                    <div className="mx-auto w-full max-w-4xl">
                        <FloatingMessages />
                    </div>
                </div>
            </div>
        </section>
    );
}

export { Hero };

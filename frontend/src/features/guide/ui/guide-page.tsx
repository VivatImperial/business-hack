import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FeatureCard, PageSection, SetupCard } from "./guide-components";

const dashboardImg = "/images/guide/dashboard.png";
const leadsImg = "/images/guide/leads.png";
const chatsImg = "/images/guide/chats.png";
const myСhatImg = "/images/guide/my-chat.png";
const balanceImg = "/images/guide/balance.png";

const SECTIONS = [
    { id: "hero", title: "О Пульсаре" },
    { id: "dashboard", title: "Статистика" },
    { id: "leads", title: "Лиды" },
    { id: "chats", title: "Чаты" },
    { id: "tags", title: "Мой чат" },
    { id: "balance", title: "Баланс" },
    { id: "setup", title: "Подключение" },
];

export function GuidePage() {
    const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const hash = window.location.hash.replace("#", "");
        if (hash) {
            const el = document.getElementById(hash);
            if (el) {
                setTimeout(() => {
                    const y =
                        el.getBoundingClientRect().top + window.scrollY - 40;
                    window.scrollTo({ top: y, behavior: "smooth" });
                }, 100);
            }
        }
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: "-100px 0px -60% 0px" },
        );

        SECTIONS.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const scrollTo = (id: string) => {
        if (typeof document === "undefined" || typeof window === "undefined")
            return;
        const el = document.getElementById(id);
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 40;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    return (
        <div className="mx-auto flex max-w-4xl items-start gap-12">
            {/* Main Content */}
            <div className="min-w-0 flex-1">
                {/* Hero */}
                <section id="hero" className="mb-16 scroll-mt-12">
                    <h1 className="font-heading text-[32px] font-bold tracking-tight text-black sm:text-[40px]">
                        Руководство по Пульсару
                    </h1>
                    <p className="mt-4 max-w-xl text-[18px] leading-relaxed text-black/70">
                        Подключите Telegram, укажите чаты для мониторинга —
                        нейросеть начнёт находить клиентов автоматически.
                    </p>

                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FeatureCard
                            step="1"
                            title="Подключите Telegram"
                            description="Отсканируйте QR-код в настройках"
                        />
                        <FeatureCard
                            step="2"
                            title="Добавьте чаты"
                            description="Укажите чаты, где искать лидов"
                        />
                        <FeatureCard
                            step="3"
                            title="Получайте лидов"
                            description="AI анализирует и отбирает целевые"
                        />
                    </div>
                </section>

                <div className="flex flex-col gap-16">
                    <PageSection
                        id="dashboard"
                        title="Статистика"
                        description="Главный экран с ключевыми показателями. Здесь вы видите, сколько лидов найдено, какая конверсия из сообщений в лиды, и как расходуется лимит. График показывает динамику за выбранный период, а воронка — путь от сообщения до лида."
                        features={[
                            "KPI-карточки: найденные лиды, сообщения, конверсия, лимиты",
                            "График динамики поиска лидов по дням",
                            "Воронка конверсии: сообщения → релевантные → лиды",
                            "Распределение лидов по тегам",
                        ]}
                        image={dashboardImg}
                        link="/dashboard"
                    />

                    <PageSection
                        id="leads"
                        title="Лиды"
                        description="Канбан-доска с найденными лидами. Каждая карточка — это сообщение, которое нейросеть признала целевым. Перетаскивайте карточки между колонками, чтобы отслеживать статус обработки."
                        features={[
                            "Три колонки: необработанные, в работе, обработанные",
                            "Drag-and-drop для смены статуса",
                            "AI-анализ: суть запроса, предложенный ответ, следующий шаг",
                            "Фильтрация по тегам, источникам и периоду",
                            "Экспорт лидов в Excel",
                        ]}
                        image={leadsImg}
                        link="/leads"
                    />

                    <PageSection
                        id="chats"
                        title="Чаты"
                        description="Список Telegram-чатов и каналов, которые система мониторит для поиска лидов. Добавьте ссылки на чаты, где ваша целевая аудитория общается."
                        features={[
                            "Добавление чатов по ссылке, @username или ID",
                            "Поддержка каналов, групп и супергрупп",
                            "Редактирование и удаление источников",
                        ]}
                        image={chatsImg}
                        link="/chats"
                    />

                    <PageSection
                        id="tags"
                        title="Мой чат"
                        description="Управление тегами для классификации лидов. Нейросеть автоматически присваивает теги каждому найденному лиду. Здесь же настраивается целевой чат для пересылки."
                        features={[
                            "Создание тегов с описанием и ключевыми словами",
                            "Статистика по каждому тегу",
                            "Привязка целевого чата для пересылки лидов",
                            "Автоматическое создание топиков в форуме",
                        ]}
                        image={myСhatImg}
                        link="/my-chat"
                    />

                    <PageSection
                        id="balance"
                        title="Баланс"
                        description="Управление квотой на обработку сообщений. Баланс показывает, сколько сообщений система ещё может обработать."
                        features={[
                            "Текущий баланс и пополнение",
                            "Тарифные планы с ценами за сообщение",
                            "Связь с персональным менеджером",
                        ]}
                        image={balanceImg}
                        link="/balance"
                    />

                    {/* Setup */}
                    <section id="setup" className="scroll-mt-12">
                        <h2 className="font-heading text-[26px] font-bold tracking-tight text-black sm:text-[30px]">
                            Как подключить Telegram
                        </h2>
                        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-black/70">
                            Пульсар подключается через QR-код — как обычное
                            устройство. Настройка занимает меньше минуты.
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <SetupCard
                                number={1}
                                title="Откройте настройки"
                                description="Перейдите в раздел «Настройки» — QR-код появится автоматически."
                            />
                            <SetupCard
                                number={2}
                                title="Сканируйте QR-код"
                                description="В Telegram: Настройки → Устройства → Подключить устройство."
                            />
                            <SetupCard
                                number={3}
                                title="Готово"
                                description="Система подключится и начнёт мониторинг чатов."
                            />
                        </div>

                        <Link
                            to="/settings"
                            className="mt-6 inline-flex rounded-xl bg-black px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-black/85"
                        >
                            Перейти в настройки →
                        </Link>
                    </section>
                </div>
            </div>

            {/* Table of Contents — sticky sidebar */}
            <div className="sticky top-24 hidden w-[180px] shrink-0 lg:block">
                <h3 className="mb-5 text-[12px] font-bold uppercase tracking-wider text-black/40">
                    Содержание
                </h3>
                <nav className="flex flex-col gap-0.5">
                    {SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => scrollTo(section.id)}
                            className={`rounded-xl px-3 py-2 text-left text-[14px] transition-colors ${
                                activeSection === section.id
                                    ? "bg-[#f5f5f7] font-medium text-black"
                                    : "text-black/50 hover:text-black"
                            }`}
                        >
                            {section.title}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}

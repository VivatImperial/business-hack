import { Link } from "@tanstack/react-router";
import { MobileFeatureCard, MobilePageSection, MobileSetupStep } from "./mobile-guide-components";

const dashboardImg = "/images/guide/dashboard.png";
const leadsImg = "/images/guide/leads.png";
const chatsImg = "/images/guide/chats.png";
const myСhatImg = "/images/guide/my-chat.png";
const balanceImg = "/images/guide/balance.png";

export function MobileGuidePage() {
    return (
        <div className="flex flex-col gap-8">
            {/* Hero */}
            <section>
                <h1 className="font-heading text-[24px] font-bold tracking-tight text-black">
                    Руководство по Пульсару
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-black/70">
                    Подключите аккаунт, укажите чаты, и нейросеть начнёт
                    находить клиентов.
                </p>

                <div className="mt-5 flex flex-col gap-3">
                    <MobileFeatureCard
                        step="1"
                        title="Подключите Telegram"
                        description="QR-код в настройках"
                    />
                    <MobileFeatureCard
                        step="2"
                        title="Добавьте чаты"
                        description="Чаты и каналы для поиска"
                    />
                    <MobileFeatureCard
                        step="3"
                        title="Получайте лидов"
                        description="AI анализирует и отбирает"
                    />
                </div>
            </section>

            <MobilePageSection
                title="Статистика"
                description="KPI-карточки, график динамики, воронка конверсии и распределение по тегам."
                image={dashboardImg}
                link="/dashboard"
            />

            <MobilePageSection
                title="Лиды"
                description="Канбан-доска с найденными лидами. Drag-and-drop, AI-анализ, фильтрация и экспорт."
                image={leadsImg}
                link="/leads"
            />

            <MobilePageSection
                title="Чаты"
                description="Список Telegram-чатов для мониторинга. Добавление по ссылке, @username или ID."
                image={chatsImg}
                link="/chats"
            />

            <MobilePageSection
                title="Мой чат"
                description="Теги для классификации лидов и настройка целевого чата для пересылки."
                image={myСhatImg}
                link="/my-chat"
            />

            <MobilePageSection
                title="Баланс"
                description="Управление квотой, тарифы и история операций."
                image={balanceImg}
                link="/balance"
            />

            {/* Setup */}
            <section>
                <h2 className="font-heading text-[20px] font-bold tracking-tight text-black">
                    Как подключить Telegram
                </h2>
                <p className="mt-1.5 text-[14px] leading-relaxed text-black/70">
                    Через QR-код — как обычное устройство. Меньше минуты.
                </p>

                <div className="mt-4 flex flex-col gap-3">
                    <MobileSetupStep
                        number={1}
                        title="Откройте настройки"
                        description="QR-код появится автоматически"
                    />
                    <MobileSetupStep
                        number={2}
                        title="Сканируйте QR-код"
                        description="Telegram → Устройства → Подключить"
                    />
                    <MobileSetupStep
                        number={3}
                        title="Готово"
                        description="Система начнёт мониторинг чатов"
                    />
                </div>

                <Link
                    to="/settings"
                    className="mt-5 flex items-center justify-center rounded-xl bg-black px-5 py-3 text-[15px] font-medium text-white active:scale-[0.98]"
                >
                    Перейти в настройки →
                </Link>
            </section>
        </div>
    );
}

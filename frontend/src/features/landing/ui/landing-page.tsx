import { FloatingHeader } from "./floating-header";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Comparison } from "./comparison";
import { OurClients } from "./our-clients";
import { DemoVideoCompact } from "./demo-video-compact";
import { PricingModule } from "./pricing-module";
import { CtaBanner } from "./cta-banner";
import { SiteFooter } from "./site-footer";
import { FaqAccordion } from "./faq-chat-accordion";
import { AnimatedSection } from "./animated-section";
import { PRICING_PLANS } from "@/shared/config/pricing-plans";
import { ABSOLUTE_MANAGER_CONTACT_URL } from "@/shared/config/contact";



export function LandingPage() {
    const navLinks = [
        { label: "Как это работает", href: "#how-it-works" },
        { label: "Почему Пульсар", href: "#why-pulsar" },
        { label: "Тарифы", href: "#pricing" },
        { label: "Руководство", href: "/guide" },
    ];

    const faqData = [
        {
            id: 1,
            question: "Как работает парсер Telegram чатов Пульсар?",
            answer: "Пульсар — это умный ИИ-парсер, который мониторит целевые Telegram-группы и каналы в реальном времени.\n\nВ отличие от обычных парсеров по ключевым словам, наша нейросеть (LLM) читает контекст сообщений и находит только горячие лиды с реальным коммерческим интересом, отсеивая спам и нерелевантный флуд.",
            icon: "⚡",
            iconPosition: "right" as const,
        },
        {
            id: 2,
            question: "Нужно ли добавлять бота в чаты для мониторинга?",
            answer: "Нет, для поиска клиентов в Телеграм через Пульсар не нужно добавлять ботов. Система работает через MTProto как обычный пользователь.\n\nЭто абсолютно безопасно, не привлекает внимания администраторов групп и позволяет собирать лиды из любых чатов, где вы состоите.",
        },
        {
            id: 3,
            question: "В чем отличие ИИ-парсера от поиска по ключевым словам?",
            answer: "Обычный мониторинг Telegram чатов по ключевым словам выдает сотни нецелевых сообщений (спам, вакансии, обсуждения).\n\nНейросеть Пульсара анализирует смысл (интент) каждого сообщения. Вы получаете только тех пользователей, которые прямо сейчас ищут ваши услуги, что в разы повышает конверсию в продажу.",
            icon: "🔥",
            iconPosition: "left" as const,
        },
        {
            id: 4,
            question: "Как быстро я получу первых лидов из Телеграм?",
            answer: "Первые целевые заявки (лиды) начинают поступать в вашу CRM или личный Telegram-чат в тот же день.\n\nЭто происходит сразу после настройки промпта (описания вашего идеального клиента) и добавления целевых групп для парсинга.",
        },
        {
            id: 5,
            question: "Куда приходят найденные лиды?",
            answer: "Все найденные целевые сообщения моментально пересылаются в ваш личный Telegram-чат или специальную группу для отдела продаж.\n\nВы получаете готовое сообщение с контактом потенциального клиента и можете сразу же вступить с ним в диалог от своего имени.",
            icon: "📨",
            iconPosition: "right" as const,
        },
        {
            id: 6,
            question: "Для каких ниш подходит лидогенерация в Telegram?",
            answer: "Наш сервис поиска клиентов идеально работает для B2B-сектора, IT-услуг, маркетинговых агентств, фрилансеров, консалтинга и недвижимости.\n\nОн эффективен в любых нишах, где ваша целевая аудитория ищет подрядчиков в профильных Telegram-сообществах.",
        },
        {
            id: 7,
            question:
                "Безопасно ли использовать сервис для моего Telegram-аккаунта?",
            answer: "Абсолютно. Пульсар использует официальные протоколы Telegram (MTProto) и работает в режиме чтения.\n\nМы встроили надежные алгоритмы защиты, поэтому парсинг телеграм групп происходит максимально естественно и безопасно для вашего аккаунта.",
        },
        {
            id: 8,
            question:
                "Как анализировать эффективность разных Telegram-каналов?",
            answer: "Система автоматически размечает, из какого чата пришел каждый лид.\n\nВыгрузив эти данные, вы сможете сравнить конверсию разных Telegram-сообществ и оставить только те источники, которые приносят самых качественных клиентов.",
            icon: "📊",
            iconPosition: "left" as const,
        },
    ];

    const schemaProduct = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Пульсар",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
            "Пульсар находит горячие B2B-запросы в Telegram-чатах и сообществах через MTProto и LLM-анализ, чтобы команды продаж получали релевантные лиды быстрее.",
        brand: { "@type": "Brand", name: "Пульсар" },
        url: "https://pulsar-tg.ru",
        offers: {
            "@type": "AggregateOffer",
            priceCurrency: "RUB",
            lowPrice: "7500",
            highPrice: "10000",
            offerCount: "3",
            availability: "https://schema.org/InStock",
        },
        aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "47",
            bestRating: "5",
        },
    };

    const schemaOrganization = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Пульсар",
        url: "https://pulsar-tg.ru",
        logo: "https://pulsar-tg.ru/logo.webp",
        description:
            "Сервис B2B-лидогенерации: поиск горячих коммерческих запросов в Telegram-чатах через MTProto и LLM-анализ.",
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            email: "info@goji.studio",
            url: ABSOLUTE_MANAGER_CONTACT_URL,
            availableLanguage: "Russian",
        },
        sameAs: [ABSOLUTE_MANAGER_CONTACT_URL],
    };

    const schemaFaq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqData.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
            },
        })),
    };

    const schemaWebPage = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Пульсар — поиск горячих B2B-лидов в Telegram-чатах",
        description:
            "Пульсар находит горячих клиентов в Telegram-чатах и сообществах без ботов: MTProto-подключение, LLM-анализ каждого сообщения и прозрачные тарифы от 1 ₽.",
        url: "https://pulsar-tg.ru",
        inLanguage: "ru",
        isPartOf: {
            "@type": "WebSite",
            name: "Пульсар",
            url: "https://pulsar-tg.ru",
        },
        breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Главная",
                    item: "https://pulsar-tg.ru",
                },
            ],
        },
    };

    return (
        <div className="bg-white mt-[-18px] text-slate-900 selection:bg-blue-100">
            <FloatingHeader links={navLinks} />
            <main>
                <Hero />

                <AnimatedSection>
                    <HowItWorks />
                </AnimatedSection>

                <AnimatedSection>
                    <OurClients />
                </AnimatedSection>

                <AnimatedSection>
                    <DemoVideoCompact />
                </AnimatedSection>

                <AnimatedSection id="why-pulsar" dataTrackSection="why-pulsar">
                    <Comparison />
                </AnimatedSection>

                <AnimatedSection id="pricing">
                    <PricingModule
                        title="Прозрачные тарифы"
                        subtitle="Платите только за обработанные сообщения"
                        plans={PRICING_PLANS}
                    />
                </AnimatedSection>

                <CtaBanner />

                <AnimatedSection
                    id="faq"
                    dataTrackSection="faq"
                    className="py-12 md:py-24"
                >
                    <div className="site-container max-w-2xl">
                        <h2 className="font-heading text-center text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                            Частые вопросы
                        </h2>
                        <FaqAccordion
                            data={faqData}
                            className="mx-auto mt-8 w-full"
                            mobileLimit={5}
                        />
                    </div>
                </AnimatedSection>
            </main>
            <SiteFooter />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        schemaProduct,
                        schemaOrganization,
                        schemaFaq,
                        schemaWebPage,
                    ]),
                }}
            />
        </div>
    );
}

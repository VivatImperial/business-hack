import { MANAGER_CONTACT_URL } from "@/shared/config/contact";

const data = {
    productLinks: {
        howItWorks: "#how-it-works",
        whyPulsar: "#why-pulsar",
        pricing: "#pricing",
        faq: "#faq",
    },
    docs: {
        policy: "/documents/privacy-policy.html",
        offer: "/documents/public-offer.html",
    },
    contact: {
        email: "info@goji.studio",
        chat: MANAGER_CONTACT_URL,
    },
    company: {
        name: "Пульсар",
        description:
            "Сервис поиска горячих B2B-запросов в соцсетях и сообществах. Подключаем источники, фильтруем по смыслу и отдаем вашей команде только релевантные лиды.",
        logo: "/images/common/logo.webp",
    },
};

const productLinks = [
    { text: "Как это работает", href: data.productLinks.howItWorks },
    { text: "Почему Пульсар", href: data.productLinks.whyPulsar },
    { text: "Тарифы", href: data.productLinks.pricing },
    { text: "FAQ", href: data.productLinks.faq },
];

const contactInfo = [
    { icon: "◻", text: "Чат для связи", href: data.contact.chat },
    {
        icon: "✉",
        text: data.contact.email,
        href: `mailto:${data.contact.email}`,
    },
];

const legalLinks = [
    { icon: "◇", text: "Политика конфиденциальности", href: data.docs.policy },
    { icon: "≡", text: "Публичная оферта", href: data.docs.offer },
];

export default function Footer4Col() {
    return (
        <footer className="mt-8 w-full rounded-t-3xl border-t border-slate-200 bg-slate-50">
            <div className="mx-auto max- px-4 pt-14 pb-6 sm:px-6 lg:px-8 lg:pt-16">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                    <div>
                        <div className="text-blue-500 flex items-center justify-center gap-2 sm:justify-start">
                            <img
                                src={data.company.logo || "/placeholder.svg"}
                                alt="Логотип Пульсар"
                                className="h-8 w-8 rounded-full object-cover"
                            />
                            <span className="font-brand text-2xl">
                                {data.company.name}
                            </span>
                        </div>

                        <p className="mt-4 max-w-md text-center leading-relaxed text-foreground/70 sm:max-w-xs sm:text-left">
                            {data.company.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:col-span-2">
                        <div className="text-center sm:text-left">
                            <p className="font-heading text-lg">Разделы</p>
                            <ul className="mt-5 space-y-3 text-sm">
                                {productLinks.map(({ text, href }) => (
                                    <li key={text}>
                                        <a
                                            className="text-secondary-foreground/80 transition hover:text-foreground"
                                            href={href}
                                        >
                                            {text}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="text-center sm:text-left">
                            <p className="font-heading text-lg">
                                Контакты и документы
                            </p>
                            <ul className="mt-5 space-y-3 text-sm">
                                {contactInfo.map(({ icon, text, href }) => (
                                    <li key={text}>
                                        <a
                                            className="flex items-center justify-center gap-2 text-secondary-foreground/80 transition hover:text-foreground sm:justify-start"
                                            href={href}
                                        >
                                            <span
                                                className="text-sm text-blue-500"
                                                aria-hidden
                                            >
                                                {icon}
                                            </span>
                                            {text}
                                        </a>
                                    </li>
                                ))}
                                {legalLinks.map(({ icon, text, href }) => (
                                    <li key={text}>
                                        <a
                                            href={href}
                                            className="flex items-center justify-center gap-2 text-secondary-foreground/80 transition hover:text-foreground sm:justify-start"
                                        >
                                            <span
                                                className="text-sm text-blue-500"
                                                aria-hidden
                                            >
                                                {icon}
                                            </span>
                                            {text}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-10 border-t border-slate-200 pt-6">
                    <div className="text-center sm:flex sm:justify-between sm:text-left">
                        <p className="text-sm">
                            <span className="block sm:inline">
                                Пульсар для B2B-лидогенерации в социальных
                                сетях.
                            </span>
                        </p>

                        <p className="mt-4 text-sm text-secondary-foreground/70 transition sm:order-first sm:mt-0">
                            &copy; 2025 {data.company.name}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

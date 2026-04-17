const walletImg = "/images/stories/minimalist-ui-icon-wallet-coins.webp";
const shieldImg = "/images/stories/futuristic-security-shield-icon.webp";
const puzzleImg = "/images/stories/minimalist-ui-icon-smartphone.webp";
const sliderImg = "/images/stories/magic-wand-icon-ai-settings.webp";
const capsulesImg = "/images/stories/minimalist-ui-icon-label-tags.webp";
const routingImg = "/images/stories/paper-airplane-from-folder.webp";

export interface StorySlide {
    id: string;
    title: string;
    description: string;
    bullets: string[];
    ctaText?: string;
    ctaHref?: string;
    image: string;
}

export const STORIES: StorySlide[] = [
    {
        id: "balance",
        title: "Как работает баланс",
        description:
            "Баланс — это количество сообщений, которые система может обработать. Каждое проанализированное сообщение списывает единицу.",
        bullets: [
            "Пополнение через менеджера или форму в разделе «Баланс»",
            "Автопополнение позволяет не останавливать работу при нулевом балансе",
            "История транзакций с детализацией по датам и суммам",
        ],
        ctaText: "Открыть Баланс",
        ctaHref: "/balance",
        image: walletImg,
    },
    {
        id: "security",
        title: "Почему это безопасно",
        description:
            "Все данные передаются по зашифрованному каналу. Мы не храним переписку — только метаданные для аналитики и найденные лиды.",
        bullets: [
            "Шифрование TLS 1.3 на всех этапах",
            "Серверы в защищённых дата-центрах",
            "Соответствие 152-ФЗ о персональных данных",
        ],
        image: shieldImg,
    },
    {
        id: "integration",
        title: "Как подключить Telegram",
        description:
            "Пульсар работает через пользовательский Telegram API. Это позволяет мониторить любые чаты и каналы, где вы состоите.",
        bullets: [
            "Получите API ID и API Hash на my.telegram.org",
            "Введите ключи в разделе «Настройки»",
            "Авторизуйтесь через QR-код — и система начнёт работу",
        ],
        ctaText: "Открыть Настройки",
        ctaHref: "/settings",
        image: puzzleImg,
    },
    {
        id: "prompt",
        title: "Настройте промпты",
        description:
            "Промпты управляют тем, как нейросеть анализирует сообщения. Для каждого этапа воронки — свой системный промпт и шаблон.",
        bullets: [
            "Системный промпт задаёт роль и контекст для ИИ",
            "Пользовательский шаблон определяет формат анализа",
            "Несколько этапов: от классификации до генерации предложения",
        ],
        ctaText: "Настроить промпты",
        ctaHref: "/prompts",
        image: sliderImg,
    },
    {
        id: "tags",
        title: "Теги",
        description:
            "Теги помогают классифицировать лидов по категориям. Нейросеть автоматически присваивает теги на основе анализа сообщения.",
        bullets: [
            "Создавайте теги с описанием и ключевыми словами",
            "Отслеживайте статистику: количество сообщений и конверсию по каждому тегу",
            "Фильтруйте лидов на канбан-доске по нужным тегам",
        ],
        ctaText: "Управлять тегами",
        ctaHref: "/tags",
        image: capsulesImg,
    },
    {
        id: "routing",
        title: "Пересылка лидов",
        description:
            "Настройте целевой чат, и система будет автоматически пересылать туда найденных лидов с анализом от нейросети.",
        bullets: [
            "Укажите ссылку на целевой чат в разделе «Мой чат»",
            "Если чат — форум с топиками, лиды распределятся по темам автоматически",
            "Каждый лид приходит с тегом, AI-анализом и предложенным ответом",
        ],
        ctaText: "Настроить пересылку",
        ctaHref: "/tags",
        image: routingImg,
    },
];

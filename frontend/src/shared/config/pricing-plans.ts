import { buildManagerContactUrl } from "@/shared/config/contact";

export interface PricingPlanFeature {
    label: string;
    included: boolean;
}

export interface PricingPlanConfig {
    id: "start" | "business" | "scale";
    name: string;
    description: string;
    priceFrom: number;
    ctaLabel: string;
    ctaLink: string;
    features: PricingPlanFeature[];
    recommended?: boolean;
    /* Balance page fields */
    perMessage: string;
    perMessageRub: number;
    balancePrefill: number;
    balanceMessagesLabel: string;
    purchaseAmountRub: number;
}

export const PRICING_PLANS: PricingPlanConfig[] = [
    {
        id: "start",
        name: "Старт",
        description: "Для теста гипотез и первых продаж",
        priceFrom: 1000,
        ctaLabel: "Подключить",
        ctaLink: buildManagerContactUrl("Привет! Хочу подключить тариф Старт"),
        perMessage: "1.50 ₽",
        perMessageRub: 1.5,
        balancePrefill: 5000,
        balanceMessagesLabel: "до 5 000 сообщ.",
        purchaseAmountRub: 1000,
        features: [
            { label: "До 5 000 сообщений / мес", included: true },
            { label: "MTProto-подключение", included: true },
            { label: "Базовая настройка критериев", included: true },
            { label: "Запуск за 1 рабочий день", included: true },
        ],
    },
    {
        id: "business",
        name: "Бизнес",
        description: "Для агентств и отделов продаж",
        priceFrom: 5000,
        ctaLabel: "Подключить",
        ctaLink: buildManagerContactUrl("Привет! Хочу подключить тариф Бизнес"),
        recommended: true,
        perMessage: "1.00 ₽",
        perMessageRub: 1,
        balancePrefill: 10000,
        balanceMessagesLabel: "до 10 000 сообщ.",
        purchaseAmountRub: 5000,
        features: [
            { label: "До 10 000 сообщений / мес", included: true },
            { label: "Настройка интентов и контекста", included: true },
            { label: "Выгрузка в CRM", included: true },
            { label: "Помощь с внедрением", included: true },
        ],
    },
    {
        id: "scale",
        name: "Масштаб",
        description: "Для больших потоков",
        priceFrom: 7500,
        ctaLabel: "Связаться",
        ctaLink: buildManagerContactUrl("Привет! Интересует тариф Масштаб"),
        perMessage: "0.75 ₽",
        perMessageRub: 0.75,
        balancePrefill: 20000,
        balanceMessagesLabel: "10 000+ сообщ.",
        purchaseAmountRub: 7500,
        features: [
            { label: "10 000+ сообщений / мес", included: true },
            { label: "Глубокая настройка критериев", included: true },
            { label: "Персональный менеджер", included: true },
            { label: "SLA и приоритетная поддержка", included: true },
        ],
    },
];

export const PRICING_PLAN_BY_ID = Object.fromEntries(
    PRICING_PLANS.map((plan) => [plan.id, plan]),
) as Record<PricingPlanConfig["id"], PricingPlanConfig>;

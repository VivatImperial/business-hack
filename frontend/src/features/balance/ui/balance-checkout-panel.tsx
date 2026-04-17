import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { CheckoutOrderSummary } from "@/lib/queries/balance";
import type { PricingPlanConfig } from "@/shared/config/pricing-plans";

interface BalanceCheckoutPanelProps {
    selectedPlan: PricingPlanConfig;
    email: string;
    onEmailChange: (value: string) => void;
    phone: string;
    onPhoneChange: (value: string) => void;
    onCheckout: () => void;
    isSubmitting: boolean;
    latestPayment?: CheckoutOrderSummary | null;
    compact?: boolean;
    embedded?: boolean;
}

const STATUS_COPY: Record<
    string,
    { title: string; tone: string; description: string }
> = {
    approved: {
        title: "Оплата подтверждена",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
        description: "Пакет уже начислен на баланс сообщений.",
    },
    pending: {
        title: "Ссылка на оплату создана",
        tone: "bg-amber-50 text-amber-700 border-amber-200",
        description: "Если не завершили оплату, можно открыть ссылку повторно.",
    },
    authorized: {
        title: "Платёж авторизован",
        tone: "bg-blue-50 text-blue-700 border-blue-200",
        description: "Ожидаем финального подтверждения оплаты.",
    },
    failed: {
        title: "Оплата не завершена",
        tone: "bg-rose-50 text-rose-700 border-rose-200",
        description: "Можно создать новую ссылку и повторить оплату.",
    },
};

function formatPrice(value: number) {
    return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function BalanceCheckoutPanel({
    selectedPlan,
    email,
    onEmailChange,
    phone,
    onPhoneChange,
    onCheckout,
    isSubmitting,
    latestPayment,
    compact = false,
    embedded = false,
}: BalanceCheckoutPanelProps) {
    const statusInfo = latestPayment
        ? (STATUS_COPY[latestPayment.status] ?? STATUS_COPY.pending)
        : null;

    const hideHeader = embedded && compact;

    return (
        <div
            className={`flex flex-col ${
                embedded
                    ? compact
                        ? "gap-3"
                        : "gap-5 p-6"
                    : `rounded-2xl bg-white border border-gray-200 ${compact ? "gap-4 p-4" : "gap-5 p-6"}`
            }`}
        >
            {!hideHeader && (
                <div>
                    <h3 className="text-[16px] font-bold text-foreground">
                        Оплатить пакет
                    </h3>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                        Чек отправим на email сразу после оплаты в Точке
                    </p>
                </div>
            )}

            {statusInfo && latestPayment && (
                <div
                    className={`rounded-2xl border px-4 py-3 ${statusInfo.tone}`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[13px] font-semibold">
                                {statusInfo.title}
                            </p>
                            <p className="text-[12px] mt-1 opacity-90">
                                {statusInfo.description}
                            </p>
                        </div>
                        <span className="text-[12px] font-semibold whitespace-nowrap">
                            {formatPrice(latestPayment.amountRub)}
                        </span>
                    </div>
                    {latestPayment.paymentUrl &&
                        latestPayment.status !== "approved" && (
                            <a
                                href={latestPayment.paymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex text-[12px] font-semibold underline underline-offset-4"
                            >
                                Открыть последнюю ссылку
                            </a>
                        )}
                </div>
            )}

            {!hideHeader && (
                <div className="rounded-2xl bg-secondary/80 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
                                Выбранный пакет
                            </p>
                            <p className="mt-1 text-[18px] font-bold text-foreground">
                                {selectedPlan.name}
                            </p>
                            <p className="mt-1 text-[13px] text-muted-foreground">
                                {selectedPlan.balanceMessagesLabel}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[12px] text-muted-foreground">
                                {selectedPlan.perMessage} / сообщ.
                            </p>
                            <p className="mt-1 text-[22px] font-extrabold text-foreground">
                                {formatPrice(selectedPlan.purchaseAmountRub)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-foreground">
                        Email для чека
                    </label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => onEmailChange(e.target.value)}
                        placeholder="you@company.ru"
                        className={compact ? "h-11" : "h-12 text-[15px]"}
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-foreground">
                        Телефон для чека
                    </label>
                    <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        placeholder="+7 999 123-45-67"
                        className={compact ? "h-11" : "h-12 text-[15px]"}
                    />
                </div>
            </div>

            <Button
                onClick={onCheckout}
                disabled={isSubmitting}
                className="h-12 rounded-2xl bg-blue-500 text-white font-bold text-[15px] hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-40"
            >
                {isSubmitting ? "Создаём ссылку..." : "Оплатить через Точку"}
            </Button>

            {!hideHeader && (
                <p className="text-[11px] text-muted-foreground/50 text-center leading-relaxed">
                    После создания ссылки вы перейдёте на страницу оплаты Точки.
                </p>
            )}
        </div>
    );
}

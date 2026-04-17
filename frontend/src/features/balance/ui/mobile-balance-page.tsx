import { CheckIcon } from "@heroicons/react/24/solid";
import { Input } from "@/shared/ui/input";
import { getRouteApi } from "@tanstack/react-router";
import { PRICING_PLANS } from "@/shared/config/pricing-plans";
import dayjs from "dayjs";
import { useBalancePage } from "../lib/use-balance-page";
import { BalanceCheckoutPanel } from "./balance-checkout-panel";

const appRoute = getRouteApi("/_app");

export function MobileBalancePage() {
    const { tenantId } = appRoute.useRouteContext();
    const page = useBalancePage(tenantId!);

    return (
        <div className="flex flex-col gap-4 pb-4">
            {/* Balance — compact, no title */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div>
                    <span className="text-[13px] font-medium text-muted-foreground">
                        Доступно
                    </span>
                    <div className="mt-0.5 font-heading text-[36px] font-extrabold leading-none tracking-tight text-foreground">
                        {page.balance.current.toLocaleString("ru-RU")}
                    </div>
                </div>
                <div className="rounded-xl bg-blue-500 px-3 py-1.5">
                    <span className="text-[14px] font-bold text-white">
                        {page.checkout.selectedPlan.name}
                    </span>
                </div>
            </div>

            {/* Tariff cards — compact grid */}
            <div className="grid grid-cols-3 gap-2">
                {PRICING_PLANS.map((plan) => {
                    const isSelected = page.checkout.selectedPlanId === plan.id;
                    return (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => page.handlePlanSelect(plan.id)}
                            className={`relative flex flex-col items-center rounded-2xl px-2 py-4 text-center transition-colors ${
                                isSelected
                                    ? "border-2 border-blue-500 bg-blue-50/40"
                                    : "border border-slate-200 bg-white"
                            }`}
                        >
                            {isSelected && (
                                <div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-blue-500 text-white">
                                    <CheckIcon className="size-3" />
                                </div>
                            )}
                            <span className="text-[15px] text-foreground">
                                {plan.name}
                            </span>
                            <span className="mt-1 font-heading text-[22px] font-extrabold leading-none text-foreground">
                                {plan.perMessage}
                            </span>
                            <span className="mt-0.5 text-[12px] text-muted-foreground">
                                за сообщ.
                            </span>
                            <span className="mt-2 text-[14px] text-foreground">
                                от{" "}
                                {plan.purchaseAmountRub.toLocaleString("ru-RU")}{" "}
                                ₽
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Checkout */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div>
                    <label className="mb-1.5 block text-[15px] font-medium text-foreground">
                        Сумма пополнения
                    </label>
                    <div className="relative">
                        <Input
                            type="text"
                            inputMode="numeric"
                            value={page.amountInput}
                            onChange={(e) =>
                                page.handleAmountChange(e.target.value)
                            }
                            placeholder="10 000"
                            className="h-12 text-[18px] font-bold pr-8"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] font-medium text-muted-foreground/50">
                            ₽
                        </span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                        ~
                        {Math.floor(
                            page.amountRaw /
                                page.checkout.selectedPlan.perMessageRub,
                        ).toLocaleString("ru-RU")}{" "}
                        сообщений
                    </p>
                </div>

                <BalanceCheckoutPanel
                    selectedPlan={page.checkout.selectedPlan}
                    email={page.checkout.email}
                    onEmailChange={page.checkout.setEmail}
                    phone={page.checkout.phone}
                    onPhoneChange={page.checkout.setPhone}
                    onCheckout={page.checkout.startCheckout}
                    isSubmitting={page.checkout.isSubmitting}
                    latestPayment={page.checkout.latestPayment}
                    compact
                    embedded
                />
            </div>

            {/* History — always rendered */}
            <div>
                <h3 className="text-[15px] font-bold text-foreground mb-2">
                    История
                </h3>
                {page.historyItems.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {page.historyItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between py-3"
                            >
                                <span className="text-[14px] text-muted-foreground tabular-nums">
                                    {dayjs(item.date).format("DD MMM, HH:mm")}
                                </span>
                                <span
                                    className={`text-[15px] font-bold tabular-nums ${
                                        item.amount > 0
                                            ? "text-emerald-600"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {item.amount > 0 ? "+" : ""}
                                    {item.amount.toLocaleString("ru-RU")}{" "}
                                    сообщений
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[14px] text-muted-foreground">
                        История операций пуста
                    </p>
                )}
            </div>
        </div>
    );
}

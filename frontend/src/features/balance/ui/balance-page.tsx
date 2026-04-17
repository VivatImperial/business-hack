import { CheckIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import { Input } from "@/shared/ui/input";
import { AnimatePresence, motion } from "@/shared/animations/motion";
import { getRouteApi } from "@tanstack/react-router";
import { PRICING_PLANS } from "@/shared/config/pricing-plans";
import { GuideHelpButton } from "@/shared/layout/guide-help-button";
import dayjs from "dayjs";
import { useBalancePage } from "../lib/use-balance-page";
import { BalanceCheckoutPanel } from "./balance-checkout-panel";

const appRoute = getRouteApi("/_app");

export function BalancePage() {
    const { tenantId } = appRoute.useRouteContext();
    const page = useBalancePage(tenantId!);

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="font-heading text-[26px] font-extrabold tracking-tight text-foreground">
                        Баланс
                    </h1>
                    <GuideHelpButton section="balance" />
                </div>
                <p className="text-[15px] text-muted-foreground mt-1">
                    Управление квотой обработки сообщений
                </p>
            </div>

            {/* Grid: 2/3 left + 1/3 right */}
            <div className="grid grid-cols-3 gap-6 items-start">
                {/* Left column (2/3) */}
                <div className="col-span-2 flex flex-col gap-6">
                    {/* Current balance + active plan */}
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6">
                        <div>
                            <p className="text-[14px] font-medium text-muted-foreground">
                                Доступно сообщений
                            </p>
                            <span className="mt-1 block font-heading text-[48px] font-semibold leading-none tracking-tight text-foreground">
                                {page.balance.current.toLocaleString("ru-RU")}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-[14px] font-medium text-muted-foreground">
                                Активный пакет
                            </p>
                            <div className="mt-2 inline-flex rounded-xl bg-blue-500 px-4 py-2">
                                <span className="text-[16px] font-bold text-white">
                                    {page.checkout.selectedPlan.name}
                                </span>
                            </div>
                            <p className="mt-1.5 text-[14px] text-muted-foreground">
                                {
                                    page.checkout.selectedPlan
                                        .balanceMessagesLabel
                                }
                            </p>
                        </div>
                    </div>

                    {/* Tariff selection */}
                    <div>
                        <div className="grid grid-cols-3 gap-4">
                            {PRICING_PLANS.map((plan) => {
                                const isSelected =
                                    page.checkout.selectedPlanId === plan.id;
                                return (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() =>
                                            page.handlePlanSelect(plan.id)
                                        }
                                        className={`relative flex flex-col items-start rounded-2xl p-5 text-left transition-colors ${
                                            isSelected
                                                ? "border-2 border-blue-500 bg-blue-50/40"
                                                : "border border-slate-200 bg-white hover:border-slate-300"
                                        }`}
                                    >
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{
                                                        scale: 0,
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        scale: 1,
                                                        opacity: 1,
                                                    }}
                                                    exit={{
                                                        scale: 0,
                                                        opacity: 0,
                                                    }}
                                                    className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-blue-500 text-white"
                                                >
                                                    <CheckIcon className="size-3.5" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <span className="text-[18px] font-medium text-foreground">
                                            {plan.name}
                                        </span>
                                        <span className="mt-0.5 text-[14px] text-muted-foreground">
                                            {plan.description}
                                        </span>

                                        <span className="text-[14px] text-muted-foreground">
                                            {plan.perMessage} / сообщ.
                                        </span>

                                        <span className="mt-3 ml-auto text-[28px] font-bold text-foreground">
                                            от{" "}
                                            {plan.purchaseAmountRub.toLocaleString(
                                                "ru-RU",
                                            )}{" "}
                                            ₽
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Transaction history */}
                    <div>
                        <h3 className="text-[17px] font-bold text-foreground mb-4">
                            История операций
                        </h3>
                        {page.historyItems.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {page.historyItems.slice(0, 5).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between py-3.5"
                                    >
                                        <span className="text-[14px] text-muted-foreground tabular-nums">
                                            {dayjs(item.date).format(
                                                "DD MMM, HH:mm",
                                            )}
                                        </span>
                                        <span
                                            className={`text-[15px] font-bold tabular-nums ${
                                                item.amount > 0
                                                    ? "text-emerald-600"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            {item.amount > 0 ? "+" : ""}
                                            {item.amount.toLocaleString(
                                                "ru-RU",
                                            )}{" "}
                                            сообщений
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-6 text-start text-[14px] text-muted-foreground">
                                Пока нет операций
                            </p>
                        )}
                    </div>
                </div>

                {/* Right column (1/3) — sticky checkout */}
                <div className="sticky top-6 col-span-1">
                    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white">
                        <div className="flex flex-col gap-4 p-5 pb-4">
                            <h3 className="text-[17px] font-bold text-foreground">
                                К оплате
                            </h3>
                            <div className="flex items-center justify-between">
                                <span className="text-[15px] text-muted-foreground">
                                    Пакет {page.checkout.selectedPlan.name}
                                </span>
                                <span className="text-[14px] text-muted-foreground">
                                    {page.checkout.selectedPlan.perMessage} /
                                    сообщ.
                                </span>
                            </div>

                            {/* Amount input */}
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
                                            page.handleAmountChange(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="10 000"
                                        className="h-12 text-[18px] font-bold pr-8"
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] font-medium text-muted-foreground/50">
                                        ₽
                                    </span>
                                </div>
                                <p className="mt-1.5 text-[14px] text-muted-foreground">
                                    ~
                                    {Math.floor(
                                        page.amountRaw /
                                            page.checkout.selectedPlan
                                                .perMessageRub,
                                    ).toLocaleString("ru-RU")}{" "}
                                    сообщений
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100" />

                        <div className="p-5 pt-4">
                            <BalanceCheckoutPanel
                                selectedPlan={page.checkout.selectedPlan}
                                email={page.checkout.email}
                                onEmailChange={page.checkout.setEmail}
                                phone={page.checkout.phone}
                                onPhoneChange={page.checkout.setPhone}
                                onCheckout={page.checkout.startCheckout}
                                isSubmitting={page.checkout.isSubmitting}
                                latestPayment={page.checkout.latestPayment}
                                embedded
                                compact
                            />
                        </div>

                        <div className="flex items-center justify-center gap-1.5 px-5 pb-4">
                            <LockClosedIcon className="size-3.5 text-muted-foreground/40" />
                            <span className="text-[13px] text-muted-foreground/50">
                                Безопасная оплата. Чек придет на email.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { balanceQueries, type ExtendedBalanceResponse } from "@/lib/queries/balance";
import { PRICING_PLANS } from "@/shared/config/pricing-plans";
import { useBalanceCheckout } from "./use-balance-checkout";

interface HistoryItem {
    id: number;
    date: string;
    amount: number;
    balanceAfter: number;
    type: string;
    description?: string;
}

const fmtAmount = (n: number) => n.toLocaleString("ru-RU");

export function useBalancePage(tenantId: number) {
    const { data: balanceData } = useSuspenseQuery(
        balanceQueries.detail(tenantId),
    );
    const balance = balanceData as ExtendedBalanceResponse;

    const { data: historyData } = useQuery(balanceQueries.history(tenantId));

    const checkout = useBalanceCheckout({
        tenantId,
        latestPayment: balance.latestPayment,
    });

    const [amountRaw, setAmountRaw] = useState(
        checkout.selectedPlan.purchaseAmountRub,
    );
    const amountInput = fmtAmount(amountRaw);

    const handlePlanSelect = (
        planId: Parameters<typeof checkout.setSelectedPlanId>[0],
    ) => {
        checkout.setSelectedPlanId(planId);
        const plan = PRICING_PLANS.find((p) => p.id === planId);
        if (plan) setAmountRaw(plan.purchaseAmountRub);
    };

    const handleAmountChange = (value: string) => {
        const num = Number(value.replace(/\D/g, ""));
        setAmountRaw(num);
        if (num <= 0) return;
        const sorted = [...PRICING_PLANS].sort(
            (a, b) => a.purchaseAmountRub - b.purchaseAmountRub,
        );
        let matched = sorted[0];
        for (const plan of sorted) {
            if (num >= plan.purchaseAmountRub) matched = plan;
        }
        if (matched && matched.id !== checkout.selectedPlanId) {
            checkout.setSelectedPlanId(matched.id);
        }
    };

    const historyItems =
        (
            historyData as {
                items?: Array<HistoryItem>;
            }
        )?.items ?? [];

    return {
        balance,
        checkout,
        amountRaw,
        amountInput,
        handlePlanSelect,
        handleAmountChange,
        historyItems,
    };
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
    balanceMutations,
    type BalancePlanId,
    type CheckoutOrderSummary,
} from "@/lib/queries/balance";
import { PRICING_PLAN_BY_ID } from "@/shared/config/pricing-plans";
import { snackbarStore } from "@/shared/lib/snackbar-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UseBalanceCheckoutParams {
    tenantId: number;
    latestPayment?: CheckoutOrderSummary | null;
}

export function useBalanceCheckout({
    tenantId,
    latestPayment,
}: UseBalanceCheckoutParams) {
    const queryClient = useQueryClient();
    const [selectedPlanId, setSelectedPlanId] = useState<BalancePlanId>(
        latestPayment?.planId ?? "business",
    );
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const mutation = useMutation({
        mutationFn: (payload: {
            planId: BalancePlanId;
            email: string;
            phone?: string;
        }) => balanceMutations.createCheckout(tenantId, payload),
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: ["balance"] });
            if (typeof window !== "undefined") {
                window.location.href = data.paymentUrl;
            }
        },
        onError: (error) => {
            snackbarStore.showError(
                error instanceof Error
                    ? error.message
                    : "Не удалось создать ссылку на оплату",
            );
        },
    });

    const selectedPlan = PRICING_PLAN_BY_ID[selectedPlanId];
    const isEmailValid = EMAIL_RE.test(email.trim());

    const startCheckout = () => {
        if (!isEmailValid) {
            snackbarStore.showError("Укажите email для отправки чека");
            return;
        }
        mutation.mutate({
            planId: selectedPlanId,
            email: email.trim().toLowerCase(),
            phone: phone.trim() || undefined,
        });
    };

    return {
        selectedPlan,
        selectedPlanId,
        setSelectedPlanId,
        email,
        setEmail,
        phone,
        setPhone,
        isEmailValid,
        latestPayment,
        isSubmitting: mutation.isPending,
        startCheckout,
    };
}

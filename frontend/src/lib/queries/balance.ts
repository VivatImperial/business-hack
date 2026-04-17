import { queryOptions } from '@tanstack/react-query'
import {
  getBalanceApiTenantsTenantIdBalanceGet,
  replenishBalanceApiTenantsTenantIdBalanceReplenishPost,
  getBalanceHistoryApiTenantsTenantIdBalanceHistoryGet,
} from '../api/generated/balance/balance'
import type { BalanceResponse, QuotaHistoryResponse } from '../api/generated/schemas'
import { customFetch } from '../api/client'

export type BalancePlanId = 'start' | 'business' | 'scale'

export interface CheckoutOrderSummary {
  orderId: string
  planId: BalancePlanId
  status: string
  amountRub: number
  quotaAmount: number
  paymentUrl?: string | null
  createdAt: string
  paidAt?: string | null
}

export interface ExtendedBalanceResponse extends BalanceResponse {
  latestPayment?: CheckoutOrderSummary | null
}

export interface BalanceCheckoutInput {
  planId: BalancePlanId
  email: string
  phone?: string
}

export interface BalanceCheckoutResponse {
  paymentUrl: string
  order: CheckoutOrderSummary
}

export const balanceQueries = {
  baseKey: ['balance'] as const,
  detail: (tenantId: number) =>
    queryOptions({
      queryKey: ['balance', 'detail', tenantId] as const,
      queryFn: async (): Promise<ExtendedBalanceResponse> => {
        const res = await getBalanceApiTenantsTenantIdBalanceGet(tenantId)
        return res.data as ExtendedBalanceResponse
      },
    }),
  history: (tenantId: number, params?: { offset?: number; limit?: number }) =>
    queryOptions({
      queryKey: ['balance', 'history', tenantId, params] as const,
      queryFn: async (): Promise<QuotaHistoryResponse> => {
        const res = await getBalanceHistoryApiTenantsTenantIdBalanceHistoryGet(
          tenantId,
          params,
        )
        return res.data as QuotaHistoryResponse
      },
    }),
}

export const balanceMutations = {
  replenish: async (tenantId: number, amount: number) => {
    const res = await replenishBalanceApiTenantsTenantIdBalanceReplenishPost(
      tenantId,
      { amount },
    )
    return res.data
  },
  createCheckout: async (
    tenantId: number,
    payload: BalanceCheckoutInput,
  ): Promise<BalanceCheckoutResponse> => {
    const res = await customFetch<{
      data: BalanceCheckoutResponse
      status: number
      headers: Headers
    }>(`/api/tenants/${tenantId}/balance/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.data
  },
}

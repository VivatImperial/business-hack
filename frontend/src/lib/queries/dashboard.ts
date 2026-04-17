import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import {
  getDashboardStatsApiTenantsTenantIdDashboardStatsGet,
} from '../api/generated/dashboard/dashboard'
import type { DashboardStatsResponse } from '../api/generated/schemas'

export const dashboardQueries = {
  stats: (tenantId: number, period = '7d') =>
    queryOptions({
      queryKey: ['dashboard', 'stats', tenantId, period],
      queryFn: async (): Promise<DashboardStatsResponse> => {
        const res = await getDashboardStatsApiTenantsTenantIdDashboardStatsGet(
          tenantId,
          { period },
        )
        return res.data as DashboardStatsResponse
      },
      placeholderData: keepPreviousData,
    }),
}

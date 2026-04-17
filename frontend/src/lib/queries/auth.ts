import { queryOptions } from '@tanstack/react-query'
import { BASE_URL } from '../api/client'
import type { TenantInfo } from '../auth'

export interface CurrentUserInfo {
  username: string
  role: string
  canAccessAdmin: boolean
  displayName?: string | null
  avatarUrl?: string | null
}

async function fetchMe(token: string): Promise<CurrentUserInfo> {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

async function fetchTenantsList(token: string): Promise<TenantInfo[]> {
  const res = await fetch(`${BASE_URL}/api/platform/tenants`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch tenants')
  return res.json()
}

export const authQueries = {
  me: (token: string | undefined) =>
    queryOptions({
      queryKey: ['auth', 'me'],
      queryFn: () => fetchMe(token!),
      enabled: !!token,
      staleTime: Infinity,
    }),
  tenants: (token: string | undefined) =>
    queryOptions({
      queryKey: ['auth', 'tenants'],
      queryFn: () => fetchTenantsList(token!),
      enabled: !!token,
      staleTime: 60_000,
    }),
}

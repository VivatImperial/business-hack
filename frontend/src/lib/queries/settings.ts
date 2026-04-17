import { queryOptions } from '@tanstack/react-query'
import {
  getSettingsFrontendApiTenantsTenantIdSettingsGet,
  updateSettingsFrontendApiTenantsTenantIdSettingsPost,
  addTenantSourceApiTenantsTenantIdSourcesAddPost,
  deleteTenantSourceApiTenantsTenantIdSourcesDelete,
} from '../api/generated/settings/settings'
import {
  updateTenantDestinationApiTenantsTenantIdDestinationPut,
} from '../api/generated/default/default'
import type { UpdateSettingsInput, SettingsResponse } from '../api/generated/schemas'
import type { SettingsData, SourceChat, SourceScanJob, SourceTopicsResponse } from '@/features/settings/types'
import { customFetch } from '../api/client'

export interface ManagedDestinationResponse {
  created: boolean
  defaultChat: string
  defaultChatTitle: string
  peerId?: number | null
}

export interface EnableTopicsResponse {
  defaultChat: string
  defaultChatTitle: string
  createdTopics: number
  reusedTopics: number
  totalTopics: number
}

export interface DestinationCheckResponse {
  status: string
  defaultChat?: string | null
  defaultChatTitle?: string | null
  peerId?: number | null
  canRecreate: boolean
  detail?: string | null
}

export interface ScanPauseUpdateResponse {
  paused: boolean
  pausedAt?: string | null
}

export const settingsQueries = {
  baseKey: ['settings'] as const,
  detail: (tenantId: number) =>
    queryOptions({
      queryKey: ['settings', 'detail', tenantId] as const,
      queryFn: async (): Promise<SettingsResponse> => {
        const res = await getSettingsFrontendApiTenantsTenantIdSettingsGet(tenantId)
        return res.data as SettingsResponse
      },
    }),
  sourceTopics: (tenantId: number, sourceId: string) =>
    queryOptions({
      queryKey: ['settings', 'source-topics', tenantId, sourceId] as const,
      queryFn: async (): Promise<SourceTopicsResponse> => {
        const res = await customFetch<{ data: SourceTopicsResponse }>(
          `/api/tenants/${tenantId}/sources/${sourceId}/topics`,
          {
            method: 'GET',
          },
        )
        return res.data
      },
      enabled: Boolean(tenantId && sourceId),
    }),
  sourceScan: (tenantId: number, sourceId: string) =>
    queryOptions({
      queryKey: ['settings', 'source-scan', tenantId, sourceId] as const,
      queryFn: async (): Promise<SourceScanJob | null> => {
        const res = await customFetch<{ data: SourceScanJob | null }>(
          `/api/tenants/${tenantId}/sources/${sourceId}/scan`,
          {
            method: 'GET',
          },
        )
        return res.data
      },
      enabled: Boolean(tenantId && sourceId),
      refetchInterval: 5000,
    }),
  destinationCheck: (tenantId: number) =>
    queryOptions({
      queryKey: ['settings', 'destination-check', tenantId] as const,
      queryFn: async (): Promise<DestinationCheckResponse> => {
        const res = await customFetch<{ data: DestinationCheckResponse }>(
          `/api/tenants/${tenantId}/destination/check`,
          {
            method: 'GET',
          },
        )
        return res.data
      },
      enabled: Boolean(tenantId),
    }),
}

export interface CheckAccessSourceResult {
  id: string
  accessError: string | null
}

export interface CheckAccessResponse {
  sources: CheckAccessSourceResult[]
  destination: { accessError: string | null } | null
}

export const settingsMutations = {
  update: async (tenantId: number, data: SettingsData) => {
    const res = await updateSettingsFrontendApiTenantsTenantIdSettingsPost(
      tenantId,
      data as unknown as UpdateSettingsInput,
    )
    return res.data
  },
  createManagedDestination: async (tenantId: number, data?: { title?: string; about?: string }) => {
    const res = await customFetch<{ data: ManagedDestinationResponse }>(
      `/api/tenants/${tenantId}/destination/create-managed`,
      {
        method: 'POST',
        body: JSON.stringify(data ?? {}),
      },
    )
    return res.data
  },
  enableTopics: async (tenantId: number) => {
    const res = await customFetch<{ data: EnableTopicsResponse }>(
      `/api/tenants/${tenantId}/destination/enable-topics`,
      {
        method: 'POST',
      },
    )
    return res.data
  },
  addSource: async (tenantId: number, url: string) => {
    const res = await addTenantSourceApiTenantsTenantIdSourcesAddPost(tenantId, { url })
    return res.data
  },
  deleteSource: async (tenantId: number, sourceValue: string) => {
    const res = await deleteTenantSourceApiTenantsTenantIdSourcesDelete(tenantId, { source_value: sourceValue })
    return res.data
  },
  updateDestination: async (tenantId: number, defaultChat: string) => {
    const res = await updateTenantDestinationApiTenantsTenantIdDestinationPut(tenantId, { default: defaultChat })
    return res.data
  },
  updateSourceConfig: async (tenantId: number, sourceId: string, data: { disabledTopicIds: number[] }) => {
    const res = await customFetch<{ data: { status: string; source: SourceChat } }>(
      `/api/tenants/${tenantId}/sources/${sourceId}/config`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    )
    return res.data
  },
  startSourceScan: async (
    tenantId: number,
    sourceId: string,
    data: { dateFrom?: string; dateTo?: string },
  ) => {
    const res = await customFetch<{ data: SourceScanJob }>(
      `/api/tenants/${tenantId}/sources/${sourceId}/scan`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    )
    return res.data
  },
  resetStaleDestination: async (tenantId: number) => {
    const res = await customFetch<{ data: { status: string } }>(
      `/api/tenants/${tenantId}/destination/reset-stale`,
      {
        method: 'POST',
      },
    )
    return res.data
  },
  checkChatsAccess: async (tenantId: number): Promise<CheckAccessResponse> => {
    const res = await customFetch<{ data: CheckAccessResponse }>(
      `/api/tenants/${tenantId}/chats/check-access`,
      {
        method: 'POST',
      },
    )
    return res.data
  },
  recreateDestination: async (tenantId: number) => {
    const res = await customFetch<{ data: ManagedDestinationResponse }>(
      `/api/tenants/${tenantId}/destination/recreate`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    )
    return res.data
  },
  pauseScan: async (tenantId: number) => {
    const res = await customFetch<{ data: ScanPauseUpdateResponse }>(
      `/api/tenants/${tenantId}/scan/pause`,
      {
        method: 'POST',
      },
    )
    return res.data
  },
  resumeScan: async (tenantId: number) => {
    const res = await customFetch<{ data: ScanPauseUpdateResponse }>(
      `/api/tenants/${tenantId}/scan/resume`,
      {
        method: 'POST',
      },
    )
    return res.data
  },
}


import { queryOptions } from '@tanstack/react-query'
import {
  getPromptsStepsApiTenantsTenantIdPromptsStepsGet,
  updatePromptStepApiTenantsTenantIdPromptsStepsStepIdPost,
} from '../api/generated/prompts/prompts'
import type { UpdatePromptStepInput, PromptsStepsResponse } from '../api/generated/schemas'
import { customFetch } from '../api/client'
import type { PromptAssistantUsage, PromptSafetyVerdict } from '@/features/settings/types'

export interface PromptAssistantValidateResponse {
  safety: PromptSafetyVerdict
  usage?: PromptAssistantUsage | null
}

export interface PromptAssistantGenerateResponse {
  generatedPrompt: string
  usage: PromptAssistantUsage
  safety: PromptSafetyVerdict
}

export const promptsQueries = {
  baseKey: ['prompts'] as const,
  list: (tenantId: number) =>
    queryOptions({
      queryKey: ['prompts', 'list', tenantId] as const,
      queryFn: async (): Promise<PromptsStepsResponse> => {
        const res = await getPromptsStepsApiTenantsTenantIdPromptsStepsGet(tenantId)
        return res.data as PromptsStepsResponse
      },
    }),
}

export const promptsMutations = {
  update: async (tenantId: number, data: { id: number; systemPrompt?: string; userTemplate?: string; criteriaPrompt?: string }) => {
    const body: UpdatePromptStepInput = {
      systemPrompt: data.systemPrompt,
      userTemplate: data.userTemplate,
      criteriaPrompt: data.criteriaPrompt,
    }
    const res = await updatePromptStepApiTenantsTenantIdPromptsStepsStepIdPost(
      tenantId,
      data.id,
      body,
    )
    return res.data
  },
  validate: async (tenantId: number, prompt: string) => {
    const res = await customFetch<{ data: PromptAssistantValidateResponse }>(
      `/api/tenants/${tenantId}/prompts/assistant/validate`,
      {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      },
    )
    return res.data
  },
  generate: async (tenantId: number, prompt: string) => {
    const res = await customFetch<{ data: PromptAssistantGenerateResponse }>(
      `/api/tenants/${tenantId}/prompts/assistant/generate`,
      {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      },
    )
    return res.data
  },
}

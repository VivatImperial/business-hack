import type { PromptStep } from "@/lib/api/generated/schemas"

export interface TelegramCredentials {
  apiId: string
  apiHash: string
  stringSession: string
  sessionStatus?: string | null
  lastError?: string | null
  backoffUntil?: string | null
  scanPaused?: boolean
  pausedAt?: string | null
}

export interface SettingsIssue {
  code: string
  data?: Record<string, unknown>
}

export type SourceChatStatusKind = "ok" | "user_left" | "unresolved"

export interface SourceChatStatus {
  kind: SourceChatStatusKind
  reason?: string | null
}

export interface SourceChat {
  id: string
  url: string
  title?: string
  username?: string
  avatarUrl?: string
  disabledTopicIds?: number[]
  scanJob?: SourceScanJob | null
  resolvedChatId?: string | null
  status: SourceChatStatus
}

export interface SourceForumTopic {
  id: number
  title: string
  isEnabled: boolean
}

export interface SourceTopicsResponse {
  sourceId: string
  sourceValue: string
  title?: string
  isForum: boolean
  topics: SourceForumTopic[]
}

export interface SourceScanJob {
  id: string
  status: string
  dateFrom?: string | null
  dateTo?: string | null
  requestedAt: string
  startedAt?: string | null
  finishedAt?: string | null
  errorText?: string | null
  totalMessages: number
  enqueuedMessages: number
  processedMessages: number
}

export interface RoutingRule {
  id: string
  tagId: number
  tagName?: string
  targetChat: string
  title?: string
  topicId?: number | null
}

export interface RoutingSettings {
  defaultChat: string
  defaultChatTitle?: string
  rules: RoutingRule[]
}

export interface MistralKey {
  id: string
  key: string
  status: 'active' | 'expired' | 'error'
}

export interface MistralSettings {
  model: string
  keys: MistralKey[]
}


export interface PromptSafetyVerdict {
  status: string
  blocked: boolean
  reason: string
  category?: string | null
  checkedAt: string
  model?: string | null
}

export interface PromptAssistantUsage {
  limit: number
  used: number
  remaining: number
  day: string
}

export interface PromptAssistantState {
  safety?: PromptSafetyVerdict | null
  usage?: PromptAssistantUsage | null
}

export interface PromptStepWithAssistant extends PromptStep {
  assistant?: PromptAssistantState | null
}

export interface SettingsData {
  telegram: TelegramCredentials
  sources: SourceChat[]
  routing: RoutingSettings
  mistral: MistralSettings
  issues?: SettingsIssue[]
}

export interface UpdateSettingsInput {
  telegram?: TelegramCredentials
  sources?: SourceChat[]
  routing?: RoutingSettings
  mistral?: MistralSettings
}

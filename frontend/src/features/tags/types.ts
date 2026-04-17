export type TagColor = 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'cyan' | 'pink' | 'gray'

export const TAG_COLORS: Record<TagColor, { bg: string; text: string; dot: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', dot: '#3b82f6' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: '#10b981' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', dot: '#a855f7' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', dot: '#f59e0b' },
  red: { bg: 'bg-red-50', text: 'text-red-500', dot: '#ef4444' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', dot: '#06b6d4' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', dot: '#ec4899' },
  gray: { bg: 'bg-muted', text: 'text-muted-foreground', dot: '#9ca3af' },
}

export type TagGroup = 'services' | 'roles' | 'industries' | 'custom'

export const TAG_GROUPS: Record<TagGroup, { label: string; color: TagColor }> = {
  services: { label: 'Услуги', color: 'green' },
  roles: { label: 'Должности', color: 'blue' },
  industries: { label: 'Отрасли', color: 'purple' },
  custom: { label: 'Пользовательские', color: 'gray' },
}

export interface TagRecord {
  id: number
  name: string
  description: string
  color: TagColor
  group: TagGroup
  isActive: boolean
  linkedPromptId: number | null
  linkedPromptName: string | null
  keywords: string[]
  createdAt: string
  stats: {
    messagesCount: number
    relevantCount: number
    conversionRate: number
    trend: number[]
    trendDelta: number
  }
}

export interface TagsListParams {
  search: string
  group: TagGroup | 'all'
  period: 'today' | '7d' | '30d' | '90d'
  sortBy: 'name' | 'messagesCount' | 'conversionRate'
  sortDir: 'asc' | 'desc'
}

export const TAGS_LIST_DEFAULTS: Required<TagsListParams> = {
  search: '',
  group: 'all',
  period: '7d',
  sortBy: 'messagesCount',
  sortDir: 'desc',
}

export interface CreateTagInput {
  name: string
  description: string
  color: TagColor
  group: TagGroup
  keywords: string[]
  linkedPromptId: number | null
}

export interface UpdateTagInput extends Partial<CreateTagInput> {
  id: number
  isActive?: boolean
}

export interface MergeTagsInput {
  sourceIds: number[]
  targetId: number
}

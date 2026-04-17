export interface PromptStep {
  id: number
  name: string
  shortName: string
  description: string
  systemPrompt: string
  userTemplate: string
  criteriaPrompt: string
  systemEditable: boolean
  userTemplateEditable: boolean
  criteriaEditable: boolean
  updatedAt: string
}

export interface PromptsData {
  steps: PromptStep[]
}

export interface UpdatePromptInput {
  id: number
  systemPrompt?: string
  userTemplate?: string
  criteriaPrompt?: string
}

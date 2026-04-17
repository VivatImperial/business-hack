export interface UtmPromptTemplate {
    id: number
    name: string
    content: string
    createdAt: string
}

export interface UtmChatPreset {
    id: number
    name: string
    chatUrls: string[]
    createdAt: string
}

export interface UtmLink {
    id: number
    code: string
    promptTemplateName: string
    chatPresetName: string
    visits: number
    createdAt: string
}

export interface UtmResolveData {
    promptContent: string
    chatUrls: string[]
}

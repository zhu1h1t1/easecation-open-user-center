export const AI_CENTER_CONFIG_KEYS = {
    SystemRiskControl: 'system_risk_control',
    TicketAutoEntrust: 'ticket_auto_entrust',
    ChannelLimit: 'channel_limit',
} as const;

export type AiCenterConfigKey =
    | (typeof AI_CENTER_CONFIG_KEYS)[keyof typeof AI_CENTER_CONFIG_KEYS]
    | string;

export type AiCenterConfig = {
    key: AiCenterConfigKey;
    name: string;
    description?: string | null;
    prompt: string;
    enabled: boolean;
    config?: Record<string, any> | null;
    updatedAt?: string;
    updatedBy?: string;
};

export type AiCenterConfigUpdate = {
    prompt?: string;
    enabled?: boolean;
    config?: Record<string, any> | null;
};

export type AiSystemRiskControlResult = {
    shouldReject: boolean;
    reason?: string;
    reply?: string;
};

export type AiCenterEntrustRule = {
    id: string;
    name: string;
    enabled: boolean;
    matchScope: 'title' | 'content' | 'all';
    matchMode: 'contains' | 'regex' | 'ai';
    keywords: string[];
    ticketTypes: string[];
    targetUserId: string;
    priority: number;
    aiPrompt?: string;
};

export type AiCenterAutoEntrustConfig = {
    rules: AiCenterEntrustRule[];
    temperature?: number;
    maxTokens?: number;
    model?: string;
};

export type AiCenterChannelLimitRule = {
    id: string;
    name: string;
    enabled: boolean;
    ticketTypes: string[];
    dailyLimit?: number | null;
    weeklyLimit?: number | null;
    activeLimit?: number | null;
    cooldownHours?: number | null;
};

export type AiCenterChannelLimitConfig = {
    rules: AiCenterChannelLimitRule[];
};

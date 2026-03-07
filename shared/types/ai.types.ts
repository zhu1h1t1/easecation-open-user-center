export interface AIStreamChunk {
    type?: 'thinking_step' | 'final_answer' | 'incremental_text';
    reply?: string;
    error?: string;
    step?: ThinkingStep;
}

// 思维步骤
export interface ThinkingStep {
    name: string;
    status: 'executing' | 'success' | 'completed' | 'failed';
    nodeType: string;
    execTime: string;
    content: string;
    usages: ModelUsage[];
}

// 模型使用情况
export interface ModelUsage {
    input_tokens: number;
    output_tokens: number;
    model_id: string;
    modelResponseId?: string;
}

export interface AIStreamOptions {
    tid: number;
    prompt?: string;
    onMessage?: (message: AIStreamChunk) => void;
    onChunk?: (chunk: string) => void; // 保留向后兼容
    onComplete?: (fullText?: string) => void;
    onError?: (error: Error) => void;
}

export interface AIStreamState {
    isLoading: boolean;
    content: string;
    error: string | null;
    isCompleted: boolean;
    thinkingSteps: ThinkingStep[];
    finalAnswer: string;
}

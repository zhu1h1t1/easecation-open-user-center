/**
 * 系统消息类型管理
 *
 * 用途：统一管理所有系统消息的类型、显示名称和样式配置
 * 重构范围：
 * - 后端：ticket.service.ts 的 parseDisplayTitle 函数
 * - 前端：TicketDetailComponent.tsx 的硬编码样式判断
 *
 * @author ECUC Team
 * @date 2026-01-22
 */

/**
 * 系统消息操作者类型枚举
 * 对应数据库 ticket_detail.operator 字段的值
 */
export enum SystemOperatorType {
    /** 系统自动操作 */
    SYSTEM = 'SYSTEM',

    /** 自动客服回复 */
    AUTO_SOLVE = 'AUTO_SOLVE',

    /** 自动客服（旧值，兼容历史数据）
     * @deprecated 请使用 AUTO_SOLVE，此值仅用于向后兼容
     */
    AUTO_SOLVER = 'AUTO_SOLVER',

    /** AI 自动驳回 */
    AI_REJECT = 'AI_REJECT',

    /** AI 生成的回复草稿 */
    AI_REPLY = 'AI_REPLY',

    /** AI 建议的操作指令 */
    AI_ACTION_REQUEST = 'AI_ACTION_REQUEST',

    /** AI 工单总结 */
    AI_SUMMARY = 'AI_SUMMARY',

    /** AI 反馈匹配 */
    AI_MATCH = 'AI_MATCH',

    /** B站视频信息解析 */
    VIDEO_INFO = 'VIDEO_INFO',
}

/**
 * 系统消息显示类型（用于前端样式判断）
 */
export enum SystemMessageDisplayType {
    /** AI 系统提示（蓝色高亮警告框） */
    AI_ALERT = 'ai-alert',

    /** AI 折叠面板（可展开/折叠的内容） */
    AI_COLLAPSIBLE = 'ai-collapsible',

    /** 普通显示（无特殊样式） */
    NORMAL = 'normal',
}

/**
 * Operator 到 DisplayTitle 的映射
 *
 * 用途：后端生成 display_title 时使用
 * 位置：backend/src/services/ticket.service.ts - parseDisplayTitle()
 */
export const OPERATOR_DISPLAY_MAP: Record<string, string> = {
    [SystemOperatorType.SYSTEM]: '系统',
    [SystemOperatorType.AUTO_SOLVE]: '自动客服',
    [SystemOperatorType.AUTO_SOLVER]: '自动客服', // 兼容旧值
    [SystemOperatorType.AI_REJECT]: 'AI系统提示',
    [SystemOperatorType.AI_REPLY]: 'AI回复草稿',
    [SystemOperatorType.AI_ACTION_REQUEST]: 'AI操作建议',
    [SystemOperatorType.AI_SUMMARY]: 'AI总结',
    [SystemOperatorType.AI_MATCH]: 'AI反馈匹配',
    [SystemOperatorType.VIDEO_INFO]: '视频解析',
};

/**
 * 旧的 DisplayTitle（兼容历史数据）
 *
 * 说明：数据库中可能存在旧的 display_title 值，需要映射到新的显示样式
 */
export const LEGACY_DISPLAY_TITLES = {
    /** 旧的"系统风险控制"，现已改名为"AI系统提示"（遗留兼容） */
    AI_SYSTEM_ALERT_LEGACY: '系统风险控制',
} as const;

/**
 * 消息样式配置接口
 */
export interface MessageStyleConfig {
    /** 显示类型 */
    type: SystemMessageDisplayType;

    /** 颜色配置 */
    color: {
        /** 边框颜色 */
        border: string;
        /** 背景颜色 */
        background: string;
        /** 图标颜色 */
        icon: string;
    };

    /** 图标类型 */
    icon: 'alert' | 'info' | null;

    /** 是否默认展开（仅对折叠面板有效） */
    defaultExpanded?: boolean;

    /** 支持的操作按钮 */
    actions?: Array<'apply' | 'execute'>;
}

/**
 * DisplayTitle 到样式配置的映射
 *
 * 用途：前端根据 display_title 渲染不同样式
 * 位置：frontend-admin/user 的 TicketDetailComponent.tsx
 */
export const MESSAGE_STYLE_CONFIG: Record<string, MessageStyleConfig> = {
    // AI 系统提示 - 蓝色高亮警告框
    AI系统提示: {
        type: SystemMessageDisplayType.AI_ALERT,
        color: {
            border: 'rgba(24, 144, 255, 0.45)',
            background: 'rgba(24, 144, 255, 0.08)',
            icon: '#1890ff',
        },
        icon: 'alert',
    },

    // AI 回复草稿 - 折叠面板 + 应用按钮
    AI回复草稿: {
        type: SystemMessageDisplayType.AI_COLLAPSIBLE,
        color: {
            border: '',
            background: '',
            icon: '',
        },
        icon: null,
        defaultExpanded: true,
        actions: ['apply'],
    },

    // AI 操作建议 - 折叠面板 + 执行按钮
    AI操作建议: {
        type: SystemMessageDisplayType.AI_COLLAPSIBLE,
        color: {
            border: '',
            background: '',
            icon: '',
        },
        icon: null,
        defaultExpanded: true,
        actions: ['execute'],
    },

    // AI 总结 - 默认折叠的折叠面板
    AI总结: {
        type: SystemMessageDisplayType.AI_COLLAPSIBLE,
        color: {
            border: '',
            background: '',
            icon: '',
        },
        icon: null,
        defaultExpanded: false,
    },
};

/**
 * 获取消息样式配置（兼容旧数据）
 *
 * @param displayTitle - 消息的 display_title 字段值
 * @returns 样式配置对象，如果无特殊样式则返回 null
 *
 * @example
 * ```ts
 * const config = getMessageStyleConfig('AI系统提示');
 * if (config?.type === SystemMessageDisplayType.AI_ALERT) {
 *   // 渲染蓝色高亮框
 * }
 * ```
 */
export function getMessageStyleConfig(displayTitle: string): MessageStyleConfig | null {
    // 兼容旧的"系统风险控制"，映射到"AI系统提示"的样式
    if (displayTitle === LEGACY_DISPLAY_TITLES.AI_SYSTEM_ALERT_LEGACY) {
        return MESSAGE_STYLE_CONFIG['AI系统提示'];
    }

    // 精确匹配配置表
    if (MESSAGE_STYLE_CONFIG[displayTitle]) {
        return MESSAGE_STYLE_CONFIG[displayTitle];
    }

    // AI 开头的默认为折叠面板（兜底逻辑）
    if (displayTitle.startsWith('AI')) {
        // 开发环境警告：可能是未配置的新 AI 类型
        if (process.env.NODE_ENV !== 'production') {
            console.warn(
                `[SystemMessage] 未在 MESSAGE_STYLE_CONFIG 中找到配置: "${displayTitle}"，使用默认折叠面板样式。` +
                    `如果这是新的 AI 消息类型，请在 shared/constants/system-message.constants.ts 中添加配置。`
            );
        }
        return {
            type: SystemMessageDisplayType.AI_COLLAPSIBLE,
            color: { border: '', background: '', icon: '' },
            icon: null,
            defaultExpanded: false,
        };
    }

    // 无特殊样式
    return null;
}

/**
 * 检查是否为系统消息（非用户和非员工消息）
 *
 * @param operator - 操作者标识
 * @returns 是否为系统消息
 *
 * @example
 * ```ts
 * isSystemOperator('SYSTEM') // true
 * isSystemOperator('AI_REJECT') // true
 * isSystemOperator('AUTH_UID_123') // false
 * ```
 */
export function isSystemOperator(operator: string): boolean {
    return operator in OPERATOR_DISPLAY_MAP;
}

/**
 * 检查 operator 是否为 AI 类型
 *
 * @param operator - 操作者标识
 * @returns 是否为 AI 类型
 */
export function isAIOperator(operator: string): boolean {
    return operator.startsWith('AI');
}

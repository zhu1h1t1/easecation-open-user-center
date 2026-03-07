/**
 * 系统消息显示组件
 *
 * 统一处理所有系统消息（AI、自动客服等）的样式和交互
 * 支持多种显示类型：AI 警告框、折叠面板、普通显示
 *
 * 用途：替代 TicketDetailComponent 中硬编码的样式判断逻辑
 * 特点：
 * - 兼容旧数据（"系统风险控制"）
 * - 自动识别消息类型并应用相应样式
 * - 支持 AI 回复草稿应用和 AI 操作建议执行
 *
 * @author ECUC Team
 * @date 2026-01-22
 */

import React from 'react';
import { Flex, Typography, Collapse, Button, Space } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import { gLang } from '../../language';
import {
    getMessageStyleConfig,
    SystemMessageDisplayType,
} from '@ecuc/shared/constants/system-message.constants';
import { TicketDetail, TicketAction } from '@ecuc/shared/types/ticket.types';

const { Text, Paragraph } = Typography;

export interface SystemMessageDisplayProps {
    /** 工单详情 */
    detail: TicketDetail;
    /** 应用 AI 回复草稿的回调 */
    onApplyAIDraft?: (content: string) => void;
    /** 执行 AI 操作建议的回调 */
    onExecuteAIAction?: (actionJson: string) => void;
    /** 格式化回复内容的函数 */
    formatReplyContent: (content: string) => React.ReactNode;
    /** 获取工单详情文本颜色的函数（返回值可能为 undefined） */
    ltransTicketDetailTextColor: (action: string) => string | undefined;
}

/**
 * 系统消息显示组件
 *
 * @example
 * ```tsx
 * <SystemMessageDisplay
 *   detail={detail}
 *   onApplyAIDraft={handleApplyDraft}
 *   onExecuteAIAction={handleExecuteAction}
 *   formatReplyContent={formatReplyContent}
 *   ltransTicketDetailTextColor={getTextColor}
 * />
 * ```
 */
export const SystemMessageDisplay: React.FC<SystemMessageDisplayProps> = ({
    detail,
    onApplyAIDraft,
    onExecuteAIAction,
    formatReplyContent,
    ltransTicketDetailTextColor,
}) => {
    if (!detail.displayTitle) {
        return null;
    }

    const styleConfig = getMessageStyleConfig(detail.displayTitle);

    // 没有特殊样式配置，返回 null（使用默认渲染）
    if (!styleConfig) {
        return null;
    }

    // 内容段落
    const contentParagraph = (
        <Paragraph
            style={{
                color: ltransTicketDetailTextColor(detail.action),
                fontWeight: detail.action === TicketAction.Reply ? 'bold' : 'default',
                marginBottom: 0,
            }}
        >
            {detail.content.split('\n').map((line, index) => (
                <React.Fragment key={index}>{formatReplyContent(line)}</React.Fragment>
            ))}
        </Paragraph>
    );

    // AI 提示框样式
    if (styleConfig.type === SystemMessageDisplayType.AI_ALERT) {
        return (
            <div
                style={{
                    border: `1px solid ${styleConfig.color.border}`,
                    background: styleConfig.color.background,
                    borderRadius: 12,
                    padding: '12px 16px',
                }}
            >
                <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
                    {styleConfig.icon === 'alert' && (
                        <AlertOutlined style={{ color: styleConfig.color.icon }} />
                    )}
                    <Text style={{ fontWeight: 600 }}>
                        {/* 显示为 "AI系统提示"，兼容旧的"系统风险控制" */}
                        {detail.displayTitle === gLang('systemMessage.riskControl')
                            ? gLang('systemMessage.aiPrompt')
                            : detail.displayTitle}
                    </Text>
                </Flex>
                {contentParagraph}
            </div>
        );
    }

    // AI 折叠面板样式
    if (styleConfig.type === SystemMessageDisplayType.AI_COLLAPSIBLE) {
        return (
            <Collapse defaultActiveKey={styleConfig.defaultExpanded ? ['1'] : []}>
                <Collapse.Panel header={detail.displayTitle} key="1">
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {contentParagraph}

                        {/* AI 回复草稿的应用按钮 */}
                        {styleConfig.actions?.includes('apply') && onApplyAIDraft && (
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => onApplyAIDraft(detail.content)}
                            >
                                {gLang('systemMessage.applyToReply')}
                            </Button>
                        )}

                        {/* AI 操作建议的执行按钮 */}
                        {styleConfig.actions?.includes('execute') && onExecuteAIAction && (
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => onExecuteAIAction(detail.content)}
                            >
                                {gLang('systemMessage.executeAction')}
                            </Button>
                        )}
                    </Space>
                </Collapse.Panel>
            </Collapse>
        );
    }

    return null;
};

export default SystemMessageDisplay;

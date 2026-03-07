// 反馈列表布局组件 - 统一的列表展示样式

import React from 'react';
import { FeedbackListItemDto } from '@ecuc/shared/types/ticket.types';

export interface FeedbackListLayoutProps<T extends FeedbackListItemDto> {
    /** 列表数据 */
    items: T[];
    /** 渲染单个列表项 */
    renderItem: (item: T, index: number) => React.ReactNode;
    /** 间距大小 (px) */
    gap?: number;
    /** 动画延迟基数 */
    animationDelay?: number;
    /** 是否启用动画 */
    enableAnimation?: boolean;
}

// 淡入动画样式
const fadeInUpAnimation = `
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

// 添加动画样式到文档头部（仅添加一次）
if (typeof document !== 'undefined' && !document.getElementById('feedbackFadeInUpAnimation')) {
    const style = document.createElement('style');
    style.id = 'feedbackFadeInUpAnimation';
    style.innerHTML = fadeInUpAnimation;
    document.head.appendChild(style);
}

/**
 * 反馈列表布局组件
 *
 * 提供统一的列表布局样式和动画效果
 *
 * @example
 * ```tsx
 * <FeedbackListLayout
 *   items={filteredList}
 *   renderItem={(ticket) => (
 *     <FeedbackListItem ticket={ticket} to={`/feedback/${ticket.tid}`} />
 *   )}
 * />
 * ```
 */
export const FeedbackListLayout = <T extends FeedbackListItemDto>({
    items,
    renderItem,
    gap = 12,
    animationDelay = 0.015,
    enableAnimation = true,
}: FeedbackListLayoutProps<T>) => {
    // 动画样式生成函数
    const getAnimationStyle = (index: number): React.CSSProperties => {
        if (!enableAnimation) return {};

        return {
            opacity: 0,
            willChange: 'transform, opacity',
            animation: `fadeInUp 0.42s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(index * animationDelay, 0.2)}s forwards`,
        };
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap,
            }}
        >
            {items.map((item, index) => (
                <div key={item.tid} style={getAnimationStyle(index)}>
                    {renderItem(item, index)}
                </div>
            ))}
        </div>
    );
};

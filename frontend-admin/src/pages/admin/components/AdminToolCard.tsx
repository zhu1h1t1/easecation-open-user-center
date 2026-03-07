import React from 'react';
import { Card, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import styles from '../admin-dashboard/Admin.module.css';
import useIsPC from '@common/hooks/useIsPC';

export type AdminToolCardProps = {
    to?: string;
    onClick?: () => void;
    icon: React.ReactNode;
    text: React.ReactNode;
    disabled?: boolean;
    compact?: boolean; // PC 端紧凑模式
};

// 通用工具卡片：
// - 优先使用 to 路由跳转，其次使用 onClick
// - 统一样式：Admin.module.css 的 adminOtherCard
const AdminToolCard: React.FC<AdminToolCardProps> = ({
    to,
    onClick,
    icon,
    text,
    disabled = false,
    compact = false,
}) => {
    const isPC = useIsPC();
    const className =
        `${styles.adminOtherCard} ${compact ? styles.adminOtherCardCompact : ''}`.trim();
    const iconSize = compact ? (isPC ? 18 : 16) : isPC ? 20 : 18;
    const bodyPadding = isPC ? 16 : 10; // 移动端缩小内边距，整体高度更低

    const content = (
        <Card
            variant={'outlined'}
            hoverable
            className={className}
            style={{
                width: compact ? 'auto' : '100%',
                cursor: onClick || to ? 'pointer' : 'default',
                opacity: disabled ? 0.6 : 1,
            }}
            onClick={to ? undefined : onClick}
            styles={{ body: { padding: bodyPadding } }}
        >
            {compact ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: iconSize, lineHeight: 0, display: 'inline-flex' }}>
                        {icon}
                    </span>
                    <Typography.Text>{text}</Typography.Text>
                </div>
            ) : (
                <Space
                    direction="vertical"
                    align="center"
                    style={{ width: '100%' }}
                    size={isPC ? 'middle' : 6}
                >
                    <span
                        style={{ fontSize: iconSize, display: 'inline-flex', alignItems: 'center' }}
                    >
                        {icon}
                    </span>
                    <Typography.Text>{text}</Typography.Text>
                </Space>
            )}
        </Card>
    );

    if (to) {
        return (
            <Link
                to={to}
                style={{
                    width: compact ? 'auto' : '100%',
                    pointerEvents: disabled ? 'none' : 'auto',
                }}
            >
                {content}
            </Link>
        );
    }

    return content;
};

export default AdminToolCard;

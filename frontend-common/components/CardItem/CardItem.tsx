// 自定义卡片组件

import React from 'react';
import { Col, Space, Typography } from 'antd';
import styles from './CardItem.module.css';

const { Text } = Typography;

interface CardItemProps {
    onClick: React.MouseEventHandler<HTMLDivElement>;
    Icon: React.ComponentType<{ style?: React.CSSProperties }>;
    color: string;
    isDark: boolean;
    title: string;
    description: React.ReactNode;
    hoverColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    descColor?: string;
    isResponsive?: boolean;
    isDisabled?: boolean;
    fadeInDelay?: number;
}

const CardItem: React.FC<CardItemProps> = ({
    onClick,
    Icon,
    color,
    isDark,
    title,
    description,
    hoverColor = isDark ? '#2A2A2A' : '#F5F5F5',
    backgroundColor = isDark ? '#171717' : '#FFFFFF',
    borderColor = isDark ? '#303030' : '#E0E0E0',
    textColor = isDark ? '#EEF2F7' : '#1A1A1A',
    descColor = isDark ? '#FFFFFF99' : '#00000099',
    isResponsive = true,
    isDisabled = false,
    fadeInDelay = 0,
}) => {
    const IconComp = Icon as React.ComponentType<{ style?: React.CSSProperties }>;

    const cardContent = (
        <Space
            onClick={onClick}
            role="button"
            tabIndex={0}
            className={`${styles['dashboard-card']} ${fadeInDelay > 0 ? styles['fade-in'] : ''}`}
            style={{
                background: backgroundColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '16px',
                color: textColor,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : fadeInDelay > 0 ? 0 : 1,
                pointerEvents: isDisabled ? 'none' : 'auto',
                animationDelay: fadeInDelay > 0 ? `${fadeInDelay}s` : undefined,
            }}
            onMouseEnter={e => {
                if (isDisabled) return;
                const el = e.currentTarget;
                el.style.background = hoverColor;
                el.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                if (isDisabled) return;
                const el = e.currentTarget;
                el.style.background = backgroundColor;
                el.style.transform = 'translateY(0)';
            }}
        >
            <div className={styles['card-content']}>
                <div className={styles['icon-wrapper']} style={{ backgroundColor: `${color}22` }}>
                    <IconComp style={{ fontSize: 28, color }} />
                </div>
                <div style={{ flex: 1 }}>
                    <div className={styles['item-title']} style={{ color: textColor }}>
                        {title}
                    </div>
                    <Text className={styles['item-desc']} style={{ color: descColor }}>
                        {description}
                    </Text>
                </div>
            </div>
        </Space>
    );

    return isResponsive ? (
        <Col xs={24} sm={12}>
            {cardContent}
        </Col>
    ) : (
        cardContent
    );
};

export default CardItem;

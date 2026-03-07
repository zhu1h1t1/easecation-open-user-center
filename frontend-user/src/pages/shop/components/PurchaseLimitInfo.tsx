import React from 'react';
import { Row, Col, Space, Tag, Typography } from 'antd';
import { gLang } from '@common/language';
import {
    ShoppingCartOutlined,
    CalendarOutlined,
    UserOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import type { Product } from '@ecuc/shared/types/item.types';

const { Text } = Typography;

interface PurchaseLimitInfoProps {
    product: Product;
}

interface LimitCardData {
    key: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    available: number;
    total: number;
    isExhausted: boolean;
    tagColor: string;
    iconColor: string;
}

export default function PurchaseLimitInfo({ product }: PurchaseLimitInfoProps) {
    // 生成限购卡片数据
    const generateLimitCards = (): LimitCardData[] => {
        const cards: LimitCardData[] = [];

        // 总个人限购（global_limit）
        if (typeof product.global_limit === 'number' && product.global_limit > 0) {
            const available = product.global_limit - product.limit_sales;
            cards.push({
                key: 'global',
                icon: <UserOutlined style={{ fontSize: 16 }} />,
                title: gLang('purchaseLimit.globalTitle'),
                description: gLang('purchaseLimit.globalDesc', { count: product.global_limit }),
                available,
                total: product.global_limit,
                isExhausted: available <= 0,
                tagColor: 'processing',
                iconColor: '#1890ff', // 蓝色
            });
        }

        // 每月总限购（total_limit）
        if (typeof product.total_limit === 'number' && product.total_limit > 0) {
            const available = product.total_limit - product.sales_monthly;
            cards.push({
                key: 'total',
                icon: <GlobalOutlined style={{ fontSize: 16 }} />,
                title: gLang('purchaseLimit.totalTitle'),
                description: gLang('purchaseLimit.totalDesc', { count: product.total_limit }),
                available,
                total: product.total_limit,
                isExhausted: available <= 0,
                tagColor: 'success',
                iconColor: '#52c41a', // 绿色
            });
        }

        // 每月个人限购（monthly_limit）
        if (typeof product.monthly_limit === 'number' && product.monthly_limit > 0) {
            const available = product.monthly_limit - product.current_month_sales;
            cards.push({
                key: 'monthly',
                icon: <CalendarOutlined style={{ fontSize: 16 }} />,
                title: gLang('purchaseLimit.monthlyTitle'),
                description: gLang('purchaseLimit.monthlyDesc', { count: product.monthly_limit }),
                available,
                total: product.monthly_limit,
                isExhausted: available <= 0,
                tagColor: 'warning',
                iconColor: '#fa8c16', // 橙色
            });
        }

        // 永久总限购（permanent_limit）
        if (typeof product.permanent_limit === 'number' && product.permanent_limit > 0) {
            const available = product.permanent_limit - product.sales;
            cards.push({
                key: 'permanent',
                icon: <ShoppingCartOutlined style={{ fontSize: 16 }} />,
                title: gLang('purchaseLimit.permanentTitle'),
                description: gLang('purchaseLimit.permanentDesc', {
                    count: product.permanent_limit,
                }),
                available,
                total: product.permanent_limit,
                isExhausted: available <= 0,
                tagColor: 'default',
                iconColor: '#722ed1', // 紫色
            });
        }

        return cards;
    };

    const limitCards = generateLimitCards();

    // 如果没有任何限购信息，则不渲染
    if (limitCards.length === 0) return null;

    // 检查是否有任何一项售罄
    const hasAnyExhausted = limitCards.some(card => card.isExhausted);

    // 检查是否有任何一项处于限购状态（available > 0 但数量较少）
    const hasAnyLimited = limitCards.some(
        card => card.available > 0 && card.available <= Math.min(5, card.total * 0.2)
    );

    return (
        <div style={{ marginBottom: 8 }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {limitCards.map(card => {
                    // 判断当前卡片是否应该标红
                    const shouldHighlightRed = hasAnyExhausted || hasAnyLimited;

                    // 如果当前卡片售罄，显示售罄；否则根据整体状态决定是否标红
                    const isCurrentExhausted = card.isExhausted;
                    const shouldShowRed = shouldHighlightRed && !isCurrentExhausted;

                    return (
                        <Row
                            key={card.key}
                            align="middle"
                            gutter={8}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: 'var(--ant-color-fill-quaternary)',
                                borderRadius: 8,
                                border: '1px solid var(--ant-color-border)',
                            }}
                        >
                            <Col>
                                <span
                                    style={{
                                        color: isCurrentExhausted
                                            ? '#ff4d4f'
                                            : shouldShowRed
                                              ? '#ff4d4f'
                                              : card.iconColor,
                                    }}
                                >
                                    {card.icon}
                                </span>
                            </Col>
                            <Col flex="auto">
                                <Text
                                    strong
                                    style={{
                                        color: isCurrentExhausted
                                            ? '#ff4d4f'
                                            : shouldShowRed
                                              ? '#ff4d4f'
                                              : 'var(--ant-color-text)',
                                    }}
                                >
                                    {card.title}
                                </Text>
                                <br />
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: isCurrentExhausted
                                            ? '#ff4d4f'
                                            : shouldShowRed
                                              ? '#ff4d4f'
                                              : 'var(--ant-color-text-secondary)',
                                    }}
                                >
                                    {card.description}
                                </Text>
                            </Col>
                            <Col>
                                <Tag
                                    color={
                                        isCurrentExhausted
                                            ? 'error'
                                            : shouldShowRed
                                              ? 'error'
                                              : card.tagColor
                                    }
                                    style={{
                                        minWidth: 60,
                                        textAlign: 'center',
                                        borderRadius: 6,
                                        border: 'none',
                                    }}
                                >
                                    {isCurrentExhausted
                                        ? gLang('purchaseLimit.soldOutShort')
                                        : shouldShowRed
                                          ? gLang('purchaseLimit.remainingSuffix', {
                                                count: card.available,
                                            })
                                          : gLang('purchaseLimit.remainingSuffix', {
                                                count: card.available,
                                            })}
                                </Tag>
                            </Col>
                        </Row>
                    );
                })}
            </Space>
        </div>
    );
}

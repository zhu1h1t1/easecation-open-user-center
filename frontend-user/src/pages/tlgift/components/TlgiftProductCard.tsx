import React, { useState, useEffect } from 'react';
import { Card, Typography, theme, Button } from 'antd';
import { FireOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';
import { gLang } from '@common/language';

export interface TlgiftItem {
    id: string;
    title: string;
    price: number;
    total_limit: number;
    person_limit: number;
    user_limit: number;
    sales: number;
    json?: string;
    /** 总限购剩余（total_limit 卖完则 0），无总限购为 null */
    total_remaining?: number | null;
    /** 当前账号该商品剩余可购（user_limit 卖完则 0），无则 null */
    user_remaining?: number | null;
}

interface TlgiftProductCardProps {
    product: TlgiftItem;
    itemImage: string;
    fallbackImage?: string;
    screens: any;
    onClick: () => void;
    /** Add to cart (no balance check). When set, shows "加入购物车" button. */
    onAddToCart?: () => void;
}

const { Text } = Typography;

export default function TlgiftProductCard({
    product,
    itemImage,
    fallbackImage,
    screens,
    onClick,
    onAddToCart,
}: TlgiftProductCardProps) {
    const [imgSrc, setImgSrc] = useState(itemImage);
    useEffect(() => {
        setImgSrc(itemImage);
    }, [itemImage]);
    const displayImage = imgSrc || fallbackImage || itemImage;
    const totalSoldOut = product.total_remaining != null && product.total_remaining <= 0;
    const userSoldOut = product.user_remaining != null && product.user_remaining <= 0;
    const soldOut = totalSoldOut || userSoldOut;
    const { token } = theme.useToken();
    const { getThemeColor, customTheme, isCustomThemeActive } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;
    const isBlackOrangeActive = isCustomThemeActive && customTheme === 'blackOrange';
    const [isHover, setIsHover] = useState(false);

    const cardBackground = getThemeColor({
        light: token.colorBgContainer,
        dark: token.colorBgContainer,
        custom: { blackOrange: palette.surface },
    });
    const cardBorder = getThemeColor({
        light: token.colorBorderSecondary,
        dark: '#303030',
        custom: { blackOrange: palette.border },
    });
    const cardHoverBorder = isBlackOrangeActive ? palette.accent : token.colorPrimaryBorderHover;
    const cardShadow = isBlackOrangeActive
        ? '0 16px 42px rgba(255, 140, 26, 0.16)'
        : token.boxShadow;
    const titleColor = getThemeColor({
        light: token.colorText,
        dark: token.colorText,
        custom: { blackOrange: palette.textPrimary },
    });
    const priceColor = getThemeColor({
        light: token.colorSuccessText,
        dark: token.colorSuccessText,
        custom: { blackOrange: palette.accent },
    });
    const salesColor = getThemeColor({
        light: token.colorTextTertiary,
        dark: 'rgba(255, 255, 255, 0.6)',
        custom: { blackOrange: palette.textSecondary },
    });
    const salesIconColor = getThemeColor({
        light: token.colorTextQuaternary,
        dark: 'rgba(255, 255, 255, 0.45)',
        custom: { blackOrange: palette.accent },
    });
    const imageBackground = getThemeColor({
        light: token.colorFillTertiary,
        dark: token.colorFillTertiary,
        custom: { blackOrange: palette.surfaceAlt },
    });

    return (
        <Card
            hoverable={!soldOut}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            onClick={() => !soldOut && onClick()}
            styles={{
                body: {
                    padding: screens.xs ? 8 : 12,
                    paddingBottom: screens.xs ? 26 : 24,
                    minHeight: screens.xs ? 100 : 90,
                    display: 'flex',
                    flexDirection: screens.xs ? 'column' : 'row',
                    gap: screens.xs ? 6 : 8,
                    cursor: soldOut ? 'not-allowed' : 'pointer',
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: cardBackground,
                },
            }}
            style={{
                transition: 'all 0.2s ease',
                position: 'relative',
                border: `1px solid ${cardBorder}`,
                borderColor: isHover && !soldOut ? cardHoverBorder : cardBorder,
                borderRadius: 8,
                minWidth: screens.xs ? '260px' : 'auto',
                width: screens.xs ? '100%' : 'auto',
                boxShadow: isHover && !soldOut ? cardShadow : undefined,
                transform: isHover && !soldOut ? 'translateY(-1px)' : undefined,
                willChange: 'transform, box-shadow, border-color',
                zIndex: isHover ? 1 : 0,
                background: cardBackground,
                opacity: soldOut ? 0.65 : 1,
                filter: soldOut ? 'grayscale(0.8)' : 'none',
            }}
        >
            {soldOut && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.35)',
                        borderRadius: 8,
                    }}
                >
                    <Text strong style={{ color: '#fff', fontSize: 16 }}>
                        {gLang('tlgift.soldOut')}
                    </Text>
                </div>
            )}
            <div
                style={{
                    position: 'absolute',
                    top: screens.xs ? 6 : 6,
                    right: screens.xs ? 6 : 6,
                    zIndex: 10,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                <Text
                    style={{
                        color: priceColor,
                        fontWeight: 600,
                        fontSize: screens.xs ? 12 : 14,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {Number(product.price || 0)} {gLang('tlgift.primogemsUnit')}
                </Text>
            </div>
            {screens.xs ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <img
                        src={displayImage}
                        alt={product.title}
                        onError={() => setImgSrc(fallbackImage || '')}
                        style={{
                            width: 56,
                            height: 56,
                            objectFit: 'contain',
                            borderRadius: 6,
                            flexShrink: 0,
                            background: imageBackground,
                        }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                            style={{
                                margin: 0,
                                fontSize: 13,
                                lineHeight: '1.3',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: 600,
                                color: titleColor,
                            }}
                        >
                            {product.title}
                        </h4>
                    </div>
                </div>
            ) : (
                <>
                    <img
                        src={displayImage}
                        alt={product.title}
                        onError={() => setImgSrc(fallbackImage || '')}
                        style={{
                            width: 60,
                            height: 60,
                            objectFit: 'contain',
                            borderRadius: 6,
                            marginRight: 12,
                            flexShrink: 0,
                            background: imageBackground,
                        }}
                    />
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <h4
                            style={{
                                margin: 0,
                                fontSize: 15,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: '1.3',
                                color: titleColor,
                            }}
                        >
                            {product.title}
                        </h4>
                    </div>
                </>
            )}
            <div
                style={{
                    position: 'absolute',
                    right: 8,
                    bottom: screens.xs ? 8 : 6,
                    color: salesColor,
                    fontSize: 12,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                }}
            >
                <FireOutlined style={{ fontSize: 12, color: salesIconColor }} />
                <span>{gLang('tlgift.soldCount', { count: String(product.sales) })}</span>
            </div>
            {onAddToCart && (
                <div
                    style={{
                        position: 'absolute',
                        left: 8,
                        bottom: screens.xs ? 8 : 6,
                        zIndex: 10,
                    }}
                    onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                    }}
                >
                    <Button
                        type="primary"
                        size="small"
                        icon={<ShoppingCartOutlined />}
                        onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                            onAddToCart();
                        }}
                        style={{ borderRadius: 6 }}
                    >
                        {gLang('tlgift.addToCart')}
                    </Button>
                </div>
            )}
        </Card>
    );
}

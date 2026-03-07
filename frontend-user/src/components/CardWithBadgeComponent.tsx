import { Badge, Card, ConfigProvider, Statistic } from 'antd';
import { gLang } from '@common/language';
import React, { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

interface Props {
    title: string;
    subTitle: string | React.ReactNode;
    to: string;
    loading: boolean;
    badgeText: string;
    badgeColor: string;
    isHoverable: boolean;
    bordered?: boolean;
    onClick?: () => void | null;
    style?: CSSProperties;
}

const CardWithBadgeComponent = ({
    title,
    subTitle = '',
    to = '/',
    loading = false,
    badgeText = '',
    badgeColor = '',
    isHoverable = false,
    bordered = true,
    onClick,
    style,
}: Props) => {
    const { getThemeColor, customTheme, isCustomThemeActive } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;
    const isBlackOrangeActive = isCustomThemeActive && customTheme === 'blackOrange';

    const cardBackground = getThemeColor({
        light: '#ffffff',
        dark: '#141414',
        custom: { blackOrange: palette.surface },
    });
    const cardBorder = getThemeColor({
        light: '#f0f0f0',
        dark: '#303030',
        custom: { blackOrange: palette.border },
    });
    const statisticTitleColor = getThemeColor({
        light: '#8c8c8c',
        dark: '#bfbfbf',
        custom: { blackOrange: palette.textSecondary },
    });
    const statisticValueColor = getThemeColor({
        light: '#1f1f1f',
        dark: '#f5f5f5',
        custom: { blackOrange: palette.textPrimary },
    });
    const hoverOutlineColor = getThemeColor({
        light: '#91caff',
        dark: '#3a9bf4',
        custom: { blackOrange: palette.accent },
    });
    const cardShadow = isBlackOrangeActive
        ? '0 8px 24px rgba(0,0,0,0.45)'
        : '0 4px 12px rgba(0,0,0,0.08)';

    return (
        <>
            <style>
                {`
                .card-hover-outline {
                    position: relative;
                    border-radius: 8px;
                }
                .card-hover-outline::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 8px;
                    pointer-events: none;
                    transition: box-shadow 0.3s ease;
                    z-index: 1;
                }
                .card-hover-outline:hover::before {
                    box-shadow: 0 0 0 2px ${hoverOutlineColor};
                }
                .card-hover-outline .ant-card {
                    border-radius: 8px;
                }
                `}
            </style>
            <ConfigProvider
                theme={{
                    token: {
                        paddingLG: 16,
                        colorBgContainer: cardBackground,
                        colorBorder: cardBorder,
                    },
                }}
            >
                <div
                    style={{ width: '100%' }}
                    className={isHoverable ? 'card-hover-outline' : undefined}
                >
                    {!onClick ? (
                        <Link to={to}>
                            {badgeText ? (
                                <Badge.Ribbon text={gLang(badgeText)} color={badgeColor}>
                                    <Card
                                        size="default"
                                        style={{
                                            maxWidth: '100%',
                                            marginBottom: 8,
                                            background: cardBackground,
                                            borderColor: cardBorder,
                                            boxShadow: isHoverable ? cardShadow : undefined,
                                            ...style,
                                        }}
                                        hoverable={isHoverable}
                                        loading={loading}
                                        variant={bordered ? 'outlined' : 'borderless'}
                                    >
                                        <Statistic
                                            title={
                                                <span style={{ color: statisticTitleColor }}>
                                                    {subTitle}
                                                </span>
                                            }
                                            value={title}
                                            valueStyle={{
                                                color: statisticValueColor,
                                                fontSize: 16,
                                            }}
                                        />
                                    </Card>
                                </Badge.Ribbon>
                            ) : (
                                <Card
                                    size="default"
                                    style={{
                                        maxWidth: '100%',
                                        marginBottom: 8,
                                        background: cardBackground,
                                        borderColor: cardBorder,
                                        boxShadow: isHoverable ? cardShadow : undefined,
                                        ...style,
                                    }}
                                    hoverable={isHoverable}
                                    loading={loading}
                                    variant={bordered ? 'outlined' : 'borderless'}
                                >
                                    <Statistic
                                        title={
                                            <span style={{ color: statisticTitleColor }}>
                                                {subTitle}
                                            </span>
                                        }
                                        value={title}
                                        valueStyle={{ color: statisticValueColor, fontSize: 16 }}
                                    />
                                </Card>
                            )}
                        </Link>
                    ) : (
                        <Badge.Ribbon text={gLang(badgeText)} color={badgeColor}>
                            <Card
                                size="default"
                                style={{
                                    maxWidth: '100%',
                                    marginBottom: 8,
                                    background: cardBackground,
                                    borderColor: cardBorder,
                                    boxShadow: isHoverable ? cardShadow : undefined,
                                    ...style,
                                }}
                                hoverable={isHoverable}
                                loading={loading}
                                variant={bordered ? 'outlined' : 'borderless'}
                                onClick={onClick}
                            >
                                <Statistic
                                    title={
                                        <span style={{ color: statisticTitleColor }}>
                                            {subTitle}
                                        </span>
                                    }
                                    value={title}
                                    valueStyle={{ color: statisticValueColor, fontSize: 16 }}
                                />
                            </Card>
                        </Badge.Ribbon>
                    )}
                </div>
            </ConfigProvider>
        </>
    );
};

export default CardWithBadgeComponent;

import React from 'react';
import { Card, Statistic, Button } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';
import { gLang } from '@common/language';

interface TlgiftBalanceCardProps {
    primogems: number;
    screens: any;
    onViewLogs?: () => void;
}

export default function TlgiftBalanceCard({
    primogems,
    screens,
    onViewLogs,
}: TlgiftBalanceCardProps) {
    const { getThemeColor, customTheme, isCustomThemeActive } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;
    const isBlackOrangeActive = isCustomThemeActive && customTheme === 'blackOrange';

    const cardBackground = getThemeColor({
        light: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        dark: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
        custom: {
            blackOrange: `linear-gradient(135deg, ${palette.surfaceAlt} 0%, ${palette.surface} 65%, ${palette.accent} 100%)`,
        },
    });
    const primaryText = getThemeColor({
        light: '#ffffff',
        dark: '#ffffff',
        custom: { blackOrange: palette.textPrimary },
    });
    const secondaryText = getThemeColor({
        light: 'rgba(255, 255, 255, 0.8)',
        dark: 'rgba(255, 255, 255, 0.8)',
        custom: { blackOrange: palette.textSecondary },
    });
    const subtitleColor = getThemeColor({
        light: 'rgba(255, 255, 255, 0.85)',
        dark: 'rgba(255, 255, 255, 0.85)',
        custom: { blackOrange: palette.textSecondary },
    });

    return (
        <Card
            style={{
                background: cardBackground,
                border: 'none',
                borderRadius: 12,
                color: primaryText,
            }}
            styles={{
                body: {
                    padding: screens.xs ? 16 : 24,
                    color: primaryText,
                },
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: screens.xs ? 'column' : 'row',
                    alignItems: screens.xs ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                }}
            >
                <div style={{ flex: 1 }}>
                    <Statistic
                        title={
                            <span style={{ color: secondaryText, fontSize: 16 }}>
                                {gLang('tlgift.balanceTitle')}
                            </span>
                        }
                        value={primogems}
                        precision={0}
                        valueStyle={{
                            color: primaryText,
                            fontSize: screens.xs ? 28 : 36,
                            fontWeight: 'bold',
                        }}
                    />
                </div>
                {onViewLogs && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            type="primary"
                            ghost={!isBlackOrangeActive}
                            icon={<HistoryOutlined />}
                            onClick={onViewLogs}
                            shape="round"
                            style={{
                                borderColor: isBlackOrangeActive
                                    ? palette.accent
                                    : 'rgba(255, 255, 255, 0.65)',
                                color: isBlackOrangeActive ? palette.textPrimary : primaryText,
                                background: isBlackOrangeActive ? palette.accent : 'transparent',
                                boxShadow: isBlackOrangeActive
                                    ? '0 0 0 1px rgba(255, 140, 26, 0.35)'
                                    : undefined,
                            }}
                        >
                            {gLang('tlgift.myLogs')}
                        </Button>
                    </div>
                )}
            </div>
            <div style={{ marginTop: 8 }}>
                <span style={{ color: subtitleColor, fontSize: 12.8, fontWeight: 500 }}>
                    {gLang('tlgift.balanceSubtitle')}
                </span>
            </div>
        </Card>
    );
}

import React, { useEffect, useMemo } from 'react';
import { App, ConfigProvider, message, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import type { ReactNode } from 'react';
import { setGlobalMessageApi } from '../utils/messageApiHolder';
import { useTheme } from './ThemeContext';
import { greyDark } from '@ant-design/colors';
import { getCustomThemePalette } from '../themes/customPalettes';

interface Props {
    children: ReactNode;
}

// 提供全局 messageApi，并渲染 contextHolder 以启用动态主题能力
const MessageProvider: React.FC<Props> = ({ children }) => {
    const { isDark, customTheme, isCustomThemeActive } = useTheme();
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        setGlobalMessageApi(messageApi);
    }, [messageApi]);

    const themeConfig = useMemo(() => {
        const palette = getCustomThemePalette(isCustomThemeActive ? customTheme : null);
        const isCustomPaletteActive = Boolean(palette && isCustomThemeActive);
        const accent = palette?.accent ?? '';
        const accentHover = palette ? '#ffa64d' : undefined;
        const accentActive = palette ? '#cc6d00' : undefined;

        const baseConfig = {
            algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
            components: {
                Layout: {
                    headerPadding: '0 17px',
                    headerBg: isDark ? greyDark[0] : '#ffffff',
                },
            },
        } as const;

        if (!isCustomPaletteActive || !palette) {
            return baseConfig;
        }

        return {
            ...baseConfig,
            token: {
                colorPrimary: accent,
                colorPrimaryBg: accent,
                colorPrimaryHover: accentHover,
                colorPrimaryActive: accentActive,
                colorPrimaryBorder: accent,
                colorLink: accent,
                colorLinkHover: accentHover,
                colorLinkActive: accentActive,
                colorPrimaryText: palette.textPrimary,
            },
            components: {
                ...baseConfig.components,
                Button: {
                    colorPrimary: accent,
                    colorPrimaryHover: accentHover,
                    colorPrimaryActive: accentActive,
                    defaultBg: palette.surface,
                    defaultColor: palette.textPrimary,
                    defaultBorderColor: palette.border,
                    primaryShadow: 'none',
                },
            },
        };
    }, [customTheme, isCustomThemeActive, isDark]);

    return (
        <ConfigProvider theme={themeConfig} locale={zhCN}>
            <App>
                {contextHolder}
                {children}
            </App>
        </ConfigProvider>
    );
};

export default MessageProvider;

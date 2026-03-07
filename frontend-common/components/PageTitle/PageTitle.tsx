// 页面标题组件

import React from 'react';
import { Typography } from 'antd';
import styles from './PageTitle.module.css';
import { useTheme, type CustomThemeName } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

const { Title } = Typography;

interface PageTitleProps {
    title: string;
    level?: 1 | 2 | 3 | 4 | 5;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, level = 1 }) => {
    const { customTheme, getThemeColor } = useTheme();
    type PaletteKey = keyof (typeof CUSTOM_THEME_PALETTES)[CustomThemeName];
    const getCustomColor = (key: PaletteKey) => {
        if (!customTheme) {
            return undefined;
        }
        return {
            [customTheme]: CUSTOM_THEME_PALETTES[customTheme][key],
        } as Partial<Record<CustomThemeName, string>>;
    };
    const themedTitleColor = getThemeColor({
        light: 'inherit',
        dark: 'inherit',
        custom: getCustomColor('accent'),
    });

    return (
        <div className={styles['page-title-wrap']}>
            <Title
                level={level}
                className={styles['page-title-font']}
                style={customTheme ? { color: themedTitleColor } : undefined}
            >
                {title}
            </Title>
        </div>
    );
};

export default PageTitle;

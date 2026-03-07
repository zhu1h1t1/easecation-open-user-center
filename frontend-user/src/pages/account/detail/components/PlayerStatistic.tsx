// 玩家名与ECID组件

import React from 'react';
import { ConfigProvider, Statistic } from 'antd';
import { BindPlayerDetailBasic } from '@ecuc/shared/types/player.types';
import { gLang } from '@common/language';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

interface PlayerStatisticProps {
    player?: BindPlayerDetailBasic;
}

const PlayerStatistic: React.FC<PlayerStatisticProps> = ({ player }) => {
    const { getThemeColor } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;

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
    const warningColor = getThemeColor({
        light: '#EC5B56',
        dark: '#ff7875',
        custom: { blackOrange: palette.accent },
    });

    return (
        <ConfigProvider
            theme={{
                token: {
                    paddingLG: 16,
                },
            }}
        >
            <Statistic
                loading={!player}
                title={
                    <span style={{ color: statisticTitleColor }}>
                        {player?.ecid + ' [LV.' + player?.level + ']'}
                    </span>
                }
                value={player?.name}
                style={{
                    marginTop: '-20px',
                }}
                valueStyle={{ color: statisticValueColor, fontSize: 20 }}
            />
            {player?.is_frozen && (
                <p style={{ color: warningColor, marginTop: '0.5em' }}>
                    {gLang('ecDetail.frozen1')}
                    <br />
                    {gLang('ecDetail.frozen2')}
                </p>
            )}
        </ConfigProvider>
    );
};

export default PlayerStatistic;

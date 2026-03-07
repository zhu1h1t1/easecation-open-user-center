// 玩家详细信息组件

import React from 'react';
import { ConfigProvider, Descriptions, DescriptionsProps } from 'antd';
import { BindPlayerDetailBasic } from '@ecuc/shared/types/player.types';
import { gLang } from '@common/language';
import { ltransAdmin, ltransMedia, ltransVip } from '@common/languageTrans';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';
import { TimeConverter, convertUTCToFormat } from '@common/components/TimeConverter';

interface PlayerDetailsProps {
    player?: BindPlayerDetailBasic;
}

const PlayerDetails: React.FC<PlayerDetailsProps> = ({ player }) => {
    const { getThemeColor } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;

    const labelColor = getThemeColor({
        light: '#595959',
        dark: '#bfbfbf',
        custom: { blackOrange: palette.textSecondary },
    });
    const contentColor = getThemeColor({
        light: '#1f1f1f',
        dark: '#f5f5f5',
        custom: { blackOrange: palette.textPrimary },
    });
    const containerBackground = getThemeColor({
        light: '#ffffff',
        dark: '#141414',
        custom: { blackOrange: palette.surface },
    });
    const containerBorder = getThemeColor({
        light: '#f0f0f0',
        dark: '#303030',
        custom: { blackOrange: palette.border },
    });

    const items: DescriptionsProps['items'] = [
        {
            label: gLang('ecDetail.email'),
            children: player?.email || '-',
        },
        {
            label: gLang('ecDetail.token'),
            children: player?.credits,
        },
        {
            label: gLang('ecDetail.diamond'),
            children: player?.diamonds,
        },
        {
            label: gLang('ecDetail.coin'),
            children: player?.coin,
        },
        {
            label: gLang('ecDetail.playerPrivilege'),
            children:
                (player ? ltransVip(player.vip?.level) : '...') +
                ' (' +
                (player?.vip?.expiry === '' ||
                player?.vip?.expiry === gLang('playerDetails.permanent')
                    ? gLang('playerDetails.permanent')
                    : player?.vip?.expiry
                      ? convertUTCToFormat(player.vip.expiry, 'YYYY-MM-DD')
                      : '-') +
                ')',
        },
        {
            label: gLang('ecDetail.mediaPrivilege'),
            children:
                (player ? ltransMedia(player.media?.level) : '...') +
                ' (' +
                (player &&
                    (player.media?.expiry === '' ||
                    player.media?.expiry === gLang('playerDetails.permanent')
                        ? gLang('playerDetails.permanent')
                        : player.media?.expiry
                          ? convertUTCToFormat(player.media.expiry, 'YYYY-MM-DD')
                          : '-')) +
                ')',
        },
        {
            label: gLang('ecDetail.specialPrivilege'),
            children:
                (player ? ltransAdmin(player.admin?.level) : '...') +
                ' (' +
                (player &&
                    (player.admin?.expiry === '' ||
                    player.admin?.expiry === gLang('playerDetails.permanent')
                        ? gLang('playerDetails.permanent')
                        : player.admin?.expiry
                          ? convertUTCToFormat(player.admin.expiry, 'YYYY-MM-DD')
                          : '-')) +
                ')',
        },
        {
            label: gLang('ecDetail.latestOnlineTime'),
            children: player?.last_login ? <TimeConverter utcTime={player.last_login} /> : '-',
        },
        {
            label: gLang('ecDetail.nextLevelExp'),
            children: player && player.next_level?.current + ' / ' + player.next_level?.need,
        },
    ];

    const themedItems = items.map(item => ({
        ...item,
        labelStyle: { color: labelColor },
        contentStyle: { color: contentColor },
    }));

    return (
        <ConfigProvider
            theme={{
                token: {
                    paddingLG: 16,
                },
            }}
        >
            <Descriptions
                items={themedItems}
                style={{
                    marginTop: '-10px',
                    background: containerBackground,
                    borderRadius: 12,
                    padding: 16,
                    border: `1px solid ${containerBorder}`,
                }}
            />
        </ConfigProvider>
    );
};

export default PlayerDetails;

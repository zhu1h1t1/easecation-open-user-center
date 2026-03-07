// 媒体信息

import React from 'react';
import { ConfigProvider, Descriptions, DescriptionsProps } from 'antd';
import { gLang } from '@common/language';
import { ltransMediaStatus } from '@common/languageTrans';
import dayjs from 'dayjs';
import { MediaListData, MediaStatus } from '@ecuc/shared/types/media.types';
import { useTheme, type CustomThemeName } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

interface MediaInfoProps {
    mediaData?: MediaListData;
}

const MediaInfo: React.FC<MediaInfoProps> = ({ mediaData }) => {
    const { getThemeColor, customTheme } = useTheme();
    type PaletteKey = keyof (typeof CUSTOM_THEME_PALETTES)[CustomThemeName];
    const getCustomColor = (key: PaletteKey) => {
        if (!customTheme) {
            return undefined;
        }
        return {
            [customTheme]: CUSTOM_THEME_PALETTES[customTheme][key],
        } as Partial<Record<CustomThemeName, string>>;
    };
    const descriptionBackground = getThemeColor({
        light: '#FFFFFF',
        dark: '#1a1a1a',
        custom: getCustomColor('surface'),
    });
    const descriptionBorder = getThemeColor({
        light: '#f0f0f0',
        dark: '#303030',
        custom: getCustomColor('border'),
    });
    const labelBackground = getThemeColor({
        light: '#fafafa',
        dark: '#1f1f1f',
        custom: getCustomColor('surfaceAlt'),
    });
    const labelColor = getThemeColor({
        light: 'rgba(0, 0, 0, 0.65)',
        dark: 'rgba(255, 255, 255, 0.65)',
        custom: getCustomColor('textSecondary'),
    });
    const contentColor = getThemeColor({
        light: '#1A1A1A',
        dark: '#EEF2F7',
        custom: getCustomColor('textPrimary'),
    });
    const extraColor = getThemeColor({
        light: '#00000065',
        dark: '#FFFFFF99',
        custom: getCustomColor('textMuted'),
    });
    const linkColor = getThemeColor({
        light: '#1890ff',
        dark: '#69c0ff',
        custom: getCustomColor('accent'),
    });

    const mediaUserItems: DescriptionsProps['items'] = mediaData?.media
        ? [
              { label: gLang('mediaUser.id'), children: mediaData.media.id || 'N/A' },
              {
                  label: gLang('mediaUser.status'),
                  children: ltransMediaStatus(mediaData.media.status, true),
              },
              { label: gLang('mediaUser.mpa'), children: mediaData.media.mpa },
              { label: gLang('mediaUser.EBalance'), children: mediaData.media.EBalance },
              ...(mediaData.media.status === MediaStatus.ExcellentCreator
                  ? [
                        {
                            label: gLang('mediaUser.QQNumber'),
                            children: mediaData.media.QQNumber || gLang('unbound'),
                        },
                    ]
                  : []),
              {
                  label: gLang('mediaUser.link'),
                  children: mediaData.media.link ? (
                      <a
                          href={mediaData.media.link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: linkColor }}
                      >
                          {gLang('viewLink')}
                      </a>
                  ) : (
                      'N/A'
                  ),
              },
              { label: gLang('mediaUser.ECID'), children: mediaData.media.ECID || 'N/A' },
              ...(mediaData.media.status === MediaStatus.ExcellentCreator
                  ? [
                        {
                            label: gLang('mediaUser.expireDate'),
                            children: mediaData.media.expireDate
                                ? dayjs(mediaData.media.expireDate).format('YYYY-MM-DD')
                                : gLang('noExpiration'),
                        },
                    ]
                  : []),
              ...(mediaData.media.status === MediaStatus.ExcellentCreator
                  ? [
                        {
                            label: gLang('mediaUser.lastReviewed'),
                            children: mediaData.media.lastReviewed
                                ? dayjs(mediaData.media.lastReviewed).format('YYYY-MM-DD')
                                : gLang('notReviewed'),
                        },
                    ]
                  : []),
          ]
        : [];

    if (!mediaData?.is_media_member) {
        return null;
    }

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorBgContainer: descriptionBackground,
                    colorBorder: descriptionBorder,
                    colorText: contentColor,
                    colorTextSecondary: labelColor,
                },
                components: {
                    Descriptions: {
                        itemPaddingBottom: 5,
                        labelBg: labelBackground,
                        labelColor,
                        contentColor,
                        extraColor,
                    },
                },
            }}
        >
            <Descriptions
                bordered
                column={{ xs: 1, sm: 2, md: 3 }}
                items={mediaUserItems}
                style={{
                    background: descriptionBackground,
                    borderColor: descriptionBorder,
                }}
            />
        </ConfigProvider>
    );
};

export default MediaInfo;

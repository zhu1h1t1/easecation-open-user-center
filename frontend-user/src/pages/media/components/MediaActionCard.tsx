// 媒体卡片组件

import React from 'react';
import { FaBilibili } from 'react-icons/fa6';
import { MediaListData, MediaStatus } from '@ecuc/shared/types/media.types';
import { gLang } from '@common/language';
import CardItem from '@common/components/CardItem/CardItem';
import { useTheme, type CustomThemeName } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

interface MediaActionCardProps {
    mediaData?: MediaListData;
    onAction: () => void;
}

export const MediaActionCard: React.FC<MediaActionCardProps> = ({ mediaData, onAction }) => {
    const { isDark, getThemeColor, customTheme } = useTheme();
    type PaletteKey = keyof (typeof CUSTOM_THEME_PALETTES)[CustomThemeName];
    const getCustomColor = (key: PaletteKey) => {
        if (!customTheme) {
            return undefined;
        }
        return {
            [customTheme]: CUSTOM_THEME_PALETTES[customTheme][key],
        } as Partial<Record<CustomThemeName, string>>;
    };
    const cardAccent = getThemeColor({
        light: '#f5197c',
        dark: '#ff85c0',
        custom: getCustomColor('accent'),
    });
    const cardBackground = getThemeColor({
        light: '#FFFFFF',
        dark: '#171717',
        custom: getCustomColor('surface'),
    });
    const cardHover = getThemeColor({
        light: '#F5F5F5',
        dark: '#2A2A2A',
        custom: getCustomColor('hover'),
    });
    const cardBorder = getThemeColor({
        light: '#E0E0E0',
        dark: '#303030',
        custom: getCustomColor('border'),
    });
    const cardText = getThemeColor({
        light: '#1A1A1A',
        dark: '#EEF2F7',
        custom: getCustomColor('textPrimary'),
    });
    const cardDesc = getThemeColor({
        light: '#00000099',
        dark: '#FFFFFF99',
        custom: getCustomColor('textMuted'),
    });
    const status = mediaData?.media?.status;
    // 如果没有媒体数据，不禁用按钮（用于申请认证）
    const isDisabled =
        !mediaData || !mediaData.media
            ? false
            : status === MediaStatus.PendingReview || status === MediaStatus.Frozen;

    function getTitle(): string {
        // 如果没有媒体数据或媒体信息，显示申请认证
        if (!mediaData || !mediaData.media) {
            return gLang('mediaAction.applyForCertification');
        }

        switch (status) {
            case MediaStatus.PendingReview:
                return gLang('mediaAction.certInProgress') + mediaData?.media?.id;
            case MediaStatus.Frozen:
                return gLang('mediaAction.accountFrozen');
            case MediaStatus.Player:
                return gLang('mediaAction.applyForCertification');
            case MediaStatus.ExpiredCreator:
                return gLang('mediaAction.applyShopPermission');
            case MediaStatus.ActiveCreator:
                return gLang('mediaAction.applyEPoints');
            case MediaStatus.ExcellentCreator:
                return gLang('mediaAction.applyEPoints');
            default:
                return gLang('mediaAction.applyForCertification');
        }
    }

    function getContent(): string {
        // 如果没有媒体数据或媒体信息，显示申请认证描述
        if (!mediaData || !mediaData.media) {
            return gLang('mediaAction.joinMediaFamily');
        }

        switch (status) {
            case MediaStatus.PendingReview:
                return gLang('mediaAction.checkTicketProgress');
            case MediaStatus.Frozen:
                return gLang('mediaAction.contactSupport');
            case MediaStatus.Player:
                return gLang('mediaAction.joinMediaFamily');
            case MediaStatus.ExpiredCreator:
                return gLang('mediaAction.applyShopPermissionDesc');
            case MediaStatus.ActiveCreator:
                return gLang('mediaAction.applyEPointsDesc');
            case MediaStatus.ExcellentCreator:
                return gLang('mediaAction.applyEPointsDesc');
            default:
                return gLang('mediaAction.joinMediaFamily');
        }
    }

    const handleClick = () => {
        // 如果没有媒体数据，允许点击（用于申请认证）
        if (!mediaData || !mediaData.media) {
            onAction();
            return;
        }

        if (isDisabled) return;
        onAction();
    };

    return (
        <CardItem
            Icon={FaBilibili}
            color={cardAccent}
            description={getContent()}
            isDark={isDark}
            onClick={handleClick}
            title={getTitle()}
            isResponsive={false}
            isDisabled={isDisabled}
            backgroundColor={cardBackground}
            hoverColor={cardHover}
            borderColor={cardBorder}
            textColor={cardText}
            descColor={cardDesc}
        />
    );
};

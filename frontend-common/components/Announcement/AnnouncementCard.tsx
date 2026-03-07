import React from 'react';
import { FaUsers } from 'react-icons/fa';
import CardItem from '../CardItem/CardItem';
import { renderTextWithLinks, parseModalOpenCommand } from '../../utils/announcementUtils';
import { Announcement } from '@ecuc/shared/types/media.types';
import { useTheme } from '../../contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '../../themes/customPalettes';

interface AnnouncementCardProps {
    announcement: Announcement;
    isDark: boolean;
    onClick: () => void;
    recruitmentAccent: string;
    fadeInDelay?: number;
    onModalOpen?: (modalName: string) => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
    announcement,
    isDark,
    onClick,
    recruitmentAccent,
    fadeInDelay = 0,
    onModalOpen,
}) => {
    // 检查公告内容中是否包含特殊命令（特殊命令通常在content中）
    const modalName = parseModalOpenCommand(announcement.content);

    // 处理点击事件：如果有特殊命令且提供了回调，则打开指定模态框；否则使用默认行为
    const handleClick = () => {
        if (modalName && onModalOpen) {
            onModalOpen(modalName);
        } else {
            onClick();
        }
    };
    const { getThemeColor } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;

    const backgroundColor = getThemeColor({
        light: recruitmentAccent + '10',
        dark: recruitmentAccent + '10',
        custom: { blackOrange: palette.surface },
    });
    const borderColor = getThemeColor({
        light: recruitmentAccent,
        dark: recruitmentAccent,
        custom: { blackOrange: palette.border },
    });
    const hoverColor = getThemeColor({
        light: recruitmentAccent + '20',
        dark: recruitmentAccent + '20',
        custom: { blackOrange: palette.hover },
    });
    const textColor = getThemeColor({
        light: '#1A1A1A',
        dark: '#EEF2F7',
        custom: { blackOrange: palette.textPrimary },
    });
    const descColor = getThemeColor({
        light: '#00000099',
        dark: '#FFFFFF99',
        custom: { blackOrange: palette.textMuted },
    });

    return (
        <CardItem
            Icon={FaUsers}
            color={recruitmentAccent}
            title={announcement.card}
            description={<span>{renderTextWithLinks(announcement.carddesc)}</span>}
            isDark={isDark}
            onClick={handleClick}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            hoverColor={hoverColor}
            textColor={textColor}
            descColor={descColor}
            fadeInDelay={fadeInDelay}
        />
    );
};

export default AnnouncementCard;

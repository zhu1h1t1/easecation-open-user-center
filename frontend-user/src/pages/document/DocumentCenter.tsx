// 文档中心

import { useNavigate } from 'react-router-dom';
import PageTitle from '@common/components/PageTitle/PageTitle';
import CardItem from '@common/components/CardItem/CardItem';
import Wrapper from '@common/components/Wrapper/Wrapper';
import { IoDocumentText } from 'react-icons/io5';
import { FaUsers, FaShoppingCart, FaCrown, FaGift } from 'react-icons/fa';
import { gLang } from '@common/language';
import { Row } from 'antd';
import usePageTitle from '@common/hooks/usePageTitle';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

const DocumentCenter = () => {
    usePageTitle(); // 使用页面标题管理Hook
    const { isDark, getThemeColor, customTheme, isCustomThemeActive } = useTheme();
    const activeCustomPalette =
        isCustomThemeActive && customTheme ? CUSTOM_THEME_PALETTES[customTheme] : null;
    const cardBackground = getThemeColor({
        light: '#FFFFFF',
        dark: '#171717',
        custom: {
            blackOrange: CUSTOM_THEME_PALETTES.blackOrange.surface,
            whiteMinimal: CUSTOM_THEME_PALETTES.whiteMinimal.surface,
        },
    });
    const cardHover = getThemeColor({
        light: '#F5F5F5',
        dark: '#2A2A2A',
        custom: {
            blackOrange: CUSTOM_THEME_PALETTES.blackOrange.hover,
            whiteMinimal: CUSTOM_THEME_PALETTES.whiteMinimal.hover,
        },
    });
    const cardBorder = getThemeColor({
        light: '#E0E0E0',
        dark: '#303030',
        custom: {
            blackOrange: CUSTOM_THEME_PALETTES.blackOrange.border,
            whiteMinimal: CUSTOM_THEME_PALETTES.whiteMinimal.border,
        },
    });
    const cardText = getThemeColor({
        light: '#1A1A1A',
        dark: '#EEF2F7',
        custom: {
            blackOrange: CUSTOM_THEME_PALETTES.blackOrange.textPrimary,
            whiteMinimal: CUSTOM_THEME_PALETTES.whiteMinimal.textPrimary,
        },
    });
    const cardDesc = getThemeColor({
        light: '#00000099',
        dark: '#FFFFFF99',
        custom: {
            blackOrange: CUSTOM_THEME_PALETTES.blackOrange.textMuted,
            whiteMinimal: CUSTOM_THEME_PALETTES.whiteMinimal.textMuted,
        },
    });
    const documentCards = [
        {
            key: 'general',
            title: gLang('documentCenter.general.title'),
            desc: gLang('documentCenter.general.desc'),
            route: '/general-guidelines',
            Icon: IoDocumentText,
            color: getThemeColor({
                light: '#1890ff',
                dark: '#69c0ff',
                custom: {
                    blackOrange: CUSTOM_THEME_PALETTES.blackOrange.accent,
                    whiteMinimal: CUSTOM_THEME_PALETTES.whiteMinimal.accent,
                },
            }),
        },
        {
            key: 'media',
            title: gLang('documentCenter.media.title'),
            desc: gLang('documentCenter.media.desc'),
            route: '/media-guidelines',
            Icon: FaCrown,
            color: getThemeColor({
                light: '#faad14',
                dark: '#ffb74d',
                custom: {
                    blackOrange: CUSTOM_THEME_PALETTES.blackOrange.accent,
                    whiteMinimal: CUSTOM_THEME_PALETTES.whiteMinimal.accent,
                },
            }),
        },
        {
            key: 'shop',
            title: gLang('documentCenter.shop.title'),
            desc: gLang('documentCenter.shop.desc'),
            route: '/shop-guidelines',
            Icon: FaShoppingCart,
            color: getThemeColor({
                light: '#52c41a',
                dark: '#7ed321',
                custom: {
                    blackOrange: CUSTOM_THEME_PALETTES.blackOrange.accent,
                    whiteMinimal: CUSTOM_THEME_PALETTES.whiteMinimal.accent,
                },
            }),
        },
        {
            key: 'player',
            title: gLang('documentCenter.player.title'),
            desc: gLang('documentCenter.player.desc'),
            route: '/player-guidelines',
            Icon: FaUsers,
            color: getThemeColor({
                light: '#722ed1',
                dark: '#b37feb',
                custom: {
                    blackOrange: CUSTOM_THEME_PALETTES.blackOrange.accent,
                    whiteMinimal: CUSTOM_THEME_PALETTES.whiteMinimal.accent,
                },
            }),
        },
        {
            key: 'lotteries',
            title: gLang('documentCenter.lotteries.title'),
            desc: gLang('documentCenter.lotteries.desc'),
            route: '/lotteries',
            Icon: FaGift,
            color: getThemeColor({
                light: '#eb2f96',
                dark: '#ff85c0',
                custom: {
                    blackOrange: CUSTOM_THEME_PALETTES.blackOrange.accent,
                    whiteMinimal: CUSTOM_THEME_PALETTES.whiteMinimal.accent,
                },
            }),
        },
    ];
    const navigate = useNavigate();
    return (
        <Wrapper>
            <div
                style={{
                    opacity: 0,
                    transform: 'translateY(-10px)',
                    animation: 'fadeInUp 0.5s ease-in-out forwards',
                }}
            >
                <PageTitle title={gLang('documentCenter.title')} />
            </div>
            <Row gutter={[16, 16]}>
                {documentCards.map((doc, index) => (
                    <CardItem
                        key={doc.key}
                        Icon={doc.Icon}
                        color={doc.color}
                        title={doc.title}
                        description={doc.desc}
                        isDark={isDark}
                        backgroundColor={cardBackground}
                        borderColor={activeCustomPalette ? activeCustomPalette.border : cardBorder}
                        hoverColor={
                            activeCustomPalette ? activeCustomPalette.surfaceAlt : cardHover
                        }
                        textColor={cardText}
                        descColor={cardDesc}
                        isResponsive={true}
                        fadeInDelay={0.1 + index * 0.05}
                        onClick={() => navigate(doc.route)}
                    />
                ))}
            </Row>
        </Wrapper>
    );
};

export default DocumentCenter;

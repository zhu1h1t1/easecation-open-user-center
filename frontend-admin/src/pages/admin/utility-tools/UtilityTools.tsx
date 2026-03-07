// 实用工具页面
// 用于没有 authorize.normal 权限但仍需要访问部分工具的用户

import { useNavigate } from 'react-router-dom';
import PageTitle from '@common/components/PageTitle/PageTitle';
import CardItem from '@common/components/CardItem/CardItem';
import Wrapper from '@common/components/Wrapper/Wrapper';
import { gLang } from '@common/language';
import { Row, message, Modal, Button, Input, Typography } from 'antd';
import usePageTitle from '@common/hooks/usePageTitle';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';
import { useAuth } from '@common/contexts/AuthContext';
import { useState, useMemo } from 'react';
import { getUtilityToolsConfig, getUtilityToolColor } from '../config/utilityTools.config';

const { Text } = Typography;

const UtilityTools = () => {
    usePageTitle(); // 使用页面标题管理Hook
    const { isDark, getThemeColor, customTheme, isCustomThemeActive } = useTheme();
    const { user } = useAuth();
    const [messageApi, contextHolder] = message.useMessage();
    const [jwtModalVisible, setJwtModalVisible] = useState(false);
    const [jwtValue, setJwtValue] = useState('');

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

    const navigate = useNavigate();

    // Show JWT token modal
    const showJwtToken = () => {
        try {
            const jwt = localStorage.getItem('jwt');
            if (jwt) {
                setJwtValue(jwt);
                setJwtModalVisible(true);
            } else {
                messageApi.warning(gLang('adminMain.jwt.notFound'));
            }
        } catch {
            messageApi.error(gLang('adminMain.jwt.getFailed'));
        }
    };

    const copyJwtToClipboard = () => {
        navigator.clipboard
            .writeText(jwtValue)
            .then(() => {
                messageApi.success(gLang('adminMain.jwt.copySuccess'));
            })
            .catch(() => {
                messageApi.error(gLang('adminMain.jwt.copyFailed'));
            });
    };

    // Get utility tools configuration and filter by permissions
    const utilityCards = useMemo(() => {
        const configs = getUtilityToolsConfig();
        return configs
            .filter(tool => !tool.permission || user?.permission?.includes(tool.permission))
            .map(tool => ({
                ...tool,
                color: getUtilityToolColor(tool, getThemeColor),
            }));
    }, [user, getThemeColor]);

    return (
        <Wrapper>
            {contextHolder}
            <PageTitle title={gLang('utilityTools.title')} />
            <Row gutter={[16, 16]}>
                {utilityCards.map(card => (
                    <CardItem
                        key={card.key}
                        Icon={card.Icon}
                        color={card.color}
                        title={card.title}
                        description={card.desc}
                        isDark={isDark}
                        backgroundColor={cardBackground}
                        borderColor={activeCustomPalette ? activeCustomPalette.border : cardBorder}
                        hoverColor={
                            activeCustomPalette ? activeCustomPalette.surfaceAlt : cardHover
                        }
                        textColor={cardText}
                        descColor={cardDesc}
                        isResponsive={true}
                        onClick={() => {
                            if (card.key === 'jwt' && showJwtToken) {
                                showJwtToken();
                            } else if (card.route) {
                                navigate(card.route);
                            }
                        }}
                    />
                ))}
            </Row>

            {/* JWT令牌模态框 */}
            <Modal
                title={gLang('adminMain.jwt.modalTitle')}
                open={jwtModalVisible}
                onCancel={() => setJwtModalVisible(false)}
                footer={[
                    <Button key="copy" type="primary" onClick={copyJwtToClipboard}>
                        {gLang('adminMain.jwt.copyButton')}
                    </Button>,
                    <Button key="close" onClick={() => setJwtModalVisible(false)}>
                        {gLang('adminMain.jwt.closeButton')}
                    </Button>,
                ]}
            >
                <Text type="warning" style={{ display: 'block' }}>
                    {gLang('adminMain.jwt.securityTip')}
                </Text>
                <Input.TextArea value={jwtValue} readOnly rows={6} style={{ marginTop: 16 }} />
            </Modal>
        </Wrapper>
    );
};

export default UtilityTools;

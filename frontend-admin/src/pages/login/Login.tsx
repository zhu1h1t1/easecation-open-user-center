// noinspection SpellCheckingInspection

import { Button, Flex, Input, message, Modal, Space, Typography } from 'antd';
import { gLang } from '@common/language';
import { useState } from 'react';
import { IdcardFilled } from '@ant-design/icons';
import { TinyColor } from '@ctrl/tinycolor';
import { BACKEND_DOMAIN } from '@common/global';
import usePageTitle from '@common/hooks/usePageTitle';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

const Login = () => {
    usePageTitle(); // 使用页面标题管理Hook

    const { Title, Paragraph, Text } = Typography;
    const { getThemeColor, customTheme, isCustomThemeActive } = useTheme();

    const nexa_redirect_uri = encodeURIComponent(BACKEND_DOMAIN + '/user/login');
    const iamFrontendUrl = import.meta.env.VITE_IAM_FRONTEND_URL ?? '';
    const iamClientId = import.meta.env.VITE_IAM_CLIENT_ID ?? '';

    const [isJwtModalOpen, setIsJwtModalOpen] = useState(false);
    const [jwtValue, setJwtValue] = useState('');
    const [messageApi, messageContextHolder] = message.useMessage();

    const colors2 = ['#fc6076', '#ff9a44'];
    const getHoverColors = (colors: string[]) =>
        colors.map(color => new TinyColor(color).lighten(5).toString());
    const getActiveColors = (colors: string[]) =>
        colors.map(color => new TinyColor(color).darken(5).toString());

    // 主题适配颜色
    const titleColor = getThemeColor({
        light: '#1f1f1f',
        dark: '#f5f5f5',
        custom: customTheme
            ? { [customTheme]: CUSTOM_THEME_PALETTES[customTheme].textPrimary }
            : undefined,
    });

    const descriptionColor = getThemeColor({
        light: '#666666',
        dark: '#8c8c8c',
        custom: customTheme
            ? { [customTheme]: CUSTOM_THEME_PALETTES[customTheme].textMuted }
            : undefined,
    });

    const jwtTextColor = getThemeColor({
        light: '#8c8c8c',
        dark: '#595959',
        custom: customTheme
            ? { [customTheme]: CUSTOM_THEME_PALETTES[customTheme].textMuted }
            : undefined,
    });

    // 主题适配的按钮颜色
    const getThemeAdaptedColors = (originalColors: string[]) => {
        if (isCustomThemeActive && customTheme) {
            const palette = CUSTOM_THEME_PALETTES[customTheme];
            // 在黑橙主题下，使用主题的强调色
            if (customTheme === 'blackOrange') {
                return [palette.accent, palette.accent];
            }
            // 在白极简主题下，使用主题的强调色
            if (customTheme === 'whiteMinimal') {
                return [palette.accent, palette.accent];
            }
        }
        return originalColors;
    };

    const adaptedColors2 = getThemeAdaptedColors(colors2);

    const showJwtModal = () => {
        setIsJwtModalOpen(true);
    };

    const handleJwtCancel = () => {
        setIsJwtModalOpen(false);
        setJwtValue('');
    };

    const handleJwtSubmit = () => {
        if (!jwtValue.trim()) {
            messageApi.error(gLang('login.jwt.empty'));
            return;
        }

        try {
            localStorage.setItem('jwt', jwtValue.trim());
            localStorage.removeItem('jwt_refresh');
            messageApi.success(gLang('login.jwt.saved'));
            setIsJwtModalOpen(false);

            // 跳转到主页
            window.location.href = '/';
        } catch {
            messageApi.error(gLang('login.jwt.saveFailed'));
        }
    };

    const encodeBase64Url = (input: string) => {
        const bytes = new TextEncoder().encode(input);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const b64 = btoa(binary);
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const getReturnTo = (): string => {
        try {
            const params = new URLSearchParams(window.location.search);
            const raw =
                params.get('return_to') ||
                params.get('redirect') ||
                params.get('from') ||
                window.location.origin + '/';
            // 禁止回到登录页或登录回调页
            try {
                const u = new URL(raw, window.location.origin);
                if (u.pathname.startsWith('/login')) return window.location.origin + '/';
                return raw;
            } catch {
                return window.location.origin + '/';
            }
        } catch {
            return window.location.origin + '/';
        }
    };

    const handleIamLogin = () => {
        const returnTo = getReturnTo();
        localStorage.setItem('iam_return_to', returnTo);

        const stateObj = {
            return_to: returnTo,
            nonce: Math.random().toString(36).slice(2),
            ts: Date.now(),
        };
        const state = encodeBase64Url(JSON.stringify(stateObj));
        const url =
            iamFrontendUrl +
            '/login' +
            '?client_id=' +
            iamClientId +
            '&redirect_uri=' +
            nexa_redirect_uri +
            '&state=' +
            encodeURIComponent(state) +
            '&scope=';
        window.location.href = url;
    };

    const hoverColors2 = getHoverColors(adaptedColors2);
    const activeColors2 = getActiveColors(adaptedColors2);

    return (
        <Space
            direction="vertical"
            size={'middle'}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                paddingBottom: 80,
                flex: 1,
            }}
        >
            {messageContextHolder}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Title level={2} style={{ color: titleColor }}>
                    {gLang('login.admin.title')}
                </Title>
                <Paragraph>
                    <Text style={{ color: descriptionColor }}>{gLang('login.admin.intro')}</Text>
                </Paragraph>
            </div>
            <Flex
                wrap
                gap="small"
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    maxWidth: 400,
                }}
            >
                <Button
                    type="primary"
                    size="large"
                    icon={<IdcardFilled />}
                    onClick={handleIamLogin}
                    style={{
                        background: `linear-gradient(135deg, ${adaptedColors2.join(', ')})`,
                        border: 'none',
                        boxShadow: 'none',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${hoverColors2.join(', ')})`;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${adaptedColors2.join(', ')})`;
                    }}
                    onMouseDown={e => {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${activeColors2.join(', ')})`;
                    }}
                    onMouseUp={e => {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${hoverColors2.join(', ')})`;
                    }}
                >
                    {gLang('login.nexa')}
                </Button>
            </Flex>

            {/* JWT登录入口 */}
            <div
                style={{
                    position: 'fixed',
                    right: 20,
                    bottom: 20,
                    opacity: 0.3,
                    zIndex: 100,
                }}
            >
                <Text
                    style={{
                        fontSize: '12px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        color: jwtTextColor,
                    }}
                    onClick={showJwtModal}
                >
                    {gLang('login.jwt.login')}
                </Text>
            </div>

            <Modal
                title={gLang('login.jwt.login')}
                open={isJwtModalOpen}
                onCancel={handleJwtCancel}
                onOk={handleJwtSubmit}
                okText={gLang('login.jwt.confirm')}
                cancelText={gLang('login.jwt.cancel')}
            >
                <Input.TextArea
                    placeholder={gLang('login.jwt.placeholder')}
                    value={jwtValue}
                    onChange={e => setJwtValue(e.target.value)}
                    rows={4}
                    style={{ marginTop: 16 }}
                />
            </Modal>
        </Space>
    );
};

export default Login;

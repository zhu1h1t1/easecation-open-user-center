// noinspection SpellCheckingInspection

import { Button, Flex, Input, message, Modal, Space, Typography } from 'antd';
import { gLang } from '@common/language';
import React, { useEffect, useState } from 'react';
import { QqOutlined, WechatOutlined } from '@ant-design/icons';
import { TinyColor } from '@ctrl/tinycolor';
import { BACKEND_DOMAIN } from '@common/global';
import usePageTitle from '@common/hooks/usePageTitle';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';
import axiosInstance from '@common/axiosConfig';

const Login = () => {
    usePageTitle(); // 使用页面标题管理Hook

    const { Title, Paragraph, Text } = Typography;
    const { getThemeColor, customTheme, isCustomThemeActive } = useTheme();

    const wx_appid = import.meta.env.VITE_WECHAT_APP_ID;
    const qq_appid = import.meta.env.VITE_QQ_APP_ID;
    const qq_state = import.meta.env.VITE_QQ_STATE;

    // 获取并规范化 return_to，统一为站内相对路径，避免协议不一致导致循环跳转
    const getReturnTo = (): string => {
        const params = new URLSearchParams(window.location.search);
        const raw =
            params.get('return_to') ||
            params.get('redirect') ||
            params.get('from') ||
            window.location.origin + '/';

        const u = new URL(raw, window.location.origin);
        if (u.pathname.startsWith('/login')) return '/';
        if (u.hostname !== window.location.hostname) return '/';
        return `${u.pathname}${u.search}${u.hash}` || '/';
    };

    // 构建回调URL，通过 query 透传 return_to 到登录回调页
    const returnTo = getReturnTo();
    const wx_redirect_uri = encodeURIComponent(
        BACKEND_DOMAIN + '/callback/wechat/login?return_to=' + encodeURIComponent(returnTo)
    );
    const qq_redirect_uri = encodeURIComponent(
        BACKEND_DOMAIN + '/callback/qq/login?return_to=' + encodeURIComponent(returnTo)
    );

    const wx_full_link =
        'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' +
        wx_appid +
        '&redirect_uri=' +
        wx_redirect_uri +
        '&response_type=code&scope=snsapi_base#wechat_redirect';

    const [isJwtModalOpen, setIsJwtModalOpen] = useState(false);
    const [jwtValue, setJwtValue] = useState('');
    const [messageApi, messageContextHolder] = message.useMessage();

    const [useDefaultPage, setUseDefaultPage] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

    useEffect(() => {
        const fetchLoginPage = async () => {
            // 从 localStorage 获取 loginPageCache（如果不存在则发送空值）
            const loginPageCache = localStorage.getItem('loginPageCache') || '';

            try {
                const response = await axiosInstance.get('/user/login-page?json=true', {
                    params: {
                        loginPageCache: loginPageCache || undefined,
                    },
                });

                const responseData = response.data;
                // 如果返回了 redirectUrl，说明需要跳转到管理端
                if (responseData.EPF_code === 200 && responseData.redirectUrl) {
                    window.location.href = responseData.redirectUrl;
                    return;
                }

                // 如果没有 redirectUrl，使用默认页面（React 组件）
                setUseDefaultPage(true);
            } catch {
                // 出错时使用默认页面
                setUseDefaultPage(true);
            }
        };

        fetchLoginPage();
    }, []);

    // 检测是否在微信环境
    const isWeChatBrowser = (): boolean => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return userAgent.includes('micromessenger');
    };

    useEffect(() => {
        // 如果在微信环境，自动跳转到微信登录
        if (isWeChatBrowser()) {
            window.location.href = wx_full_link;
        }
    }, []);

    const colors1 = ['#346bf4', '#538ce1'];
    const colors3 = ['#57BE6A', '#79CB88'];
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

    const adaptedColors1 = getThemeAdaptedColors(colors1);
    const adaptedColors3 = getThemeAdaptedColors(colors3);

    const hoverColors1 = getHoverColors(adaptedColors1);
    const activeColors1 = getActiveColors(adaptedColors1);
    const hoverColors3 = getHoverColors(adaptedColors3);
    const activeColors3 = getActiveColors(adaptedColors3);

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

    // 处理微信登录按钮点击
    const handleWeChatLogin = (e: React.MouseEvent) => {
        if (!isWeChatBrowser()) {
            e.preventDefault();
            setIsCopyModalOpen(true);
        }
        // 如果在微信环境，href会自动跳转
    };

    // 复制URL到剪贴板 - 复制的是当前页面URL，不是OAuth URL
    const handleCopyUrl = async () => {
        try {
            // 构建完整的当前页面URL（包含return_to参数）
            const currentPageUrl = window.location.href;
            await navigator.clipboard.writeText(currentPageUrl);
            messageApi.success(gLang('login.jwt.linkCopiedWechat'));
            setIsCopyModalOpen(false);
        } catch {
            messageApi.error(gLang('login.jwt.copyFailedManual'));
        }
    };

    // 如果使用默认页面，渲染原来的 React 组件
    if (useDefaultPage) {
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
                        {gLang('login.title')}
                    </Title>
                    <Paragraph>
                        <Text style={{ color: descriptionColor }}>{gLang('login.intro')}</Text>
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
                        icon={<QqOutlined />}
                        href={
                            'https://graph.qq.com/oauth2.0/authorize?client_id=' +
                            qq_appid +
                            '&redirect_uri=' +
                            qq_redirect_uri +
                            '&response_type=code&state=' +
                            qq_state
                        }
                        style={{
                            background: `linear-gradient(135deg, ${adaptedColors1.join(', ')})`,
                            border: 'none',
                            boxShadow: 'none',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${hoverColors1.join(', ')})`;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${adaptedColors1.join(', ')})`;
                        }}
                        onMouseDown={e => {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${activeColors1.join(', ')})`;
                        }}
                        onMouseUp={e => {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${hoverColors1.join(', ')})`;
                        }}
                    >
                        {gLang('login.qq')}
                    </Button>

                    <Button
                        type="primary"
                        size="large"
                        icon={<WechatOutlined />}
                        href={wx_full_link}
                        onClick={handleWeChatLogin}
                        style={{
                            background: `linear-gradient(135deg, ${adaptedColors3.join(', ')})`,
                            border: 'none',
                            boxShadow: 'none',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${hoverColors3.join(', ')})`;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${adaptedColors3.join(', ')})`;
                        }}
                        onMouseDown={e => {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${activeColors3.join(', ')})`;
                        }}
                        onMouseUp={e => {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${hoverColors3.join(', ')})`;
                        }}
                    >
                        {gLang('login.wechat')}
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

                <Modal
                    title={gLang('login.jwt.openInWechat')}
                    open={isCopyModalOpen}
                    onCancel={() => setIsCopyModalOpen(false)}
                    onOk={handleCopyUrl}
                    okText={gLang('login.jwt.copyLink')}
                    cancelText={gLang('login.jwt.cancel')}
                >
                    <div style={{ marginTop: 16 }}>
                        <Paragraph>
                            <Text style={{ color: descriptionColor }}>
                                {gLang('login.jwt.openInWechatDesc')}
                            </Text>
                        </Paragraph>
                        <Input.TextArea
                            value={window.location.href}
                            readOnly
                            rows={4}
                            style={{ marginTop: 8 }}
                        />
                    </div>
                </Modal>
            </Space>
        );
    }

    // 加载中状态
    return null;
};

export default Login;

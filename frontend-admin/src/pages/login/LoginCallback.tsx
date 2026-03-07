// 登录回调页面

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Result } from 'antd';
import { useAuth } from '@common/contexts/AuthContext';
import axiosInstance from '@common/axiosConfig';
import { gLang } from '@common/language';
import useDarkMode from '@common/hooks/useDarkMode';

const LoginCallback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isDark = useDarkMode();

    useEffect(() => {
        const handleLogin = async () => {
            try {
                const params = new URLSearchParams(location.search);
                const token = params.get('token');
                const refreshToken = params.get('refresh_token');
                const state = params.get('state');

                if (!token) {
                    navigate('/login');
                    return;
                }

                localStorage.setItem('jwt', token);
                if (refreshToken) {
                    localStorage.setItem('jwt_refresh', refreshToken);
                }
                const response = await axiosInstance.get('/user/info');
                setUser(response.data);

                // 优先从 state 中恢复 return_to
                let returnTo: string | null = null;
                if (state) {
                    const b64 = state.replace(/-/g, '+').replace(/_/g, '/');
                    const binary = atob(b64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    const jsonStr = new TextDecoder().decode(bytes);
                    const json = JSON.parse(jsonStr);
                    if (json && typeof json.return_to === 'string') {
                        returnTo = json.return_to;
                    }
                }

                // 兼容从 localStorage 恢复
                if (!returnTo) {
                    returnTo = localStorage.getItem('iam_return_to');
                }

                // 禁止回到登录页或登录回调页
                const isDisallowedReturnTo = (url: string) => {
                    try {
                        const u = new URL(url, window.location.origin);
                        return u.pathname.startsWith('/login');
                    } catch {
                        return true;
                    }
                };
                if (returnTo && isDisallowedReturnTo(returnTo)) {
                    returnTo = '/';
                }

                if (!returnTo) {
                    returnTo = '/';
                }

                // 清理临时存储
                localStorage.removeItem('iam_return_to');

                // 清除首页动画标记，让新登录会话重新显示动画
                sessionStorage.removeItem('homeAnimationShown');

                // 直接跳转到管理端目标页面，不再自动跨域同步
                window.location.href = returnTo;
            } catch {
                setError(gLang('login.callback.error'));
                setTimeout(() => navigate('/login'), 2000);
            } finally {
                setLoading(false);
            }
        };

        handleLogin();
    }, [location, navigate, setUser]);

    if (loading) {
        return null;
    }

    if (error) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'Canvas',
                    color: 'CanvasText',
                    colorScheme: isDark ? 'dark' : 'light',
                    padding: 24,
                }}
            >
                <Result
                    status="error"
                    title={error}
                    subTitle={gLang('login.callback.loading')}
                    style={{
                        maxWidth: 400,
                        textAlign: 'center',
                    }}
                />
            </div>
        );
    }

    return null;
};

export default LoginCallback;

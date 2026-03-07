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
                const returnToParam = params.get('return_to');

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

                // 检查 URL 参数中是否有 addLocalStorage 参数（从管理端跨域切换传递过来的）
                const addLocalStorageParam = params.get('addLocalStorage');

                // 优先从 URL 参数获取 return_to
                let returnTo: string | null = returnToParam;

                // 其次从 state 中恢复 return_to
                if (!returnTo && state) {
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

                // 规范化 return_to，统一为站内相对路径，避免协议不一致导致循环跳转
                const normalizeReturnTo = (url: string) => {
                    try {
                        const u = new URL(url, window.location.origin);
                        if (u.pathname.startsWith('/login')) return '/';
                        if (u.hostname !== window.location.hostname) return '/';
                        return `${u.pathname}${u.search}${u.hash}` || '/';
                    } catch {
                        return '/';
                    }
                };

                if (returnTo) {
                    returnTo = normalizeReturnTo(returnTo);
                }

                // 禁止回到登录页或登录回调页
                const isDisallowedReturnTo = (url: string) => {
                    const u = new URL(url, window.location.origin);
                    return u.pathname.startsWith('/login');
                };
                if (returnTo && isDisallowedReturnTo(returnTo)) {
                    returnTo = '/';
                }

                // 构建最终跳转 URL，如果有 addLocalStorage 参数则添加到跳转 URL 中
                let finalUrl: string;
                if (returnTo) {
                    localStorage.removeItem('iam_return_to');
                    try {
                        const returnToUrl = new URL(returnTo, window.location.origin);
                        if (addLocalStorageParam) {
                            returnToUrl.searchParams.set('localStorage', addLocalStorageParam);
                        }
                        finalUrl = returnToUrl.toString();
                    } catch {
                        // 如果解析失败，假设是相对路径
                        if (addLocalStorageParam) {
                            finalUrl = `${returnTo}?localStorage=${encodeURIComponent(addLocalStorageParam)}`;
                        } else {
                            finalUrl = returnTo;
                        }
                    }
                } else {
                    // 跳转到主页
                    if (addLocalStorageParam) {
                        finalUrl = `/?localStorage=${encodeURIComponent(addLocalStorageParam)}`;
                    } else {
                        finalUrl = '/';
                    }
                }

                // Clear animation flag for new login session
                sessionStorage.removeItem('homeAnimationShown');
                window.location.href = finalUrl;
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

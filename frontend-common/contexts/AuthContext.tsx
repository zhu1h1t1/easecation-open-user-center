// frontend/src/AuthContext.tsx
// 用户鉴权

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosInstance from '../axiosConfig';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { publicRoutes } from '../config/publicRoutes';

interface User {
    openid?: string;
    permission?: string[];
    userid?: number;
}

interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const navigate = useNavigate();
    const location = useLocation();
    // 主题在布局层处理，这里不再使用

    // 计算是否为公开路由
    const isPublicRoute = publicRoutes.some(route => matchPath({ path: route }, location.pathname));

    // 检查是否是带 token 的 risk-approval 详情页
    const isRiskApprovalWithToken =
        location.pathname.match(/^\/admin\/risk-approval\/\d+$/) &&
        new URLSearchParams(location.search).has('token');

    // 检查是否是带 token 的年度报告分享页
    const isAnnualReportShareWithToken =
        location.pathname === '/annual-report/share' &&
        new URLSearchParams(location.search).has('token');

    // 首次加载时获取用户信息（只在非公开路由时执行）
    useEffect(() => {
        // 公开路由不需要获取用户信息
        if (isPublicRoute) {
            setAuthLoading(false);
            return;
        }

        // 带 token 的分享页面：尝试获取用户信息（如果用户已登录），但失败时不阻止访问
        if (isAnnualReportShareWithToken) {
            let isMounted = true;
            const fetchUser = async () => {
                try {
                    const response = await axiosInstance.get('/user/info');
                    if (!isMounted) return;
                    // 如果用户已登录，保存用户信息，这样跳转到主页时不会触发重定向
                    setUser(response.data);
                } finally {
                    if (isMounted) {
                        setAuthLoading(false);
                    }
                }
            };
            fetchUser();
            return () => {
                isMounted = false;
            };
        }

        let isMounted = true;
        const fetchUser = async () => {
            try {
                const response = await axiosInstance.get('/user/info');
                if (!isMounted) return;
                setUser(response.data);
            } catch {
                if (!isMounted) return;
                // 如果获取用户信息失败（未登录），设置为 null
                // 对于带 token 的路由，这是正常的，可以继续访问
                setUser(null);
            } finally {
                if (isMounted) {
                    setAuthLoading(false);
                }
            }
        };
        fetchUser();
        return () => {
            isMounted = false;
        };
    }, [isPublicRoute, isRiskApprovalWithToken, isAnnualReportShareWithToken]);

    // 鉴权与重定向：不在公开路由，且已完成首次加载后再判断
    useEffect(() => {
        if (isPublicRoute) return;
        if (isRiskApprovalWithToken) {
            return;
        }
        if (isAnnualReportShareWithToken) {
            return;
        }

        if (authLoading) return;
        if (!user) {
            const currentUrl = window.location.href;
            const loginUrl = '/login?return_to=' + encodeURIComponent(currentUrl);
            navigate(loginUrl);
            return;
        }
        if (location.pathname.includes('/admin') && !user.userid) {
            const currentUrl = window.location.href;
            const loginUrl = '/login?return_to=' + encodeURIComponent(currentUrl);
            navigate(loginUrl);
        }
    }, [
        isPublicRoute,
        isRiskApprovalWithToken,
        isAnnualReportShareWithToken,
        authLoading,
        user,
        location.pathname,
        navigate,
    ]);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {isPublicRoute ? (
                children
            ) : authLoading ? (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        background: 'Canvas',
                        color: 'CanvasText',
                        padding: 24,
                    }}
                />
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

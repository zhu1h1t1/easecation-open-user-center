import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { gLang, languageConfig } from '@common/language';
import MainLayoutComponent from './components/MainLayoutComponent';
import { useAuth } from '@common/contexts/AuthContext';
import { message } from 'antd';
import { toggleUglyFlashByUserId } from '@common/utils/uglyFlash.util';
import { UGLY_FLASH_USER_IDS } from '@ecuc/shared/constants/media.constants';
import { applyLocalStorageFromUrl } from '@common/utils/localStorageFromUrl';
import axiosInstance from '@common/axiosConfig';

// set timezone to Shanghai
Intl.DateTimeFormat().resolvedOptions().timeZone = 'Asia/Shanghai';

const MainLayout = () => {
    // 从 URL 参数中解析并设置 localStorage
    React.useEffect(() => {
        applyLocalStorageFromUrl();
    }, []);
    const breadcrumbNameMap: { [key: string]: string } = languageConfig['pageTitle'] as {
        [key: string]: string;
    };
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [messageApi, messageContextHolder] = message.useMessage();

    React.useEffect(() => {
        const cleanup = toggleUglyFlashByUserId(user?.userid, UGLY_FLASH_USER_IDS);
        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [user?.userid]);

    const location = useLocation();
    const pathSnippets = location.pathname.split('/').filter(i => i);

    // Check if user has authorize.normal permission
    const hasAdminPermission = user?.permission?.includes('authorize.normal');

    // 获取面包屑显示名称的函数
    const getBreadcrumbDisplayName = (url: string, pathSegment: string, _index: number) => {
        // 首先尝试直接匹配
        if (breadcrumbNameMap[url]) {
            return breadcrumbNameMap[url];
        }

        // 尝试匹配动态路径模式
        const patterns = Object.keys(breadcrumbNameMap);
        for (const pattern of patterns) {
            // 检查是否匹配动态路径模式（包含:ecid、:id等参数）
            if (pattern.includes(':')) {
                const patternSegments = pattern.split('/').filter(i => i);
                const urlSegments = url.split('/').filter(i => i);

                if (patternSegments.length === urlSegments.length) {
                    let matches = true;
                    let ecidValue = '';
                    for (let i = 0; i < patternSegments.length; i++) {
                        if (patternSegments[i].startsWith(':')) {
                            // 提取动态参数值
                            if (patternSegments[i] === ':ecid') {
                                ecidValue = urlSegments[i];
                            }
                            continue;
                        }
                        if (patternSegments[i] !== urlSegments[i]) {
                            matches = false;
                            break;
                        }
                    }
                    if (matches) {
                        // 对于ECID相关的路径，显示具体的ECID值
                        if (pattern === '/account/:ecid' && ecidValue) {
                            return gLang('mainLayout.ecidDetail', { ecidValue });
                        }
                        return breadcrumbNameMap[pattern];
                    }
                }
            }
        }

        // 如果都不匹配，返回原始路径段
        return pathSegment;
    };

    // 跨子域切换到用户端主页

    const breadcrumbItems = [
        {
            key: '/',
            title: <Link to="/">{gLang('pageTitle./')}</Link>,
        },
        ...pathSnippets
            .map((_, index) => {
                let url = `/${pathSnippets.slice(0, index + 1).join('/')}`;

                // For users without authorize.normal permission, replace / with /utility-tools
                if (!hasAdminPermission && url === '/' && location.pathname === '/') {
                    url = '/utility-tools';
                }

                const displayName = getBreadcrumbDisplayName(url, pathSnippets[index], index);
                return {
                    key: url,
                    title:
                        index === pathSnippets.length - 1 ? (
                            displayName
                        ) : (
                            <Link to={url}>{displayName}</Link>
                        ),
                };
            })
            .filter((item, index, array) => {
                // Remove duplicate items: if the current URL is the same as the last item's URL, skip it
                // This handles the case where /admin is replaced with /admin/utility-tools
                const lastItem = array[array.length - 1];
                if (item.key === lastItem.key && index !== array.length - 1) {
                    return false;
                }
                return true;
            }),
    ];

    // 登出处理函数
    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('jwt_refresh');
            if (refreshToken) {
                await axiosInstance.post('/user/logout', { refresh_token: refreshToken });
            }

            // 清除 JWT 令牌
            localStorage.removeItem('jwt');
            localStorage.removeItem('jwt_refresh');

            // 清除跨域切换相关的参数，防止登出后自动跳转
            localStorage.removeItem('AutoDo');
            localStorage.removeItem('admin_last_path');
            localStorage.removeItem('user_last_path');
            localStorage.removeItem('loginPageCache');
            localStorage.removeItem('iam_return_to');

            // 清空用户状态
            setUser(null);

            // 显示成功消息
            messageApi.success(gLang('mainLayout.success'));

            // 跳转到登录页面
            navigate('/login');
        } catch {
            messageApi.error(gLang('mainLayout.logoutFailedRetry'));
        }
    };

    return (
        <>
            {messageContextHolder}
            {MainLayoutComponent({ breadcrumbItems, onLogout: handleLogout })}
        </>
    );
};

export default MainLayout;

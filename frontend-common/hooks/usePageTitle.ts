// 页面标题管理Hook
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { gLang } from '../language';

/**
 * 页面标题管理Hook
 * 用于非工单页面的标题设置
 * 工单页面使用PageMeta组件进行动态标题管理
 */
export const usePageTitle = (customTitle?: string) => {
    const location = useLocation();

    useEffect(() => {
        let title = gLang('pageTitle.userCenter');

        if (customTitle) {
            title = customTitle;
        } else {
            const pageTitle = gLang(`pageTitle.${location.pathname}`);
            if (pageTitle && pageTitle !== `pageTitle.${location.pathname}`) {
                title = gLang('pageTitle.userCenterSuffix', { pageTitle });
            }
        }

        document.title = title;

        return () => {
            document.title = gLang('pageTitle.userCenter');
        };
    }, [location.pathname, customTitle]);
};

export default usePageTitle;

// 页面Meta信息管理组件

import React, { useEffect } from 'react';
import { gLang } from '@common/language';

interface PageMetaProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

const PageMeta: React.FC<PageMetaProps> = ({
    title = gLang('pageMeta.defaultTitle'),
    description = gLang('pageMeta.defaultDescription'),
    image,
    url,
    type = 'website',
}) => {
    useEffect(() => {
        // 设置页面标题
        document.title = title;

        // 获取或创建meta标签的辅助函数
        const setMetaTag = (name: string, content: string, property?: boolean) => {
            const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
            let metaTag = document.querySelector(selector) as HTMLMetaElement;

            if (!metaTag) {
                metaTag = document.createElement('meta');
                if (property) {
                    metaTag.setAttribute('property', name);
                } else {
                    metaTag.setAttribute('name', name);
                }
                document.head.appendChild(metaTag);
            }

            metaTag.setAttribute('content', content);
        };

        // 设置基本meta信息
        setMetaTag('description', description);

        // 设置Open Graph标签（用于社交媒体分享）
        setMetaTag('og:title', title, true);
        setMetaTag('og:description', description, true);
        setMetaTag('og:type', type, true);

        if (url) {
            setMetaTag('og:url', url, true);
        }

        if (image) {
            setMetaTag('og:image', image, true);
            setMetaTag('og:image:alt', title, true);
        }

        // 设置Twitter Card标签
        setMetaTag('twitter:card', image ? 'summary_large_image' : 'summary');
        setMetaTag('twitter:title', title);
        setMetaTag('twitter:description', description);

        if (image) {
            setMetaTag('twitter:image', image);
        }

        // 清理函数 - 在组件卸载时重置为默认值
        return () => {
            document.title = gLang('pageMeta.defaultTitle');
        };
    }, [title, description, image, url, type]);

    // 这个组件不渲染任何内容
    return null;
};

export default PageMeta;

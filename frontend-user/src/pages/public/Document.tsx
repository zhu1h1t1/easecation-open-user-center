// Markdown文档页面级组件

import React, { useEffect, useState } from 'react';
import { Skeleton } from 'antd';
import useDarkMode from '@common/hooks/useDarkMode';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import Wrapper from '@common/components/Wrapper/Wrapper';
import { BACKEND_DOMAIN } from '@common/global';
import { gLang } from '@common/language';

interface DocumentPageProps {
    docName: string;
}

const Document: React.FC<DocumentPageProps> = ({ docName }) => {
    const [markdownContent, setMarkdownContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const isDarkMode = useDarkMode();

    useEffect(() => {
        let isCancelled = false;
        const run = async () => {
            try {
                // 直接从 UC 后端获取文档
                const requestUrl = `${BACKEND_DOMAIN}/proxy/docs/${docName}.md`;
                const resp = await fetch(requestUrl, { mode: 'cors', credentials: 'omit' });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const text = await resp.text();
                if (!isCancelled) {
                    setMarkdownContent(text);
                }
            } catch {
                if (!isCancelled) setMarkdownContent(gLang('document.loadFailed'));
            } finally {
                if (!isCancelled) setLoading(false);
            }
        };
        run();
        return () => {
            isCancelled = true;
        };
    }, [docName]);

    return (
        <Wrapper>
            {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
                <MarkdownRenderer
                    content={markdownContent}
                    isDarkMode={isDarkMode}
                    baseUrl="https://www.easecation.net/docs/"
                />
            )}
        </Wrapper>
    );
};

export default Document;

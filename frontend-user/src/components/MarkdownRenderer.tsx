// Markdown渲染组件

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

const getMarkdownStyles = (isDarkMode: boolean) => ({
    h1: { color: isDarkMode ? '#fff' : '#222', fontSize: 32, margin: '32px 0 16px' },
    h2: { color: isDarkMode ? '#e6e6e6' : '#262626', fontSize: 26, margin: '28px 0 12px' },
    h3: { color: isDarkMode ? '#d9d9d9' : '#434343', fontSize: 22, margin: '24px 0 10px' },
    h4: { color: isDarkMode ? '#bfbfbf' : '#595959', fontSize: 18, margin: '20px 0 8px' },
    h5: { color: isDarkMode ? '#a6a6a6' : '#8c8c8c', fontSize: 16, margin: '16px 0 6px' },
    p: { color: isDarkMode ? '#f0f0f0' : '#222', lineHeight: 1.8, margin: '8px 0' },
    a: { color: isDarkMode ? '#40a9ff' : '#1677ff' },
    ul: { margin: '8px 0 8px 24px' },
    ol: { margin: '8px 0 8px 24px' },
    li: { margin: '4px 0' },
    tableWrapper: {
        overflowX: 'auto' as const,
        margin: '16px 0',
        width: '100%',
    },
    table: {
        width: '100%',
        color: isDarkMode ? '#f0f0f0' : '#222',
    },
    th: {
        border: `1px solid ${isDarkMode ? '#303030' : '#ddd'}`,
        padding: 8,
        background: isDarkMode ? '#222' : '#fafafa',
    },
    td: {
        border: `1px solid ${isDarkMode ? '#303030' : '#ddd'}`,
        padding: 8,
    },
    code: {
        background: isDarkMode ? '#23272e' : '#f6f8fa',
        color: isDarkMode ? '#ffb86c' : '#c41d7f',
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 14,
    },
    pre: {
        background: isDarkMode ? '#23272e' : '#f6f8fa',
        color: isDarkMode ? '#ffb86c' : '#c41d7f',
        padding: 12,
        borderRadius: 6,
        overflow: 'auto',
    },
    img: {
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        margin: '16px auto',
        borderRadius: 4,
        border: `1px solid ${isDarkMode ? '#303030' : '#ddd'}`,
    },
});

interface MarkdownRendererProps {
    content: string;
    isDarkMode: boolean;
    /**
     * 远程资源与相对链接解析的基地址，例如: "https://www.easecation.net/docs/"
     * - 用于将 Markdown 中的相对链接/图片（如 "PlayerGuidelines.md" 或 "./img.png"）解析为可访问的绝对 URL
     * - 不会影响以协议开头的绝对链接（http/https/mailto 等）或以 # 开头的锚点链接
     * - 默认指向 Landing Page 的公开文档目录
     */
    baseUrl?: string;
}

interface MarkdownComponentsProps {
    isDarkMode: boolean;
    baseUrl: string;
}

// 将 Markdown 中的相对 URI 解析为以 baseUrl 为基准的绝对 URL
const resolveUri = (uri: string | null | undefined, baseUrl: string): string | undefined => {
    if (!uri) return undefined;
    const trimmed = uri.trim();

    // 锚点或已包含协议（http/https/mailto 等）则直接返回
    if (trimmed.startsWith('#')) return trimmed;
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed;

    try {
        // 以站点根开头：拼接为同域名绝对地址
        if (trimmed.startsWith('/')) {
            const base = new URL(baseUrl);
            return `${base.protocol}//${base.host}${trimmed}`;
        }
        // 相对路径：以 baseUrl 为参照解析
        return new URL(trimmed, baseUrl).toString();
    } catch {
        return trimmed;
    }
};

const MarkdownComponents = ({ isDarkMode, baseUrl }: MarkdownComponentsProps) => {
    const markdownStyles = getMarkdownStyles(isDarkMode);
    return {
        h1: (props: any) => <h1 style={markdownStyles.h1}>{props.children}</h1>,
        h2: (props: any) => <h2 style={markdownStyles.h2}>{props.children}</h2>,
        h3: (props: any) => <h3 style={markdownStyles.h3}>{props.children}</h3>,
        h4: (props: any) => <h4 style={markdownStyles.h4}>{props.children}</h4>,
        h5: (props: any) => <h5 style={markdownStyles.h5}>{props.children}</h5>,
        p: (props: any) => <p style={markdownStyles.p}>{props.children}</p>,
        a: (props: any) => {
            const resolved = resolveUri(props.href, baseUrl);
            return (
                <a
                    style={markdownStyles.a}
                    href={resolved}
                    target={resolved && resolved.startsWith('#') ? undefined : '_blank'}
                    rel={resolved && resolved.startsWith('#') ? undefined : 'noopener noreferrer'}
                >
                    {props.children}
                </a>
            );
        },
        ul: (props: any) => <ul style={markdownStyles.ul}>{props.children}</ul>,
        ol: (props: any) => <ol style={markdownStyles.ol}>{props.children}</ol>,
        li: (props: any) => <li style={markdownStyles.li}>{props.children}</li>,
        table: (props: any) => (
            <div style={markdownStyles.tableWrapper}>
                <table style={markdownStyles.table}>{props.children}</table>
            </div>
        ),
        th: (props: any) => <th style={markdownStyles.th}>{props.children}</th>,
        td: (props: any) => <td style={markdownStyles.td}>{props.children}</td>,
        code: (props: any) => <code style={markdownStyles.code}>{props.children}</code>,
        pre: (props: any) => <pre style={markdownStyles.pre}>{props.children}</pre>,
        img: (props: any) => {
            const resolvedSrc = resolveUri(props.src, baseUrl);
            return <img style={markdownStyles.img} src={resolvedSrc} alt={props.alt} />;
        },
    };
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isDarkMode, baseUrl }) => {
    const effectiveBaseUrl = baseUrl || 'https://www.easecation.net/docs/';
    return (
        <ReactMarkdown
            components={MarkdownComponents({ isDarkMode, baseUrl: effectiveBaseUrl })}
            remarkPlugins={[remarkGfm, remarkBreaks]}
        >
            {content}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;

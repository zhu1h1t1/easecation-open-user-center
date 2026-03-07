// 抽奖箱概率表页面组件

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Skeleton, Tabs, TabsProps, Input, Button, Space } from 'antd';
import { SearchOutlined, MoreOutlined } from '@ant-design/icons';
import { Grid } from 'antd';
import useDarkMode from '@common/hooks/useDarkMode';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import Wrapper from '@common/components/Wrapper/Wrapper';
import { BACKEND_DOMAIN } from '@common/global';
import { gLang } from '@common/language';

const { useBreakpoint } = Grid;
const { Search } = Input;

interface LotterySection {
    title: string;
    content: string;
}

const Lotteries: React.FC = () => {
    const [markdownContent, setMarkdownContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [activeKey, setActiveKey] = useState<string>('0');
    const [searchText, setSearchText] = useState<string>('');
    const [searchResults, setSearchResults] = useState<number[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
    const contentRef = useRef<HTMLDivElement>(null);
    const scrollRetryCountRef = useRef<number>(0);
    const highlightObserverRef = useRef<MutationObserver | null>(null);
    const searchTextRef = useRef<string>('');
    const currentSearchIndexRef = useRef<number>(-1);
    const searchResultsRef = useRef<number[]>([]);
    const isDarkMode = useDarkMode();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    useEffect(() => {
        let isCancelled = false;
        const run = async () => {
            try {
                // 直接从 UC 后端获取文档
                const requestUrl = `${BACKEND_DOMAIN}/proxy/docs/Lotteries.md`;
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
    }, []);

    // 解析markdown内容，提取每个抽奖箱的概率表
    const { lotterySections, headerContent } = useMemo(() => {
        if (!markdownContent) return { lotterySections: [], headerContent: '' };

        const sections: LotterySection[] = [];
        const lines = markdownContent.split('\n');
        let currentSection: LotterySection | null = null;
        let currentContent: string[] = [];
        let beforeFirstSection: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 检测h2或h3标题（## 或 ### 开头）
            const h2Match = line.match(/^##\s+(.+)$/);
            const h3Match = line.match(/^###\s+(.+)$/);

            if (h2Match || h3Match) {
                // 如果之前有section，先保存
                if (currentSection) {
                    currentSection.content = currentContent.join('\n');
                    sections.push(currentSection);
                }

                // 开始新的section
                const match = h2Match || h3Match;
                if (!match) continue;
                const title = match[1].trim();
                currentSection = { title, content: '' };
                currentContent = [line]; // 只包含标题行，不包含第一个section之前的内容
            } else if (currentSection) {
                // 继续添加到当前section
                currentContent.push(line);
            } else {
                // 在第一个section之前的内容（标题和时间）
                beforeFirstSection.push(line);
            }
        }

        // 保存最后一个section
        if (currentSection) {
            currentSection.content = currentContent.join('\n');
            sections.push(currentSection);
        } else if (beforeFirstSection.length > 0) {
            // 如果没有找到任何section，返回整个内容作为一个section
            sections.push({
                title: gLang('documentCenter.lotteries.title'),
                content: beforeFirstSection.join('\n'),
            });
        }

        // 返回headerContent（第一个section之前的内容）
        const header = beforeFirstSection.length > 0 ? beforeFirstSection.join('\n') : '';

        return { lotterySections: sections, headerContent: header };
    }, [markdownContent]);

    // 切换tab
    const handleTabChange = (key: string) => {
        setActiveKey(key);
        setSearchText('');
        setSearchResults([]);
        setCurrentSearchIndex(-1);
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    };

    // 搜索功能
    const handleSearch = (value: string) => {
        setSearchText(value);
        searchTextRef.current = value;
        if (!value.trim()) {
            setSearchResults([]);
            searchResultsRef.current = [];
            setCurrentSearchIndex(-1);
            currentSearchIndexRef.current = -1;
            return;
        }

        const currentSection = lotterySections[parseInt(activeKey)];
        if (!currentSection) return;

        const content = currentSection.content.toLowerCase();
        const searchLower = value.toLowerCase();
        const results: number[] = [];
        let index = content.indexOf(searchLower);

        while (index !== -1) {
            results.push(index);
            index = content.indexOf(searchLower, index + 1);
        }

        setSearchResults(results);
        searchResultsRef.current = results;
        const newIndex = results.length > 0 ? 0 : -1;
        setCurrentSearchIndex(newIndex);
        currentSearchIndexRef.current = newIndex;

        // 延迟滚动到第一个搜索结果，等待高亮创建完成
        if (results.length > 0 && contentRef.current) {
            setTimeout(() => {
                scrollToSearchResult(0);
            }, 500); // 增加延迟确保高亮创建完成
        }
    };

    // 滚动到搜索结果并高亮当前结果（使用 ref 避免 setTimeout 闭包拿到旧 state）
    const scrollToSearchResult = (index: number) => {
        const results = searchResultsRef.current;
        if (results.length === 0 || !contentRef.current) return;

        const resultIndex = index >= 0 && index < results.length ? index : 0;
        setCurrentSearchIndex(resultIndex);
        currentSearchIndexRef.current = resultIndex;

        const contentElement = contentRef.current;
        if (!contentElement) return;

        // 移除所有当前高亮的标记（只保留普通高亮）
        const existingCurrentMarks = contentElement.querySelectorAll(
            'mark[data-current-highlight="true"]'
        );
        existingCurrentMarks.forEach(mark => {
            const markElement = mark as HTMLElement;
            markElement.removeAttribute('data-current-highlight');
            // 恢复为普通高亮样式
            const highlightColor = isDarkMode ? '#d48806' : '#ffc069';
            const highlightTextColor = isDarkMode ? '#fff' : '#000';
            markElement.style.backgroundColor = highlightColor;
            markElement.style.color = highlightTextColor;
            markElement.style.border = 'none';
            markElement.style.boxShadow = 'none';
            markElement.style.padding = '0';
            markElement.style.display = 'inline';
            markElement.style.lineHeight = 'inherit';
            markElement.style.fontSize = 'inherit';
        });

        // 根据索引属性获取对应的mark标签
        const targetMark = contentElement.querySelector(
            `mark[data-search-highlight="true"][data-search-index="${resultIndex}"]`
        ) as HTMLElement;

        if (targetMark) {
            // 高亮当前搜索结果（更明显的样式）
            targetMark.setAttribute('data-current-highlight', 'true');
            const currentHighlightColor = isDarkMode ? '#faad14' : '#ffa940'; // 更亮的颜色
            const currentHighlightTextColor = isDarkMode ? '#fff' : '#000';
            targetMark.style.backgroundColor = currentHighlightColor;
            targetMark.style.color = currentHighlightTextColor;
            targetMark.style.border = isDarkMode ? '1px solid #faad14' : '1px solid #ffa940';
            targetMark.style.boxShadow = isDarkMode
                ? '0 0 4px rgba(250, 173, 20, 0.5)'
                : '0 0 4px rgba(255, 169, 64, 0.3)';
            targetMark.style.padding = '0';
            targetMark.style.display = 'inline';
            targetMark.style.lineHeight = 'inherit';
            targetMark.style.fontSize = 'inherit';

            // 滚动到目标位置
            targetMark.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
            });
            scrollRetryCountRef.current = 0; // 重置重试计数
        } else if (searchText.trim()) {
            // 如果高亮还没创建，延迟重试（最多重试3次）
            if (scrollRetryCountRef.current < 3) {
                scrollRetryCountRef.current += 1;
                setTimeout(() => {
                    scrollToSearchResult(index);
                }, 100);
            } else {
                scrollRetryCountRef.current = 0;
            }
        } else {
            scrollRetryCountRef.current = 0;
        }
    };

    // 下一个搜索结果
    const handleNextSearch = () => {
        if (searchResults.length === 0) return;
        const nextIndex = (currentSearchIndex + 1) % searchResults.length;
        scrollToSearchResult(nextIndex);
    };

    // 上一个搜索结果
    const handlePrevSearch = () => {
        if (searchResults.length === 0) return;
        const prevIndex =
            currentSearchIndex <= 0 ? searchResults.length - 1 : currentSearchIndex - 1;
        scrollToSearchResult(prevIndex);
    };

    // 高亮搜索结果的函数
    const highlightSearchResults = () => {
        const currentSearchText = searchTextRef.current;
        if (!currentSearchText.trim() || !contentRef.current) {
            return;
        }

        const contentElement = contentRef.current;
        if (!contentElement) return;

        // 移除之前的高亮
        const existingMarks = contentElement.querySelectorAll('mark[data-search-highlight]');
        existingMarks.forEach(mark => {
            const parent = mark.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
                parent.normalize();
            }
        });

        // 高亮新的搜索结果
        const walker = document.createTreeWalker(contentElement, NodeFilter.SHOW_TEXT, null);

        const textNodes: Text[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
            if (
                node.nodeValue &&
                node.nodeValue.toLowerCase().includes(currentSearchText.toLowerCase())
            ) {
                textNodes.push(node as Text);
            }
        }

        // 高亮所有匹配的文本
        const highlightColor = isDarkMode ? '#d48806' : '#ffc069';
        const highlightTextColor = isDarkMode ? '#fff' : '#000';

        let markIndex = 0;
        textNodes.forEach(textNode => {
            const parent = textNode.parentElement;
            if (
                !parent ||
                parent.tagName === 'MARK' ||
                parent.hasAttribute('data-search-highlight')
            )
                return;

            const text = textNode.nodeValue || '';
            const regex = new RegExp(
                `(${currentSearchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
                'gi'
            );
            const parts = text.split(regex);

            if (parts.length > 1) {
                const fragment = document.createDocumentFragment();
                parts.forEach(part => {
                    if (part.toLowerCase() === currentSearchText.toLowerCase()) {
                        const mark = document.createElement('mark');
                        mark.setAttribute('data-search-highlight', 'true');
                        mark.setAttribute('data-search-index', String(markIndex));
                        mark.style.backgroundColor = highlightColor;
                        mark.style.color = highlightTextColor;
                        mark.style.padding = '0';
                        mark.style.borderRadius = '2px';
                        mark.style.display = 'inline';
                        mark.style.lineHeight = 'inherit';
                        mark.style.fontSize = 'inherit';
                        mark.textContent = part;
                        fragment.appendChild(mark);
                        markIndex++;
                    } else if (part) {
                        fragment.appendChild(document.createTextNode(part));
                    }
                });
                parent.replaceChild(fragment, textNode);
            }
        });
    };

    // 当搜索文本或活动tab改变时，高亮搜索结果
    useEffect(() => {
        // 更新ref
        searchTextRef.current = searchText;

        // 清除之前的观察器
        if (highlightObserverRef.current) {
            highlightObserverRef.current.disconnect();
            highlightObserverRef.current = null;
        }

        if (!searchText.trim() || !contentRef.current) {
            // 如果没有搜索文本，清除所有高亮
            const contentElement = contentRef.current;
            if (contentElement) {
                const existingMarks = contentElement.querySelectorAll(
                    'mark[data-search-highlight]'
                );
                existingMarks.forEach(mark => {
                    const parent = mark.parentNode;
                    if (parent) {
                        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
                        parent.normalize();
                    }
                });
            }
            return;
        }

        // 延迟执行，等待Markdown渲染完成
        const timer = setTimeout(() => {
            highlightSearchResults();

            // 重新计算搜索结果索引
            const currentSection = lotterySections[parseInt(activeKey)];
            if (currentSection) {
                const content = currentSection.content.toLowerCase();
                const searchLower = searchText.toLowerCase();
                const results: number[] = [];
                let index = content.indexOf(searchLower);
                while (index !== -1) {
                    results.push(index);
                    index = content.indexOf(searchLower, index + 1);
                }
                setSearchResults(results);
                searchResultsRef.current = results;
                if (results.length > 0) {
                    setCurrentSearchIndex(0);
                    currentSearchIndexRef.current = 0;
                    // 延迟滚动到第一个搜索结果
                    setTimeout(() => {
                        scrollToSearchResult(0);
                    }, 500);
                } else {
                    setCurrentSearchIndex(-1);
                    currentSearchIndexRef.current = -1;
                }
            }

            // 设置MutationObserver监听DOM变化，确保高亮始终显示
            const contentElement = contentRef.current;
            if (contentElement) {
                let debounceTimer: ReturnType<typeof setTimeout> | null = null;
                highlightObserverRef.current = new MutationObserver(mutations => {
                    // 首先检查是否有下拉菜单正在显示，如果有则完全忽略所有变化
                    const dropdown = document.querySelector('.ant-tabs-dropdown');
                    const isDropdownVisible =
                        dropdown &&
                        (dropdown as HTMLElement).offsetParent !== null &&
                        window.getComputedStyle(dropdown as HTMLElement).display !== 'none';

                    if (isDropdownVisible) {
                        return; // 下拉菜单显示时，完全忽略所有变化
                    }

                    // 检查是否有下拉菜单相关的变化，如果有则完全忽略
                    const hasDropdownChange = mutations.some(mutation => {
                        const target = mutation.target as HTMLElement;
                        if (!target) return false;

                        // 检查是否是下拉菜单相关的元素（更全面的检查）
                        const isDropdownElement =
                            target.closest('.ant-dropdown') !== null ||
                            target.closest('.ant-dropdown-menu') !== null ||
                            target.closest('.ant-tabs-dropdown') !== null ||
                            target.closest('.ant-dropdown-menu-item') !== null ||
                            target.closest('[role="menu"]') !== null ||
                            target.closest('[role="menuitem"]') !== null ||
                            target.classList.contains('ant-dropdown') ||
                            target.classList.contains('ant-dropdown-menu') ||
                            target.classList.contains('ant-tabs-dropdown') ||
                            target.classList.contains('ant-dropdown-menu-item') ||
                            target.getAttribute('role') === 'menu' ||
                            target.getAttribute('role') === 'menuitem';

                        if (isDropdownElement) {
                            return true;
                        }

                        // 检查父元素链是否是下拉菜单
                        let parent = target.parentElement;
                        let depth = 0;
                        while (parent && depth < 10) {
                            // 限制检查深度
                            if (
                                parent.classList.contains('ant-dropdown') ||
                                parent.classList.contains('ant-dropdown-menu') ||
                                parent.classList.contains('ant-tabs-dropdown') ||
                                parent.classList.contains('ant-dropdown-menu-item') ||
                                parent.getAttribute('role') === 'menu' ||
                                parent.getAttribute('role') === 'menuitem'
                            ) {
                                return true;
                            }
                            parent = parent.parentElement;
                            depth++;
                        }
                        return false;
                    });

                    if (hasDropdownChange) {
                        return; // 完全忽略下拉菜单的变化
                    }

                    // 如果还有搜索文本，重新高亮
                    if (searchTextRef.current.trim()) {
                        // 防抖处理，避免频繁触发
                        if (debounceTimer) {
                            clearTimeout(debounceTimer);
                        }
                        debounceTimer = setTimeout(() => {
                            highlightSearchResults();
                        }, 300); // 增加延迟，减少触发频率
                    }
                });

                // 只监听内容区域，不监听整个页面，并且不监听属性变化
                highlightObserverRef.current.observe(contentElement, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                    attributes: false, // 不监听属性变化，避免触发下拉菜单相关的属性变化
                    attributeOldValue: false,
                });
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            if (highlightObserverRef.current) {
                highlightObserverRef.current.disconnect();
                highlightObserverRef.current = null;
            }
        };
    }, [searchText, activeKey, lotterySections, isDarkMode]);

    if (loading) {
        return (
            <Wrapper>
                <Skeleton active paragraph={{ rows: 4 }} />
            </Wrapper>
        );
    }

    // 构建Tabs的items
    const tabItems: TabsProps['items'] = lotterySections.map((section, index) => ({
        key: String(index),
        label: section.title,
        children: (
            <div
                ref={index === parseInt(activeKey) ? contentRef : undefined}
                style={{
                    padding: isMobile ? '16px 0' : '24px 0',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    maxHeight: isMobile ? 'calc(100vh - 300px)' : 'calc(100vh - 250px)',
                    position: 'relative',
                    scrollbarWidth: 'thin',
                }}
            >
                <MarkdownRenderer
                    content={section.content}
                    isDarkMode={isDarkMode}
                    baseUrl="https://www.easecation.net/docs/"
                />
            </div>
        ),
    }));

    return (
        <Wrapper>
            <div
                style={{
                    width: '100%',
                    padding: isMobile ? '8px' : '0',
                }}
            >
                {/* 页面标题和更新时间 - 显示在最上面 */}
                {headerContent && (
                    <div
                        style={{
                            marginBottom: 16,
                            paddingBottom: 12,
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
                        }}
                    >
                        <MarkdownRenderer
                            content={headerContent}
                            isDarkMode={isDarkMode}
                            baseUrl="https://www.easecation.net/docs/"
                        />
                    </div>
                )}

                <Space
                    direction="vertical"
                    style={{
                        width: '100%',
                    }}
                    size="middle"
                >
                    {/* 搜索框 - 放在最上面 */}
                    <Search
                        placeholder={gLang('lotteries.searchPlaceholder')}
                        allowClear
                        enterButton={<SearchOutlined />}
                        size={isMobile ? 'small' : 'middle'}
                        value={searchText}
                        onChange={e => handleSearch(e.target.value)}
                        onSearch={handleSearch}
                        style={{ width: '100%' }}
                    />

                    {/* 搜索结果导航 */}
                    {searchText && searchResults.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: isDarkMode
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(0, 0, 0, 0.02)',
                                borderRadius: 4,
                                fontSize: isMobile ? 12 : 14,
                            }}
                        >
                            <span>
                                {currentSearchIndex >= 0
                                    ? gLang('lotteries.searchResultCountWithCurrent', {
                                          count: searchResults.length,
                                          current: currentSearchIndex + 1,
                                          total: searchResults.length,
                                      })
                                    : gLang('lotteries.searchResultCount', {
                                          count: searchResults.length,
                                      })}
                            </span>
                            <Space size="small">
                                <Button
                                    size={isMobile ? 'small' : 'middle'}
                                    onClick={handlePrevSearch}
                                    disabled={searchResults.length === 0}
                                >
                                    {gLang('lotteries.prevResult')}
                                </Button>
                                <Button
                                    size={isMobile ? 'small' : 'middle'}
                                    onClick={handleNextSearch}
                                    disabled={searchResults.length === 0}
                                >
                                    {gLang('lotteries.nextResult')}
                                </Button>
                            </Space>
                        </div>
                    )}

                    {searchText && searchResults.length === 0 && (
                        <div
                            style={{
                                padding: '8px 12px',
                                textAlign: 'center',
                                color: isDarkMode ? '#8c8c8c' : '#595959',
                                fontSize: isMobile ? 12 : 14,
                            }}
                        >
                            {gLang('lotteries.noMatchedResult')}
                        </div>
                    )}

                    {/* Tab导航 - 复用创作者商城的方式，但保留more功能 */}
                    <div
                        style={{
                            overflowX: 'auto',
                            width: '100%',
                            maxWidth: '100%',
                        }}
                    >
                        <Tabs
                            activeKey={activeKey}
                            onChange={handleTabChange}
                            items={tabItems}
                            size={isMobile ? 'small' : 'middle'}
                            more={{
                                icon: <MoreOutlined />,
                            }}
                        />
                    </div>
                    <style>{`
                        /* Tabs dropdown scrollbar style */
                        .ant-tabs-dropdown-menu {
                            max-height: 400px !important;
                            overflow-y: auto !important;
                        }
                        .ant-tabs-dropdown-menu::-webkit-scrollbar {
                            width: 8px;
                        }
                        .ant-tabs-dropdown-menu::-webkit-scrollbar-track {
                            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
                            border-radius: 4px;
                        }
                        .ant-tabs-dropdown-menu::-webkit-scrollbar-thumb {
                            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
                            border-radius: 4px;
                        }
                        .ant-tabs-dropdown-menu::-webkit-scrollbar-thumb:hover {
                            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
                        }
                    `}</style>

                    {/* Tab内容 - 直接使用Tabs的children，避免重复渲染 */}
                </Space>
            </div>
        </Wrapper>
    );
};

export default Lotteries;

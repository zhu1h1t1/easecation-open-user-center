// 我的订阅页面 - 社区讨论风格

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Space, Grid, Card, Typography, Skeleton } from 'antd';
import { SettingOutlined, SearchOutlined, BellOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { gLang } from '@common/language';
import PageTitle from '@common/components/PageTitle/PageTitle';
import Wrapper from '@common/components/Wrapper/Wrapper';
import FeedbackListItem from './components/FeedbackListItem';
import { FeedbackListItemDto } from '@ecuc/shared/types/ticket.types';
import { fetchData } from '@common/axiosConfig';
import usePageTitle from '@common/hooks/usePageTitle';
import { useTheme } from '@common/contexts/ThemeContext';
import FeedbackSettingsModal from './components/FeedbackSettingsModal';

// 淡入动画
const fadeInUpAnimation = `
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

// 添加动画样式到文档头部
if (typeof document !== 'undefined' && !document.getElementById('fadeInUpAnimation')) {
    const style = document.createElement('style');
    style.id = 'fadeInUpAnimation';
    style.innerHTML = fadeInUpAnimation;
    document.head.appendChild(style);
}

const { useBreakpoint } = Grid;
const { Text } = Typography;

const FeedbackSubscriptions: React.FC = () => {
    usePageTitle();
    const location = useLocation();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { getThemeColor } = useTheme();
    const [searchValue, setSearchValue] = useState('');
    const [allTicketList, setAllTicketList] = useState<FeedbackListItemDto[] | undefined>(
        undefined
    );
    const [isSpinning, setIsSpinning] = useState(true);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);

    // Check if this is the first visit after login
    const isFirstVisitAfterLogin = useMemo(() => {
        const hasShownAnimation = sessionStorage.getItem('feedbackSubscriptionsAnimationShown');
        const isFromLogin =
            document.referrer.includes('/login') ||
            document.referrer.includes('/login/callback') ||
            location.state?.fromLogin === true;

        // If coming from login and haven't shown animation yet, show full animation
        if (isFromLogin && !hasShownAnimation) {
            sessionStorage.setItem('feedbackSubscriptionsAnimationShown', 'true');
            return true;
        }
        return false;
    }, [location.state]);

    // Animation delay: first login uses slightly richer stagger; normal navigation stays snappy
    const animationDelay = isFirstVisitAfterLogin ? 0.07 : 0.015;
    const animationStyle = (order: number): React.CSSProperties => ({
        opacity: 0,
        willChange: 'transform, opacity',
        animation: `fadeInUp 0.42s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(order * animationDelay, 0.2)}s forwards`,
    });

    useEffect(() => {
        setIsSpinning(true);
        fetchData({
            url: '/feedback/subscriptions',
            method: 'GET',
            data: {},
            setData: (data: { list?: FeedbackListItemDto[] }) => {
                setAllTicketList(data?.list ?? []);
                setIsSpinning(false);
            },
        });
    }, []);

    // 根据搜索关键词过滤列表（仅标题）
    const ticketList = useMemo(() => {
        if (!allTicketList) return undefined;
        if (!searchValue) return allTicketList;
        const searchLower = searchValue.toLowerCase();
        return allTicketList.filter(item => item.title.toLowerCase().includes(searchLower));
    }, [allTicketList, searchValue]);

    const handleSearch = (value: string) => {
        setSearchValue(value);
    };

    return (
        <Wrapper>
            <div
                style={{
                    marginBottom: 24,
                    ...animationStyle(0),
                }}
            >
                <PageTitle title={gLang('feedback.mySubscriptions')} level={2} />
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* 顶部操作栏 - 响应式布局 */}
                <div style={animationStyle(1)}>
                    <Card
                        size="small"
                        style={{
                            borderRadius: 8,
                            background: getThemeColor({
                                light: '#fafafa',
                                dark: '#1a1a1a',
                            }),
                        }}
                        bodyStyle={{ padding: isMobile ? '12px' : '16px' }}
                    >
                        {isMobile ? (
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <Input
                                    placeholder={gLang('feedback.searchPlaceholder')}
                                    prefix={<SearchOutlined />}
                                    value={searchValue}
                                    onChange={e => handleSearch(e.target.value)}
                                    style={{ width: '100%' }}
                                    allowClear
                                    size="large"
                                />
                                <Button
                                    icon={<SettingOutlined />}
                                    onClick={() => setSettingsModalOpen(true)}
                                    block
                                    size="large"
                                >
                                    {gLang('feedback.settings')}
                                </Button>
                            </Space>
                        ) : (
                            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                                <Input
                                    placeholder={gLang('feedback.searchPlaceholder')}
                                    prefix={<SearchOutlined />}
                                    value={searchValue}
                                    onChange={e => handleSearch(e.target.value)}
                                    style={{ maxWidth: 400, flex: '0 0 auto' }}
                                    allowClear
                                    size="large"
                                />
                                <Button
                                    icon={<SettingOutlined />}
                                    onClick={() => setSettingsModalOpen(true)}
                                    size="large"
                                >
                                    {gLang('feedback.settings')}
                                </Button>
                            </Space>
                        )}
                    </Card>
                </div>

                {/* 订阅的反馈列表 */}
                {isSpinning ? (
                    <Skeleton active paragraph={{ rows: 3 }} title={false} />
                ) : ticketList && ticketList.length > 0 ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                        }}
                    >
                        {ticketList.map((ticket, index) => (
                            <div key={ticket.tid} style={animationStyle(2 + Math.min(index, 8))}>
                                <FeedbackListItem ticket={ticket} to={`/feedback/${ticket.tid}`} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={animationStyle(2)}>
                        <Card
                            style={{
                                borderRadius: 12,
                                textAlign: 'center',
                                padding: '80px 20px',
                                background: getThemeColor({
                                    light: '#fafafa',
                                    dark: '#1a1a1a',
                                }),
                                border: `1px dashed ${getThemeColor({
                                    light: '#d9d9d9',
                                    dark: '#434343',
                                })}`,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 64,
                                    marginBottom: 24,
                                    opacity: 0.5,
                                }}
                            >
                                <BellOutlined />
                            </div>
                            <Text
                                style={{
                                    fontSize: 16,
                                    color: getThemeColor({
                                        light: '#8c8c8c',
                                        dark: '#8c8c8c',
                                    }),
                                }}
                            >
                                {searchValue
                                    ? gLang('feedback.noFeedback')
                                    : gLang('feedback.noSubscriptions')}
                            </Text>
                            {!searchValue && (
                                <div style={{ marginTop: 16 }}>
                                    <Text type="secondary" style={{ fontSize: 14 }}>
                                        {gLang('feedback.noSubscriptionsHint')}
                                    </Text>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </Space>

            {/* 设置 Modal */}
            <FeedbackSettingsModal
                open={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
            />
        </Wrapper>
    );
};

export default FeedbackSubscriptions;

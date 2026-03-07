// 反馈中心 PC 端侧边栏组件
// 布局参考 AdminPCSidebar，左侧包含搜索、筛选器和反馈列表

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Button,
    Flex,
    Input,
    Pagination,
    Select,
    Skeleton,
    Space,
    Tooltip,
    Typography,
    Watermark,
    Modal,
    theme,
} from 'antd';
import {
    DownOutlined,
    HomeOutlined,
    MessageOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    SortAscendingOutlined,
    UpOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { gLang } from '@common/language';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@common/contexts/AuthContext';
import { FeedbackListItemDto } from '@ecuc/shared/types/ticket.types';
import { fetchData } from '@common/axiosConfig';
import { useFeedbackFilters } from '@common/hooks/useFeedbackFilters';
import useDarkMode from '@common/hooks/useDarkMode';
import FeedbackListItem from './components/FeedbackListItem';
import CreateFeedbackModal from './CreateFeedbackModal';
import { FeedbackStatus } from './FeedbackManage';
import type { FeedbackSortBy, FeedbackOrder } from '@common/hooks/useFeedbackFilters';
import { getGlobalMessageApi } from '@common/utils/messageApiHolder';

const { Title, Text } = Typography;

const FeedbackPCSidebar: React.FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    // 从当前路径 /ticket/operate/backToMy/:tid 中解析选中的 tid，用于高亮列表项
    const currentTidMatch = pathname.match(/\/ticket\/operate\/[^/]+\/(\d+)/);
    const currentTid = currentTidMatch ? currentTidMatch[1] : undefined;
    const { user } = useAuth();
    const { useToken } = theme;
    const { token } = useToken();
    const isDarkMode = useDarkMode();

    // 高级筛选折叠状态
    const [advancedOpen, setAdvancedOpen] = useState(false);

    // 列表数据状态
    const [spinning, setSpinning] = useState(false);
    const [tickets, setTickets] = useState<FeedbackListItemDto[]>([]);
    const [total, setTotal] = useState(0);
    const [createFeedbackModalVisible, setCreateFeedbackModalVisible] = useState(false);

    // OpenID 查询状态
    const [openidQueryModalVisible, setOpenidQueryModalVisible] = useState(false);
    const [openidInput, setOpenidInput] = useState('');
    const [openidQueried, setOpenidQueried] = useState<string | null>(null);
    const [, setSubscriptionsByOpenid] = useState<FeedbackListItemDto[] | null>(null);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

    // 使用共享的筛选 Hook
    const filters = useFeedbackFilters({
        pageSize: 20,
        initialFilters: { filterStatus: [], sortBy: 'lastReplyTime', order: 'desc' },
    });
    const {
        filterTag,
        filterType,
        filterStatus,
        sortBy,
        order,
        page,
        pageSize,
        setFilterTag,
        setFilterType,
        setFilterStatus,
        setSortBy,
        setOrder,
        setPage,
    } = filters;

    const [searchKeyword, setSearchKeyword] = useState('');
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 加载反馈列表（服务端关键词搜索，分页用接口返回的 total）。keyword 可选，不传时用当前 searchKeyword
    const loadList = useCallback(
        (pageNum: number, keyword?: string) => {
            setSpinning(true);
            const params: Record<string, string | number | string[]> = {
                page: String(pageNum),
                pageSize: String(pageSize),
                sortBy,
                order,
            };
            if (filterTag != null && filterTag !== '') params.tag = filterTag;
            if (filterType != null && filterType !== '') params.type = filterType;
            if (filterStatus != null) {
                if (Array.isArray(filterStatus) && filterStatus.length > 0) {
                    params.status = filterStatus;
                } else if (typeof filterStatus === 'string' && filterStatus !== '') {
                    params.status = filterStatus;
                }
            }
            const kw = keyword !== undefined ? keyword : searchKeyword;
            if (kw.trim() !== '') params.keyword = kw.trim();

            fetchData({
                url: '/feedback/list',
                method: 'GET',
                data: params,
                setData: (r: { list?: FeedbackListItemDto[]; total?: number }) => {
                    setTickets(r?.list ?? []);
                    setTotal(r?.total ?? 0);
                },
            }).finally(() => {
                setSpinning(false);
            });
        },
        [pageSize, filterTag, filterType, filterStatus, sortBy, order, searchKeyword]
    );

    // 筛选条件变化时自动刷新列表
    useEffect(() => {
        if (openidQueried) return;
        setPage(1);
        loadList(1);
    }, [filterTag, filterType, filterStatus, sortBy, order, openidQueried, loadList]);

    // 搜索关键词防抖：输入后 300ms 请求服务端搜索全部，并回到第 1 页（跳过首次挂载避免重复请求）
    const searchEffectFirstRun = useRef(true);
    useEffect(() => {
        if (openidQueried) return;
        if (searchEffectFirstRun.current) {
            searchEffectFirstRun.current = false;
            return;
        }
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            searchDebounceRef.current = null;
            setPage(1);
            loadList(1, searchKeyword);
        }, 300);
        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
    }, [searchKeyword]);

    // 按 OpenID 查询订阅
    const handleQuerySubscriptionsByOpenid = useCallback(() => {
        const openid = openidInput.trim();
        if (!openid) return;
        setLoadingSubscriptions(true);
        setSubscriptionsByOpenid(null);
        setOpenidQueried(openid);
        setOpenidQueryModalVisible(false);
        fetchData({
            url: '/feedback/subscriptions/by-openid',
            method: 'GET',
            data: { openid },
            setData: (r: { list?: FeedbackListItemDto[] }) => {
                setSubscriptionsByOpenid(r?.list ?? []);
            },
        }).finally(() => setLoadingSubscriptions(false));
    }, [openidInput]);

    // 退出 OpenID 查询模式，回到普通列表
    const handleBackToList = useCallback(() => {
        setOpenidQueried(null);
        setSubscriptionsByOpenid(null);
        setOpenidInput('');
        setPage(1);
        loadList(1);
    }, [loadList]);

    // 从列表移除反馈
    const handleRemoveFromFeedback = useCallback(
        async (tidToRemove: number) => {
            await fetchData({
                url: '/feedback/remove',
                method: 'POST',
                data: { tid: tidToRemove },
                setData: () => {},
            });
            setTickets(prev => prev.filter(t => t.tid !== tidToRemove));
            // 如果当前正在查看被移除的反馈，跳回反馈管理首页
            if (currentTid && Number(currentTid) === tidToRemove) {
                navigate('/feedback');
            }
            getGlobalMessageApi()?.success(gLang('feedback.removeFromListSuccess'));
        },
        [currentTid, navigate]
    );

    // 更新本地列表的标签
    const handleTagUpdate = useCallback((updatedTid: number, tag: string) => {
        setTickets(prev => prev.map(t => (t.tid === updatedTid ? { ...t, tag } : t)));
    }, []);

    // 更新本地列表的类型
    const handleTypeUpdate = useCallback(
        (updatedTid: number, feedbackType: 'SUGGESTION' | 'BUG') => {
            setTickets(prev => prev.map(t => (t.tid === updatedTid ? { ...t, feedbackType } : t)));
        },
        []
    );

    return (
        <Watermark
            content={user?.openid}
            font={{ color: 'rgba(0,0,0,.05)' }}
            gap={[10, 10]}
            style={{ display: 'flex', flex: 1, overflow: 'visible' }}
        >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {/* 顶部标题栏 */}
                <Flex align="start" justify="space-between">
                    <Title level={4} style={{ margin: 0 }}>
                        {gLang('feedback.manageTitle')}
                    </Title>
                    <Link to="/">
                        <Tooltip title={gLang('dashboard.admin')}>
                            <Button
                                type="text"
                                icon={<HomeOutlined />}
                                style={{ height: 28, width: 28 }}
                            />
                        </Tooltip>
                    </Link>
                </Flex>

                {/* 操作按钮：新建（小号）+ OpenID查询 + 刷新 */}
                <Flex gap={6} align="center">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => setCreateFeedbackModalVisible(true)}
                    >
                        {gLang('feedback.createFeedback')}
                    </Button>
                    <div style={{ flex: 1 }} />
                    <Tooltip title={gLang('feedbackManage.queryByOpenid')}>
                        <Button
                            icon={<UserOutlined />}
                            size="small"
                            onClick={() => setOpenidQueryModalVisible(true)}
                        />
                    </Tooltip>
                    <Tooltip title={gLang('admin.feedbackRefresh')}>
                        <Button
                            icon={<ReloadOutlined />}
                            size="small"
                            loading={spinning}
                            onClick={() => {
                                if (openidQueried) {
                                    handleBackToList();
                                } else {
                                    loadList(page);
                                }
                            }}
                        />
                    </Tooltip>
                </Flex>

                {/* OpenID 查询模式提示 */}
                {openidQueried && (
                    <Flex align="center" gap={8} wrap="wrap">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {gLang('feedbackManage.showingSubscriptionsFor')}: {openidQueried}
                        </Text>
                        <Button size="small" onClick={handleBackToList}>
                            {gLang('feedbackManage.backToList')}
                        </Button>
                    </Flex>
                )}

                {/* 搜索框 */}
                <Input
                    placeholder={gLang('feedback.searchPlaceholder')}
                    prefix={<SearchOutlined />}
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    allowClear
                    size="small"
                />

                {/* 排序 + 高级筛选按钮（常驻，参考 TicketQuery 风格） */}
                {!openidQueried && (
                    <Flex gap={6} wrap="wrap">
                        <Select
                            value={`${sortBy}_${order}`}
                            onChange={(v: string) => {
                                const [sb, od] = v.split('_');
                                setSortBy(sb as FeedbackSortBy);
                                setOrder(od as FeedbackOrder);
                            }}
                            style={{ flex: 1, minWidth: 0 }}
                            size="small"
                            prefix={<SortAscendingOutlined />}
                            options={[
                                {
                                    value: 'lastReplyTime_desc',
                                    label: gLang('feedback.sortLastReplyTime') + ' ↓',
                                },
                                {
                                    value: 'lastReplyTime_asc',
                                    label: gLang('feedback.sortLastReplyTime') + ' ↑',
                                },
                                {
                                    value: 'createTime_desc',
                                    label: gLang('feedback.sortCreateTime') + ' ↓',
                                },
                                {
                                    value: 'createTime_asc',
                                    label: gLang('feedback.sortCreateTime') + ' ↑',
                                },
                                { value: 'heat_desc', label: gLang('feedback.sortHeat') + ' ↓' },
                                { value: 'heat_asc', label: gLang('feedback.sortHeat') + ' ↑' },
                            ]}
                        />
                        <Button
                            type="link"
                            size="small"
                            onClick={() => setAdvancedOpen(o => !o)}
                            icon={advancedOpen ? <UpOutlined /> : <DownOutlined />}
                            style={{ paddingInline: 4 }}
                        >
                            {gLang('admin.feedbackAdvancedFilter')}
                        </Button>
                    </Flex>
                )}

                {/* 高级筛选折叠面板（类型、状态、标签） */}
                {!openidQueried && advancedOpen && (
                    <div
                        style={{
                            padding: '10px 12px',
                            background: token.colorBgContainer,
                            borderRadius: token.borderRadiusLG,
                            border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                    >
                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            {/* 类型 */}
                            <Flex gap={6} align="center" wrap="wrap">
                                <Text
                                    type="secondary"
                                    style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                                >
                                    {gLang('feedback.filterType')}
                                </Text>
                                <Select
                                    size="small"
                                    style={{ flex: 1, minWidth: 80 }}
                                    value={filterType ?? ''}
                                    onChange={v => setFilterType(v === '' ? undefined : v)}
                                    options={[
                                        { value: '', label: gLang('feedback.typeAll') },
                                        {
                                            value: 'SUGGESTION',
                                            label: gLang('feedback.typeSuggestion'),
                                        },
                                        { value: 'BUG', label: gLang('feedback.typeBug') },
                                    ]}
                                />
                            </Flex>

                            {/* 状态 */}
                            <Flex gap={6} align="center" wrap="wrap">
                                <Text
                                    type="secondary"
                                    style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                                >
                                    {gLang('feedback.filterStatus')}
                                </Text>
                                <Select
                                    size="small"
                                    style={{ flex: 1, minWidth: 80 }}
                                    value={
                                        Array.isArray(filterStatus) && filterStatus.length === 1
                                            ? filterStatus[0]
                                            : ''
                                    }
                                    onChange={v => setFilterStatus(v === '' ? [] : [v])}
                                    options={[
                                        { value: '', label: gLang('feedback.allStatus') },
                                        {
                                            value: FeedbackStatus.Open,
                                            label: gLang('feedback.status.open'),
                                        },
                                        {
                                            value: FeedbackStatus.Closed,
                                            label: gLang('feedback.status.closed'),
                                        },
                                        {
                                            value: FeedbackStatus.Ended,
                                            label: gLang('feedback.status.ended'),
                                        },
                                    ]}
                                />
                            </Flex>

                            {/* 标签 */}
                            <Flex gap={6} align="center">
                                <Text
                                    type="secondary"
                                    style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                                >
                                    {gLang('feedback.tag')}
                                </Text>
                                <Input
                                    size="small"
                                    style={{ flex: 1 }}
                                    placeholder={gLang('feedback.tagPlaceholder')}
                                    value={filterTag ?? ''}
                                    onChange={e => setFilterTag(e.target.value || undefined)}
                                    allowClear
                                />
                            </Flex>
                        </Space>
                    </div>
                )}

                {/* 反馈列表 */}
                {spinning || loadingSubscriptions ? (
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        {[1, 2, 3, 4, 5].map((_, index) => (
                            <Skeleton
                                key={index}
                                title
                                paragraph={{ rows: 3 }}
                                active
                                style={{ width: '100%' }}
                            />
                        ))}
                    </Space>
                ) : (tickets ?? []).length > 0 ? (
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        {(tickets ?? []).map(ticket => (
                            <FeedbackListItem
                                key={ticket.tid}
                                ticket={ticket}
                                // 复用现有工单操作页，右侧渲染 TicketOperate
                                to={`/ticket/operate/backToMy/${ticket.tid}`}
                                selected={currentTid === ticket.tid.toString()}
                                highlightColor={token.colorPrimary}
                                onRemove={openidQueried ? undefined : handleRemoveFromFeedback}
                                onTagUpdate={openidQueried ? undefined : handleTagUpdate}
                                onTypeUpdate={openidQueried ? undefined : handleTypeUpdate}
                            />
                        ))}
                    </Space>
                ) : (
                    <Flex
                        vertical
                        align="center"
                        justify="center"
                        style={{
                            padding: '40px 0',
                            color: isDarkMode ? '#8c8c8c' : '#8c8c8c',
                        }}
                    >
                        <MessageOutlined style={{ fontSize: 32, opacity: 0.4, marginBottom: 8 }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {gLang('feedback.noFeedback')}
                        </Text>
                    </Flex>
                )}

                {/* 分页（简洁模式） */}
                {!openidQueried && total > pageSize && (
                    <Flex justify="center" style={{ paddingBottom: 16 }}>
                        <Pagination
                            simple
                            current={page}
                            pageSize={pageSize}
                            total={total}
                            onChange={newPage => {
                                setPage(newPage);
                                loadList(newPage);
                            }}
                            size="small"
                        />
                    </Flex>
                )}
            </Space>

            {/* 创建反馈 Modal */}
            <CreateFeedbackModal
                open={createFeedbackModalVisible}
                onClose={() => {
                    setCreateFeedbackModalVisible(false);
                    loadList(1);
                }}
            />

            {/* OpenID 查询 Modal */}
            <Modal
                title={gLang('feedbackManage.queryByOpenid')}
                open={openidQueryModalVisible}
                onOk={handleQuerySubscriptionsByOpenid}
                onCancel={() => {
                    setOpenidQueryModalVisible(false);
                    setOpenidInput('');
                }}
                okText={gLang('feedbackManage.querySubscriptions')}
                cancelText={gLang('common.cancel')}
                confirmLoading={loadingSubscriptions}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Text type="secondary">
                        {gLang('feedbackManage.querySubscriptionsByOpenidDesc')}
                    </Text>
                    <Input
                        placeholder={gLang('feedbackManage.querySubscriptionsByOpenid')}
                        prefix={<UserOutlined />}
                        value={openidInput}
                        onChange={e => setOpenidInput(e.target.value)}
                        allowClear
                        onPressEnter={handleQuerySubscriptionsByOpenid}
                    />
                </Space>
            </Modal>
        </Watermark>
    );
};

export default FeedbackPCSidebar;

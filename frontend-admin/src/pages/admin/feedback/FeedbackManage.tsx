// 反馈管理页面（手机端）- 排序常驻，其他筛选折叠

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Button,
    Flex,
    Input,
    Modal,
    Pagination,
    Select,
    Skeleton,
    Space,
    Typography,
    theme,
} from 'antd';
import {
    ArrowLeftOutlined,
    DownOutlined,
    MessageOutlined,
    PlusOutlined,
    SearchOutlined,
    SortAscendingOutlined,
    UpOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { gLang } from '@common/language';
import { FeedbackListItemDto, TicketStatus } from '@ecuc/shared/types/ticket.types';
import { fetchData } from '@common/axiosConfig';
import { getGlobalMessageApi } from '@common/utils/messageApiHolder';
import FeedbackListItem from './components/FeedbackListItem';
import CreateFeedbackModal from './CreateFeedbackModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useFeedbackFilters } from '@common/hooks/useFeedbackFilters';
import type { FeedbackSortBy, FeedbackOrder } from '@common/hooks/useFeedbackFilters';
import { FeedbackListLayout } from '@common/components/FeedbackListLayout';

// 反馈状态映射
export enum FeedbackStatus {
    /** 开启 */
    Open = 'open',
    /** 关闭 */
    Closed = 'closed',
    /** 结束 */
    Ended = 'ended',
}

// 反馈状态显示文本
export const getFeedbackStatusText = (status: FeedbackStatus): string => {
    switch (status) {
        case FeedbackStatus.Open:
            return gLang('feedback.status.open');
        case FeedbackStatus.Closed:
            return gLang('feedback.status.closed');
        case FeedbackStatus.Ended:
            return gLang('feedback.status.ended');
        default:
            return '';
    }
};

// 反馈状态颜色
export const getFeedbackStatusColor = (status: FeedbackStatus): string => {
    switch (status) {
        case FeedbackStatus.Open:
            return 'blue';
        case FeedbackStatus.Closed:
            return 'red';
        case FeedbackStatus.Ended:
            return 'green';
        default:
            return 'default';
    }
};

// 将 TicketStatus 映射为 FeedbackStatus（详情页状态展示用）
export const ticketStatusToFeedbackStatus = (status: TicketStatus): FeedbackStatus => {
    if (
        status === TicketStatus.WaitingAssign ||
        status === TicketStatus.WaitingReply ||
        status === TicketStatus.WaitingStaffReply ||
        status === TicketStatus.Entrust
    )
        return FeedbackStatus.Open;
    if (
        status === TicketStatus.AutoReject ||
        status === TicketStatus.Reject ||
        status === TicketStatus.UserCancel
    )
        return FeedbackStatus.Closed;
    if (status === TicketStatus.AutoAccept || status === TicketStatus.Accept)
        return FeedbackStatus.Ended;
    return FeedbackStatus.Open;
};

const FeedbackManage: React.FC = () => {
    const { tid } = useParams();
    const navigate = useNavigate();
    const { useToken } = theme;
    const { token } = useToken();

    // 高级筛选折叠状态
    const [advancedOpen, setAdvancedOpen] = useState(false);

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

    const [spinning, setSpinning] = useState(false);
    const [tickets, setTickets] = useState<FeedbackListItemDto[]>([]);
    const [total, setTotal] = useState(0);
    const [createFeedbackModalVisible, setCreateFeedbackModalVisible] = useState(false);
    const [openidQueryModalVisible, setOpenidQueryModalVisible] = useState(false);
    const [openidInput, setOpenidInput] = useState('');
    const [, setSubscriptionsByOpenid] = useState<FeedbackListItemDto[] | null>(null);
    const [openidQueried, setOpenidQueried] = useState<string | null>(null);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 服务端关键词搜索：keyword 传给 API，分页用接口返回的 total。keyword 可选，不传时用当前 searchKeyword
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

    const handleBackToList = useCallback(() => {
        setOpenidQueried(null);
        setSubscriptionsByOpenid(null);
        setOpenidInput('');
        setOpenidQueryModalVisible(false);
        setPage(1);
        loadList(1);
    }, [loadList]);

    const handleRemoveFromFeedback = useCallback(async (tidToRemove: number) => {
        await fetchData({
            url: '/feedback/remove',
            method: 'POST',
            data: { tid: tidToRemove },
            setData: () => {},
        });
        setTickets(prev => prev.filter(t => t.tid !== tidToRemove));
        getGlobalMessageApi()?.success(gLang('feedback.removeFromListSuccess'));
    }, []);

    const handleTagUpdate = useCallback((updatedTid: number, tag: string) => {
        setTickets(prev => prev.map(t => (t.tid === updatedTid ? { ...t, tag } : t)));
    }, []);

    const handleTypeUpdate = useCallback(
        (updatedTid: number, feedbackType: 'SUGGESTION' | 'BUG') => {
            setTickets(prev => prev.map(t => (t.tid === updatedTid ? { ...t, feedbackType } : t)));
        },
        []
    );

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* 顶部栏：返回 + 标题 + 新建 + OpenID查询 */}
            <Flex align="center" gap={8}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} />
                <Typography.Title level={4} style={{ margin: 0, flex: 1 }}>
                    {gLang('feedback.manageTitle')}
                </Typography.Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() => setCreateFeedbackModalVisible(true)}
                >
                    {gLang('feedback.createFeedback')}
                </Button>
                <Button
                    icon={<UserOutlined />}
                    size="small"
                    onClick={() => setOpenidQueryModalVisible(true)}
                />
            </Flex>

            {/* OpenID 查询模式提示 */}
            {openidQueried && (
                <Flex align="center" gap={8} wrap="wrap">
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {gLang('feedbackManage.showingSubscriptionsFor')}: {openidQueried}
                    </Typography.Text>
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
            />

            {/* 排序（常驻）+ 高级筛选按钮 */}
            {!openidQueried && (
                <Flex gap={8} align="center">
                    <Select
                        value={`${sortBy}_${order}`}
                        onChange={(v: string) => {
                            const [sb, od] = v.split('_');
                            setSortBy(sb as FeedbackSortBy);
                            setOrder(od as FeedbackOrder);
                        }}
                        style={{ flex: 1 }}
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
                        padding: '12px 14px',
                        background: token.colorBgContainer,
                        borderRadius: token.borderRadiusLG,
                        border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        {/* 类型 */}
                        <Flex gap={8} align="center">
                            <Typography.Text
                                type="secondary"
                                style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                            >
                                {gLang('feedback.filterType')}
                            </Typography.Text>
                            <Select
                                style={{ flex: 1 }}
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
                        <Flex gap={8} align="center">
                            <Typography.Text
                                type="secondary"
                                style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                            >
                                {gLang('feedback.filterStatus')}
                            </Typography.Text>
                            <Select
                                style={{ flex: 1 }}
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
                        <Flex gap={8} align="center">
                            <Typography.Text
                                type="secondary"
                                style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                            >
                                {gLang('feedback.tag')}
                            </Typography.Text>
                            <Input
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
                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
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
                <>
                    <FeedbackListLayout
                        items={tickets ?? []}
                        renderItem={ticket => (
                            <FeedbackListItem
                                key={ticket.tid}
                                ticket={ticket}
                                to={`/ticket/operate/backToMy/${ticket.tid}`}
                                selected={tid?.toString() === ticket.tid.toString()}
                                highlightColor={token.colorPrimary}
                                onRemove={openidQueried ? undefined : handleRemoveFromFeedback}
                                onTagUpdate={openidQueried ? undefined : handleTagUpdate}
                                onTypeUpdate={openidQueried ? undefined : handleTypeUpdate}
                            />
                        )}
                        gap={12}
                        enableAnimation={false}
                    />

                    {/* 分页 */}
                    {!openidQueried && total > pageSize && (
                        <Flex justify="center" style={{ marginTop: 8 }}>
                            <Pagination
                                current={page}
                                pageSize={pageSize}
                                total={total}
                                onChange={newPage => {
                                    setPage(newPage);
                                    loadList(newPage);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                showTotal={t => gLang('admin.feedbackTotalCount', { t: String(t) })}
                                showSizeChanger={false}
                                responsive
                            />
                        </Flex>
                    )}
                </>
            ) : (
                <Flex
                    vertical
                    align="center"
                    justify="center"
                    style={{
                        padding: '80px 20px',
                        gap: 16,
                        opacity: 0.5,
                    }}
                >
                    <MessageOutlined style={{ fontSize: 48 }} />
                    <Typography.Text style={{ fontSize: 15 }}>
                        {gLang('feedback.noFeedback')}
                    </Typography.Text>
                </Flex>
            )}

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
                    <Typography.Text type="secondary">
                        {gLang('feedbackManage.querySubscriptionsByOpenidDesc')}
                    </Typography.Text>
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
        </Space>
    );
};

export default FeedbackManage;

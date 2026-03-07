// 反馈中心Card组件 - 用于JY工单处理

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
    Card,
    Button,
    Space,
    message,
    Switch,
    Form,
    Input,
    Collapse,
    Tabs,
    Skeleton,
    Tag,
    Typography,
    theme,
    Flex,
    Spin,
    Empty,
    Grid,
} from 'antd';
import {
    MessageOutlined,
    PlusOutlined,
    RobotOutlined,
    UserAddOutlined,
    CrownOutlined,
    SearchOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { fetchData } from '@common/axiosConfig';
import {
    Ticket,
    TicketDetail,
    TicketAction,
    FeedbackListItemDto,
} from '@ecuc/shared/types/ticket.types';
import { gLang } from '@common/language';
import useDarkMode from '@common/hooks/useDarkMode';
import MarkdownEditor from '@common/components/MarkdownEditor/MarkdownEditor';
import { convertUTCToFormat } from '@common/components/TimeConverter';
import { ltransTicketStatusColor, ltransTicketStatusForUser } from '@common/languageTrans';

const { useBreakpoint } = Grid;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Text } = Typography;

// 回复内容区表格/代码块/删除线样式（仅支持 Markdown 解析后的 HTML）
const FEEDBACK_REPLY_CONTENT_STYLE = `
.feedback-reply-content table { border-collapse: collapse; width: 100%; margin: 8px 0; }
.feedback-reply-content th, .feedback-reply-content td { border: 1px solid #d9d9d9; padding: 6px 8px; text-align: left; }
.feedback-reply-content th { background: rgba(0,0,0,0.02); font-weight: 600; }
.feedback-reply-content pre { margin: 8px 0; padding: 12px; overflow-x: auto; background: rgba(0,0,0,0.04); border-radius: 6px; border: 1px solid #f0f0f0; }
.feedback-reply-content pre code { padding: 0; background: transparent; }
.feedback-reply-content code { font-family: monospace; font-size: 13px; background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; }
.feedback-reply-content pre code { background: transparent; padding: 0; }
.feedback-reply-content del { text-decoration: line-through; }
[data-theme="dark"] .feedback-reply-content th, [data-theme="dark"] .feedback-reply-content td { border-color: #434343; }
[data-theme="dark"] .feedback-reply-content th { background: rgba(255,255,255,0.04); }
[data-theme="dark"] .feedback-reply-content pre { background: rgba(0,0,0,0.25); border-color: #303030; }
[data-theme="dark"] .feedback-reply-content code { background: rgba(255,255,255,0.08); }
[data-theme="dark"] .feedback-reply-content pre code { background: transparent; }
`;

interface FeedbackCenterCardProps {
    ticket?: Ticket;
    onRefresh?: () => void;
    /** When true and ticket has no AI_MATCH, still render card with manual-open + create tabs (e.g. from card nav on non-JY ticket) */
    forceShowWithoutMatch?: boolean;
}

interface MatchedFeedback {
    tid: number;
    title: string;
    similarity: number;
}

export const FeedbackCenterCard: React.FC<FeedbackCenterCardProps> = ({
    ticket,
    onRefresh,
    forceShowWithoutMatch,
}) => {
    const { useToken } = theme;
    const { token } = useToken();
    const isDarkMode = useDarkMode();
    const screens = useBreakpoint();
    const isMobile = !screens?.md;
    const [loading, setLoading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [rematchLoading, setRematchLoading] = useState(false);
    const [form] = Form.useForm();
    const [subscribingTids, setSubscribingTids] = useState<Set<number>>(new Set());
    const [previewTickets, setPreviewTickets] = useState<Map<number, Ticket>>(new Map());
    // 手动打开反馈：已加入 card 的 tid 列表
    const [manualOpenTids, setManualOpenTids] = useState<number[]>([]);
    // 手动打开反馈 tab 内的列表数据（与 /feedback/manage 同源 GET /feedback/list，无管理按钮）
    const [feedbackListItems, setFeedbackListItems] = useState<FeedbackListItemDto[]>([]);
    const [feedbackListTotal, setFeedbackListTotal] = useState(0);
    const [feedbackListSpinning, setFeedbackListSpinning] = useState(false);
    const [feedbackListPage, setFeedbackListPage] = useState(1);
    const [feedbackListLoadingMore, setFeedbackListLoadingMore] = useState(false);
    const feedbackListPageSize = 20;
    const feedbackListHasMore = feedbackListPage * feedbackListPageSize < feedbackListTotal;
    const [feedbackSearchKeyword, setFeedbackSearchKeyword] = useState('');
    const [feedbackListStatus, setFeedbackListStatus] = useState<string[]>([]);
    // 当前选中的 tab（受控），null 表示使用默认
    const [activeTabKey, setActiveTabKey] = useState<string | null>(null);

    const [messageApi, contextHolder] = message.useMessage();

    // 检测是否存在AI_MATCH的内容（取最新一条）
    const aiMatchDetail = useMemo(() => {
        if (!ticket?.details) return null;
        const matches = ticket.details.filter(
            (detail: TicketDetail) => detail.operator === 'AI_MATCH' && detail.action === 'N'
        );
        return matches.length > 0 ? matches[matches.length - 1] : null;
    }, [ticket?.details]);

    // 解析匹配的反馈工单列表
    const matchedFeedbacks = useMemo(() => {
        if (!aiMatchDetail?.content) return [];

        // 解析格式：TID#4: 反馈: 超级战墙303职业技能bug导致游戏体验严重受损 (相似度: 95%)
        const lines = aiMatchDetail.content.split('\n');
        const matches: MatchedFeedback[] = [];

        for (const line of lines) {
            const match = line.match(/TID#(\d+):\s*(.+?)\s*\(相似度:\s*(\d+)%\)/);
            if (match) {
                matches.push({
                    tid: parseInt(match[1]),
                    title: match[2].trim(),
                    similarity: parseInt(match[3]),
                });
            }
        }

        return matches;
    }, [aiMatchDetail]);

    // 获取AI生成的内容（如果存在）
    const [, setAiTitle] = useState<string>('');
    const [, setAiDetails] = useState<string>('');
    const [hasAiContent, setHasAiContent] = useState(false);
    const [createdFeedbackTid, setCreatedFeedbackTid] = useState<number | null>(null);
    const [subscribedFeedbackTid, setSubscribedFeedbackTid] = useState<number | null>(null);

    // 使用ref跟踪已加载的tid，避免useCallback依赖previewTickets
    const loadedTidsRef = useRef<Set<number>>(new Set());

    // 加载工单详情用于预览
    const loadTicketPreview = useCallback(async (tid: number) => {
        if (loadedTidsRef.current.has(tid)) {
            return; // 已经加载过
        }

        await fetchData({
            url: `/ticket/detail`,
            method: 'GET',
            data: { tid },
            setData: (response: any) => {
                // 处理epfResponse格式：{ code: 0, data: Ticket }
                const ticketData = response?.data || response;
                if (ticketData) {
                    loadedTidsRef.current.add(tid);
                    setPreviewTickets(prev => {
                        if (prev.has(tid)) return prev; // 避免重复设置
                        return new Map(prev).set(tid, ticketData);
                    });
                }
            },
        });
    }, []);

    // 与服务端一致：keyword 传后端搜索，不再在前端对当前页做过滤，否则只能看到当前页中的匹配条数
    const queryFeedbackList = useCallback(
        (pageNum: number, append: boolean, keyword?: string) => {
            setFeedbackListSpinning(pageNum === 1 && !append);
            setFeedbackListLoadingMore(append && pageNum > 1);
            const params: Record<string, string | number | string[]> = {
                page: String(pageNum),
                pageSize: String(feedbackListPageSize),
                sortBy: 'createTime',
                order: 'desc',
            };
            if (feedbackListStatus.length > 0) params.status = feedbackListStatus;
            const kw = keyword !== undefined ? keyword : feedbackSearchKeyword.trim() || undefined;
            if (kw != null && kw !== '') params.keyword = kw;
            fetchData({
                url: '/feedback/list',
                method: 'GET',
                data: params,
                setData: (r: { list?: FeedbackListItemDto[]; total?: number }) => {
                    const list = r?.list ?? [];
                    const total = r?.total ?? 0;
                    if (append) setFeedbackListItems(prev => [...prev, ...list]);
                    else setFeedbackListItems(list);
                    setFeedbackListTotal(total);
                },
            }).then(() => {
                setFeedbackListSpinning(false);
                setFeedbackListLoadingMore(false);
                if (!append) setFeedbackListPage(2);
            });
        },
        [feedbackListStatus, feedbackSearchKeyword]
    );

    // 仅筛选状态变化时刷新列表（不依赖 keyword，避免每次输入都请求）
    useEffect(() => {
        setFeedbackListPage(1);
        queryFeedbackList(1, false);
    }, [feedbackListStatus]);

    // 关键词防抖 300ms 后请求服务端搜索（跳过首次挂载，避免与上面 effect 重复）
    const feedbackSearchFirstRun = useRef(true);
    const feedbackSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (feedbackSearchFirstRun.current) {
            feedbackSearchFirstRun.current = false;
            return;
        }
        if (feedbackSearchDebounceRef.current) clearTimeout(feedbackSearchDebounceRef.current);
        feedbackSearchDebounceRef.current = setTimeout(() => {
            feedbackSearchDebounceRef.current = null;
            setFeedbackListPage(1);
            queryFeedbackList(1, false, feedbackSearchKeyword.trim() || undefined);
        }, 300);
        return () => {
            if (feedbackSearchDebounceRef.current) clearTimeout(feedbackSearchDebounceRef.current);
        };
    }, [feedbackSearchKeyword, queryFeedbackList]);

    // 组件加载时，自动加载第一个匹配工单的详情
    useEffect(() => {
        if (matchedFeedbacks.length > 0 && !loadedTidsRef.current.has(matchedFeedbacks[0].tid)) {
            loadTicketPreview(matchedFeedbacks[0].tid);
        }
    }, [matchedFeedbacks.length > 0 ? matchedFeedbacks[0].tid : null, loadTicketPreview]);

    // 如果没有AI_MATCH内容，且非强制展示（如从卡片导航在非JY工单打开），则不显示此Card
    // 注意：必须在所有hooks之后进行早期返回
    if (!aiMatchDetail && !forceShowWithoutMatch) {
        return null;
    }

    // 当切换到标签页时加载工单详情
    const handleTabChange = (activeKey: string) => {
        if (activeKey.startsWith('match-')) {
            const tid = parseInt(activeKey.replace('match-', ''));
            if (!isNaN(tid)) loadTicketPreview(tid);
        } else if (activeKey.startsWith('manual-') && activeKey !== 'manual-picker') {
            const tid = parseInt(activeKey.replace('manual-', ''));
            if (!isNaN(tid)) loadTicketPreview(tid);
        }
    };

    // 反馈状态选项（与 manage 一致）

    const handleAddManualTab = (item: FeedbackListItemDto) => {
        const tid = item.tid;
        if (manualOpenTids.includes(tid)) {
            setActiveTabKey(`manual-${tid}`);
            return;
        }
        const alreadyMatched = matchedFeedbacks.some(m => m.tid === tid);
        if (alreadyMatched) {
            setActiveTabKey(`match-${tid}`);
            return;
        }
        setManualOpenTids(prev => [...prev, tid]);
        loadTicketPreview(tid);
        setActiveTabKey(`manual-${tid}`);
    };

    // AI总结并生成反馈
    const handleAIGenerate = async () => {
        if (!ticket) return;

        setAiGenerating(true);
        try {
            // 调用专门的AI生成反馈接口
            await fetchData({
                url: `/feedback/ai-generate`,
                method: 'GET',
                data: { tid: ticket.tid },
                setData: (response: any) => {
                    // 处理epfResponse格式：{ code: 0, data: { title, details } }
                    const data = response?.data || response;
                    if (data?.title && data?.details) {
                        setAiTitle(data.title);
                        setAiDetails(data.details);
                        setHasAiContent(true);

                        // 设置表单默认值
                        form.setFieldsValue({
                            title: data.title,
                            details: data.details,
                            isPublic: true,
                            subscriptions: ticket.creator_openid || '',
                        });

                        messageApi.success(gLang('feedback.aiGenerateComplete'));
                    }
                },
            });
        } catch {
            messageApi.error(gLang('feedback.aiGenerateFailed'));
        } finally {
            setAiGenerating(false);
        }
    };

    // 重新进行 AI 匹配并刷新卡片
    const handleRematchAi = async () => {
        if (!ticket?.tid || !onRefresh) return;
        setRematchLoading(true);
        try {
            await fetchData({
                url: `/ticket/jyRematch?tid=${ticket.tid}`,
                method: 'POST',
                data: {},
                setData: () => {
                    messageApi.success(gLang('feedback.rematchAiSuccess'));
                    onRefresh();
                },
            });
        } catch {
            messageApi.error(gLang('feedback.rematchAiFailed'));
        } finally {
            setRematchLoading(false);
        }
    };

    // 订阅反馈（为当前工单创建者订阅）
    const handleSubscribe = async (feedbackTid: number) => {
        if (!ticket?.creator_openid) {
            messageApi.warning(gLang('feedback.cannotGetUserInfo'));
            return;
        }

        setSubscribingTids(prev => new Set(prev).add(feedbackTid));

        try {
            await fetchData({
                url: '/feedback/subscribe-for-user',
                method: 'POST',
                data: {
                    tid: feedbackTid,
                    targetOpenid: ticket.creator_openid,
                    sourceTid: ticket.tid, // 传递源工单ID，用于写入detail
                },
                setData: () => {
                    setSubscribedFeedbackTid(feedbackTid);
                    messageApi.success(gLang('feedback.subscriptionSuccess'));
                    // 刷新工单详情以显示新写入的detail
                    if (onRefresh) {
                        onRefresh();
                    }
                },
            });
        } catch {
            messageApi.error(gLang('feedback.subscriptionFailed'));
        } finally {
            setSubscribingTids(prev => {
                const next = new Set(prev);
                next.delete(feedbackTid);
                return next;
            });
        }
    };

    // 加入反馈中心
    const handleCreateFeedback = async () => {
        if (!hasAiContent || !ticket) {
            messageApi.warning(gLang('feedback.pleaseUseAIGenerateFirst'));
            return;
        }

        try {
            // 先验证表单
            const values = await form.validateFields();

            setLoading(true);

            // 解析订阅列表
            const subscriptionsList: string[] = values.subscriptions
                ? values.subscriptions
                      .split('\n')
                      .map((line: string) => line.trim())
                      .filter((line: string) => line.length > 0)
                : [];

            // 使用新接口创建反馈（从工单创建）
            await fetchData({
                url: '/feedback/create-from-ticket',
                method: 'POST',
                data: {
                    sourceTid: ticket.tid,
                    title: values.title,
                    details: values.details,
                    isPublic: values.isPublic ?? true,
                    subscriptions: subscriptionsList,
                },
                setData: (response: { tid: number; title: string }) => {
                    if (response?.tid) {
                        setCreatedFeedbackTid(response.tid);
                        messageApi.success(
                            gLang('feedback.createSuccessWithTid', { tid: response.tid })
                        );
                    }
                },
            });

            // 重置表单和状态
            form.resetFields();
            setHasAiContent(false);
            setAiTitle('');
            setAiDetails('');

            // 刷新工单详情（会自动显示新创建的回复）
            if (onRefresh) {
                await onRefresh();
            }
        } catch (error: any) {
            // 如果是表单验证错误，不显示"创建反馈失败"
            if (error?.errorFields) {
                messageApi.error(gLang('feedback.pleaseCheckFormInput'));
                return;
            }
            messageApi.error(gLang('feedback.createFeedbackFailed'));
        } finally {
            setLoading(false);
        }
    };

    // 新建反馈标签页内容
    const renderCreateTab = () => (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* AI生成按钮 */}
            {!hasAiContent && (
                <Button
                    type="default"
                    icon={<RobotOutlined />}
                    onClick={handleAIGenerate}
                    loading={aiGenerating}
                >
                    {gLang('feedback.aiGenerateFeedback')}
                </Button>
            )}

            {/* AI生成的内容 */}
            {hasAiContent && (
                <Collapse defaultActiveKey={['1']}>
                    <Panel header={gLang('feedback.aiGeneratedContent')} key="1">
                        <Form
                            form={form}
                            layout="vertical"
                            initialValues={{
                                isPublic: true,
                                subscriptions: ticket?.creator_openid || '',
                            }}
                        >
                            <Form.Item
                                name="title"
                                label={gLang('feedback.formTitle')}
                                rules={[
                                    { required: true, message: gLang('feedback.titleRequired') },
                                    { max: 100, message: gLang('feedback.titleMaxLength') },
                                ]}
                            >
                                <Input placeholder={gLang('feedback.feedbackTitlePlaceholder')} />
                            </Form.Item>

                            <Form.Item
                                name="details"
                                label={gLang('feedback.replyMessage')}
                                rules={[
                                    { required: true, message: gLang('feedback.contentRequired') },
                                ]}
                            >
                                <MarkdownEditor
                                    placeholder={gLang('feedback.feedbackDetailsPlaceholder')}
                                    minRows={4}
                                    maxRows={12}
                                />
                            </Form.Item>

                            <Form.Item
                                name="isPublic"
                                label={gLang('feedback.isPublic')}
                                valuePropName="checked"
                            >
                                <Switch
                                    checkedChildren={gLang('feedback.public')}
                                    unCheckedChildren={gLang('feedback.private')}
                                />
                            </Form.Item>

                            <Form.Item
                                name="subscriptions"
                                label={gLang('feedback.subscriptions')}
                                help={gLang('feedback.subscriptionsHelp')}
                            >
                                <TextArea
                                    rows={3}
                                    placeholder={gLang('feedback.subscriptionsPlaceholder')}
                                />
                            </Form.Item>
                        </Form>
                    </Panel>
                </Collapse>
            )}

            {/* 创建成功提示 */}
            {createdFeedbackTid && (
                <div
                    style={{
                        padding: '8px 12px',
                        background: isDarkMode ? '#162312' : '#f6ffed',
                        border: `1px solid ${isDarkMode ? '#274916' : '#b7eb8f'}`,
                        borderRadius: '4px',
                        color: isDarkMode ? '#73d13d' : '#52c41a',
                    }}
                >
                    {gLang('feedback.createSuccessWithTid', { tid: createdFeedbackTid })}
                </div>
            )}

            {/* 加入反馈中心按钮 */}
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateFeedback}
                loading={loading}
                disabled={!hasAiContent}
            >
                {gLang('feedback.joinFeedbackCenter')}
            </Button>
        </Space>
    );

    // 简化的回复卡片组件（只看 operator，有 operator 即官方）
    const SimpleReplyCard: React.FC<{ detail: TicketDetail; floorNumber: number }> = ({
        detail,
        floorNumber,
    }) => {
        const hasOperator = !!detail.operator;
        return (
            <Card
                size="small"
                style={{
                    marginBottom: 8,
                    borderRadius: 4,
                    borderLeft: hasOperator ? `3px solid ${token.colorPrimary}` : undefined,
                    background: hasOperator ? (isDarkMode ? '#111a2c' : '#f0f7ff') : undefined,
                }}
                bodyStyle={{ padding: '12px' }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 8,
                    }}
                >
                    <Space wrap>
                        {hasOperator && (
                            <Tag
                                icon={<CrownOutlined />}
                                color={token.colorPrimary}
                                style={{ margin: 0 }}
                            >
                                {detail.operator}
                            </Tag>
                        )}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            #{floorNumber}
                            {gLang('feedback.floorSuffix')}
                        </Text>
                    </Space>
                    {detail.create_time && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {detail.create_time}
                        </Text>
                    )}
                </div>
                <div
                    style={{ lineHeight: 1.6, wordBreak: 'break-word' }}
                    className="feedback-reply-content"
                    {...(detail.contentHtml != null && detail.contentHtml !== ''
                        ? { dangerouslySetInnerHTML: { __html: detail.contentHtml } }
                        : {
                              children: (detail.content || '').split('\n').map((line, i) => (
                                  <React.Fragment key={i}>
                                      {line}
                                      {i < (detail.content || '').split('\n').length - 1 && <br />}
                                  </React.Fragment>
                              )),
                          })}
                ></div>
            </Card>
        );
    };

    // 匹配反馈标签页内容
    const renderMatchTab = (matched: MatchedFeedback) => {
        const previewTicket = previewTickets.get(matched.tid);

        return (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div
                    style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: `1px solid ${isDarkMode ? token.colorBorderSecondary : '#f0f0f0'}`,
                        borderRadius: '4px',
                        padding: '12px',
                        background: isDarkMode ? token.colorFillAlter : '#fafafa',
                    }}
                >
                    {previewTicket ? (
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                            {/* 工单标题 */}
                            <div
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    marginBottom: '8px',
                                    wordBreak: 'break-word',
                                    color: token.colorText,
                                }}
                            >
                                {previewTicket.title.replace(/^反馈:\s*/, '')}
                            </div>

                            {/* 工单详情列表 */}
                            {previewTicket.details && previewTicket.details.length > 0 ? (
                                previewTicket.details
                                    .filter(
                                        (detail: TicketDetail) =>
                                            detail.action === TicketAction.Reply
                                    )
                                    .slice(0, 3) // 只显示前3条回复
                                    .map((detail: TicketDetail, index: number) => (
                                        <SimpleReplyCard
                                            key={detail.id}
                                            detail={detail}
                                            floorNumber={index + 1}
                                        />
                                    ))
                            ) : (
                                <Text type="secondary">{gLang('feedback.noReplies')}</Text>
                            )}
                        </Space>
                    ) : (
                        <Skeleton active />
                    )}
                </div>

                {/* 订阅成功提示 */}
                {subscribedFeedbackTid === matched.tid && (
                    <div
                        style={{
                            padding: '8px 12px',
                            background: isDarkMode ? '#162312' : '#f6ffed',
                            border: `1px solid ${isDarkMode ? '#274916' : '#b7eb8f'}`,
                            borderRadius: '4px',
                            color: isDarkMode ? '#73d13d' : '#52c41a',
                        }}
                    >
                        {gLang('feedback.subscriptionSuccess')}
                    </div>
                )}

                <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => handleSubscribe(matched.tid)}
                    loading={subscribingTids.has(matched.tid)}
                >
                    {gLang('feedback.addUserToSubscription')}
                </Button>
            </Space>
        );
    };

    // 手动打开的反馈 tab 内容（与 match tab 相同布局，仅 tid）
    const renderManualTab = (tid: number) => {
        const previewTicket = previewTickets.get(tid);
        return (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div
                    style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: `1px solid ${isDarkMode ? token.colorBorderSecondary : '#f0f0f0'}`,
                        borderRadius: '4px',
                        padding: '12px',
                        background: isDarkMode ? token.colorFillAlter : '#fafafa',
                    }}
                >
                    {previewTicket ? (
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <div
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    marginBottom: '8px',
                                    wordBreak: 'break-word',
                                    color: token.colorText,
                                }}
                            >
                                {previewTicket.title.replace(/^反馈:\s*/, '')}
                            </div>
                            {previewTicket.details && previewTicket.details.length > 0 ? (
                                previewTicket.details
                                    .filter((d: TicketDetail) => d.action === TicketAction.Reply)
                                    .slice(0, 3)
                                    .map((d: TicketDetail, index: number) => (
                                        <SimpleReplyCard
                                            key={d.id}
                                            detail={d}
                                            floorNumber={index + 1}
                                        />
                                    ))
                            ) : (
                                <Text type="secondary">{gLang('feedback.noReplies')}</Text>
                            )}
                        </Space>
                    ) : (
                        <Skeleton active />
                    )}
                </div>
                {subscribedFeedbackTid === tid && (
                    <div
                        style={{
                            padding: '8px 12px',
                            background: isDarkMode ? '#162312' : '#f6ffed',
                            border: `1px solid ${isDarkMode ? '#274916' : '#b7eb8f'}`,
                            borderRadius: '4px',
                            color: isDarkMode ? '#73d13d' : '#52c41a',
                        }}
                    >
                        {gLang('feedback.subscriptionSuccess')}
                    </div>
                )}
                <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => handleSubscribe(tid)}
                    loading={subscribingTids.has(tid)}
                >
                    {gLang('feedback.addUserToSubscription')}
                </Button>
            </Space>
        );
    };

    // 手动打开反馈：列表（无添加/删除按钮），点击项将 tid 加入 card tab
    const renderManualPickerTab = () => (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Flex
                wrap="wrap"
                gap={8}
                style={isMobile ? { flexDirection: 'column', alignItems: 'stretch' } : undefined}
            >
                <Input
                    placeholder={gLang('feedback.searchPlaceholder')}
                    prefix={<SearchOutlined />}
                    value={feedbackSearchKeyword}
                    onChange={e => setFeedbackSearchKeyword(e.target.value)}
                    style={
                        isMobile
                            ? { width: '100%', minWidth: 0 }
                            : { minWidth: 200, flex: '0 0 auto' }
                    }
                    allowClear
                    size="small"
                    onPressEnter={() => {
                        setFeedbackListPage(1);
                        queryFeedbackList(1, false);
                    }}
                />
                <Flex
                    gap={4}
                    wrap="wrap"
                    style={{
                        maxWidth: isMobile ? 'none' : '400px',
                        width: isMobile ? '100%' : undefined,
                    }}
                >
                    <Tag
                        color={feedbackListStatus.length === 0 ? 'blue' : 'default'}
                        onClick={() => setFeedbackListStatus([])}
                        style={{
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '4px 12px',
                            flex: isMobile ? '1 1 calc(50% - 4px)' : 1,
                            minWidth: isMobile ? 0 : undefined,
                            textAlign: 'center',
                            backgroundColor:
                                feedbackListStatus.length === 0
                                    ? undefined
                                    : isDarkMode
                                      ? '#1f1f1f'
                                      : '#fafafa',
                            border:
                                feedbackListStatus.length === 0
                                    ? undefined
                                    : isDarkMode
                                      ? '1px solid #303030'
                                      : '1px solid #f0f0f0',
                            color: isDarkMode ? '#d9d9d9' : '#333',
                        }}
                    >
                        {gLang('feedback.allStatus')}
                    </Tag>
                    <Tag
                        color={feedbackListStatus.includes('open') ? 'blue' : 'default'}
                        onClick={() => {
                            if (feedbackListStatus.includes('open')) {
                                setFeedbackListStatus(feedbackListStatus.filter(s => s !== 'open'));
                            } else {
                                setFeedbackListStatus([...feedbackListStatus, 'open']);
                            }
                        }}
                        style={{
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '4px 12px',
                            flex: isMobile ? '1 1 calc(50% - 4px)' : 1,
                            minWidth: isMobile ? 0 : undefined,
                            textAlign: 'center',
                            backgroundColor: feedbackListStatus.includes('open')
                                ? undefined
                                : isDarkMode
                                  ? '#1f1f1f'
                                  : '#fafafa',
                            border: feedbackListStatus.includes('open')
                                ? undefined
                                : isDarkMode
                                  ? '1px solid #303030'
                                  : '1px solid #f0f0f0',
                            color: isDarkMode ? '#d9d9d9' : '#333',
                        }}
                    >
                        {gLang('feedback.status.open')}
                    </Tag>
                    <Tag
                        color={feedbackListStatus.includes('closed') ? 'blue' : 'default'}
                        onClick={() => {
                            if (feedbackListStatus.includes('closed')) {
                                setFeedbackListStatus(
                                    feedbackListStatus.filter(s => s !== 'closed')
                                );
                            } else {
                                setFeedbackListStatus([...feedbackListStatus, 'closed']);
                            }
                        }}
                        style={{
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '4px 12px',
                            flex: isMobile ? '1 1 calc(50% - 4px)' : 1,
                            minWidth: isMobile ? 0 : undefined,
                            textAlign: 'center',
                            backgroundColor: feedbackListStatus.includes('closed')
                                ? undefined
                                : isDarkMode
                                  ? '#1f1f1f'
                                  : '#fafafa',
                            border: feedbackListStatus.includes('closed')
                                ? undefined
                                : isDarkMode
                                  ? '1px solid #303030'
                                  : '1px solid #f0f0f0',
                            color: isDarkMode ? '#d9d9d9' : '#333',
                        }}
                    >
                        {gLang('feedback.status.closed')}
                    </Tag>
                    <Tag
                        color={feedbackListStatus.includes('ended') ? 'blue' : 'default'}
                        onClick={() => {
                            if (feedbackListStatus.includes('ended')) {
                                setFeedbackListStatus(
                                    feedbackListStatus.filter(s => s !== 'ended')
                                );
                            } else {
                                setFeedbackListStatus([...feedbackListStatus, 'ended']);
                            }
                        }}
                        style={{
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '4px 12px',
                            flex: isMobile ? '1 1 calc(50% - 4px)' : 1,
                            minWidth: isMobile ? 0 : undefined,
                            textAlign: 'center',
                            backgroundColor: feedbackListStatus.includes('ended')
                                ? undefined
                                : isDarkMode
                                  ? '#1f1f1f'
                                  : '#fafafa',
                            border: feedbackListStatus.includes('ended')
                                ? undefined
                                : isDarkMode
                                  ? '1px solid #303030'
                                  : '1px solid #f0f0f0',
                            color: isDarkMode ? '#d9d9d9' : '#333',
                        }}
                    >
                        {gLang('feedback.status.ended')}
                    </Tag>
                </Flex>
            </Flex>
            {feedbackListSpinning ? (
                <Spin spinning style={{ width: '100%', padding: '24px 0' }}>
                    <div style={{ minHeight: 120 }} />
                </Spin>
            ) : (
                (() => {
                    // 已改为服务端关键词搜索，直接使用接口返回的 list/total，不再前端过滤
                    return feedbackListItems.length > 0 ? (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                maxHeight: 320,
                                overflowY: 'auto',
                            }}
                        >
                            {feedbackListItems.map(item => {
                                const title = (item.title || '').replace(/^反馈:\s*/, '');
                                const replyCount = item.replyCount ?? 0;
                                const lastReplyTime = item.lastReplyTime ?? item.create_time ?? '';
                                return (
                                    <Card
                                        key={item.tid}
                                        hoverable
                                        size="small"
                                        style={{
                                            borderRadius: 8,
                                            border: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
                                            cursor: 'pointer',
                                        }}
                                        bodyStyle={{ padding: '12px 16px' }}
                                        onClick={() => handleAddManualTab(item)}
                                    >
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        marginBottom: 4,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    <Text strong style={{ fontSize: 14 }}>
                                                        {title || `TID#${item.tid}`}
                                                    </Text>
                                                    {item.tag ? (
                                                        <Tag color="blue">{item.tag}</Tag>
                                                    ) : null}
                                                    {item.feedbackType === 'BUG' ? (
                                                        <Tag color="red">
                                                            {gLang('feedback.typeBug')}
                                                        </Tag>
                                                    ) : item.feedbackType === 'SUGGESTION' ? (
                                                        <Tag color="green">
                                                            {gLang('feedback.typeSuggestion')}
                                                        </Tag>
                                                    ) : null}
                                                </div>
                                                <Space wrap size="small" style={{ fontSize: 12 }}>
                                                    {item.create_time && (
                                                        <Space size={4}>
                                                            <ClockCircleOutlined />
                                                            {convertUTCToFormat(item.create_time)}
                                                        </Space>
                                                    )}
                                                    <Tag
                                                        color={ltransTicketStatusColor(item.status)}
                                                        style={{ margin: 0 }}
                                                    >
                                                        {gLang(
                                                            ltransTicketStatusForUser(
                                                                item.status,
                                                                item.priority,
                                                                true,
                                                                item.type
                                                            )
                                                        )}
                                                    </Tag>
                                                    {replyCount > 0 && (
                                                        <>
                                                            {item.create_time && (
                                                                <Text type="secondary">·</Text>
                                                            )}
                                                            <Space size={4}>
                                                                <MessageOutlined />
                                                                <Text type="secondary">
                                                                    {gLang(
                                                                        'feedback.repliesCount'
                                                                    )?.replace?.(
                                                                        '{count}',
                                                                        String(replyCount)
                                                                    ) ??
                                                                        `${replyCount} ${gLang('feedback.replies')}`}
                                                                </Text>
                                                            </Space>
                                                            {lastReplyTime &&
                                                                lastReplyTime !==
                                                                    item.create_time && (
                                                                    <>
                                                                        <Text type="secondary">
                                                                            ·
                                                                        </Text>
                                                                        <Text type="secondary">
                                                                            {gLang(
                                                                                'feedback.lastReply'
                                                                            )}
                                                                            :{' '}
                                                                            {convertUTCToFormat(
                                                                                lastReplyTime
                                                                            )}
                                                                        </Text>
                                                                    </>
                                                                )}
                                                        </>
                                                    )}
                                                </Space>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Empty
                            description={gLang('feedback.noFeedback')}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    );
                })()
            )}
            {feedbackListHasMore && (
                <Button
                    block
                    type="dashed"
                    loading={feedbackListLoadingMore}
                    onClick={() => {
                        queryFeedbackList(feedbackListPage, true);
                        setFeedbackListPage(p => p + 1);
                    }}
                    size="small"
                >
                    {gLang('ticketQuery.loadMore')}
                </Button>
            )}
        </Space>
    );

    const manualPickerTabItem = {
        key: 'manual-picker',
        label: gLang('feedback.manualOpenFeedback'),
        children: renderManualPickerTab(),
    };
    const manualTabItems = manualOpenTids.map(tid => ({
        key: `manual-${tid}`,
        label: `TID#${tid}`,
        children: renderManualTab(tid),
    }));
    const createTabItem = {
        key: 'create',
        label: gLang('feedback.createNewFeedback'),
        children: renderCreateTab(),
    };

    // 手动打开反馈始终倒数第二，新建反馈始终倒数第一
    const tabItemsWithMatch = [
        ...matchedFeedbacks.map(matched => ({
            key: `match-${matched.tid}`,
            label: `TID#${matched.tid} (${matched.similarity}%)`,
            children: renderMatchTab(matched),
        })),
        ...manualTabItems,
        manualPickerTabItem,
        createTabItem,
    ];
    const defaultKey =
        matchedFeedbacks.length > 0 ? `match-${matchedFeedbacks[0].tid}` : 'manual-picker';
    const effectiveActiveKey = activeTabKey ?? defaultKey;

    return (
        <>
            {contextHolder}
            <style>{FEEDBACK_REPLY_CONTENT_STYLE}</style>
            <Card
                title={
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                            <MessageOutlined />
                            <span>{gLang('feedback.feedbackCenter')}</span>
                        </Space>
                        <Button
                            type="default"
                            size="small"
                            icon={<RobotOutlined />}
                            loading={rematchLoading}
                            onClick={handleRematchAi}
                        >
                            {gLang('feedback.rematchAi')}
                        </Button>
                    </Space>
                }
                style={{ width: '100%' }}
                size="small"
                styles={{ body: { paddingBottom: 8 }, header: { padding: '8px 12px' } }}
            >
                {
                    <Tabs
                        activeKey={effectiveActiveKey}
                        onChange={key => {
                            setActiveTabKey(key);
                            handleTabChange(key);
                        }}
                        items={tabItemsWithMatch}
                    />
                }
            </Card>
        </>
    );
};

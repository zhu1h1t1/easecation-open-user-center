// noinspection SpellCheckingInspection

import React, { ReactNode, useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';

import {
    Button,
    ConfigProvider,
    Descriptions,
    Flex,
    Image,
    Skeleton,
    Space,
    Spin,
    Statistic,
    Steps,
    Tag,
    Timeline,
    Tooltip,
    Typography,
    Modal,
    message,
} from 'antd';
import { gLang } from '@common/language';
import { VideoPlayerComponent } from '@common/components/Common';
import { fetchData } from '@common/axiosConfig';
import {
    ltransTicketDetailDotColor,
    ltransTicketDetailTextColor,
    ltransTicketPriority,
    ltransTicketPriorityColor,
    ltransTicketStatusColor,
    ltransTicketStatusForUser,
    ltransTicketType,
} from '@common/languageTrans';
import { generateTemporaryUrl } from '@common/utils/uploadUtils';
import { HTMLComponent } from '@common/components/Common';
import { ArrowUpOutlined, DeleteOutlined, TagOutlined } from '@ant-design/icons';
import {
    Ticket,
    TicketAction,
    TicketStatus,
    TicketType,
    TicketPriority,
} from '@ecuc/shared/types/ticket.types';
import MonthlyLinkVideoModal from '../pages/media/components/media-ticket/MonthlyLinkVideoModal';
import { SystemMessageDisplay } from '@common/components/SystemMessageDisplay';
import { getMessageStyleConfig } from '@ecuc/shared/constants/system-message.constants';

const TicketDetailComponent: React.FC<{
    ticket?: Ticket;
    isAdmin: boolean;
    onRefresh?: () => void;
    onApplyAIDraft?: (content: string) => void;
    onExecuteAIAction?: (actionJson: string) => void;
}> = ({ ticket, isAdmin, onRefresh, onApplyAIDraft, onExecuteAIAction }) => {
    const { Paragraph, Text } = Typography;

    const [messageApi, contextHolder] = message.useMessage();
    const [revokeModalVisible, setRevokeModalVisible] = useState(false);
    const [revokeId, setRevokeId] = useState<number | null>(null);

    const showRevokeModal = (id: number) => {
        setRevokeId(id);
        setRevokeModalVisible(true);
    };

    const handleRevoke = async () => {
        if (!revokeId) return;
        try {
            await fetchData({
                url: '/ticket/admin',
                method: 'POST',
                data: {
                    tid: ticket?.tid,
                    action: 'revoke',
                    id: revokeId,
                },
                setData: () => {
                    messageApi.success(gLang('ticketDetail.revokeSuccess'));
                    setRevokeModalVisible(false);
                    setRevokeId(null);
                    setTimeout(() => {
                        onRefresh?.();
                    }, 300);
                },
            });
        } catch {
            messageApi.error(gLang('ticketDetail.revokeFailed'));
        }
    };
    const [modalOpen, setModalOpen] = useState(false);
    const [bv, setBv] = useState<string | null>(null);

    // 受控“确认执行AI操作建议”模态框，以继承 ConfigProvider 主题（暗黑模式）
    const [aiConfirmOpen, setAiConfirmOpen] = useState(false);
    const [aiConfirmContent, setAiConfirmContent] = useState<string | null>(null);

    type StepStatus = 'process' | 'error' | 'wait' | 'finish';

    const generateSteps = (ticket?: Ticket) => {
        let steps = [];
        let current = 0;
        let status: StepStatus = 'process'; // 默认状态

        if (!ticket) {
            current = -1;
            steps.push({ title: '...' });
            steps.push({ title: '...' });
            steps.push({ title: '...' });
        } else {
            // 基础步骤：发起工单
            steps.push({
                title: gLang('ticket.initiate'),
                description: ticket?.create_time,
            });

            // For user-side display of upgrade tickets (priority 15), always show as "等待客服回复"
            const isUpgradeTicketForUser = !isAdmin && ticket.priority === TicketPriority.Upgrade;
            // 已完成的工单状态不应该被升级工单逻辑覆盖
            const isCompletedStatus = [
                TicketStatus.AutoAccept,
                TicketStatus.AutoReject,
                TicketStatus.Reject,
                TicketStatus.Accept,
                TicketStatus.UserCancel,
            ].includes(ticket.status);
            // 未完成的升级工单仍然显示为等待客服回复
            const displayStatus =
                isUpgradeTicketForUser && !isCompletedStatus
                    ? TicketStatus.WaitingStaffReply
                    : ticket.status;

            switch (displayStatus) {
                case TicketStatus.WaitingAssign:
                    if (ticket.priority_upgrade_time) {
                        steps.push({
                            title: gLang('ticket.reassign'),
                            description: ticket.assigned_time,
                            icon: <ArrowUpOutlined />,
                        });
                        // For user-side upgrade tickets, show as "等待客服回复" instead of "等待分配"
                        if (isUpgradeTicketForUser) {
                            steps.push({ title: gLang('ticket.status.X') });
                        } else {
                            steps.push({ title: gLang('ticket.status.O') });
                        }
                        current = 2;
                        steps.push({ title: gLang('ticket.completed') });
                    } else {
                        // For user-side upgrade tickets, show as "等待客服回复" instead of "等待分配"
                        if (isUpgradeTicketForUser) {
                            steps.push({ title: gLang('ticket.status.X') });
                        } else {
                            steps.push({ title: gLang('ticket.status.O') });
                        }
                        current = 1;
                        steps.push({ title: gLang('ticket.completed') });
                    }
                    break;
                case TicketStatus.WaitingReply:
                case TicketStatus.WaitingStaffReply:
                    steps.push({
                        title: gLang('ticket.assigned'),
                        description: ticket.assigned_time,
                    });
                    // For user-side upgrade tickets, always show "等待客服回复"
                    if (isUpgradeTicketForUser) {
                        steps.push({ title: gLang('ticket.status.X') });
                    } else {
                        steps.push({
                            title:
                                ticket.status === TicketStatus.WaitingReply
                                    ? gLang('ticket.status.W')
                                    : gLang('ticket.status.X'),
                        });
                    }
                    current = 2;
                    steps.push({ title: gLang('ticket.completed') });
                    break;
                case TicketStatus.AutoAccept:
                    steps.push({
                        title: gLang('ticket.status.A'),
                        description: ticket.complete_time,
                    });
                    current = 1;
                    status = 'finish';
                    break;
                case TicketStatus.AutoReject:
                    steps.push({
                        title: gLang('ticket.status.B'),
                        description: ticket.complete_time,
                    });
                    current = 1;
                    status = 'error';
                    break;
                case TicketStatus.Reject:
                    steps.push({
                        title: gLang('ticket.assigned'),
                        description: ticket.assigned_time,
                    });
                    steps.push({
                        title: gLang('ticket.status.R'),
                        description: ticket.complete_time,
                    });
                    current = 2;
                    status = 'error';
                    break;
                case TicketStatus.Accept:
                    steps.push({
                        title: gLang('ticket.assigned'),
                        description: ticket.assigned_time,
                    });
                    steps.push({
                        title: gLang('ticket.status.P'),
                        description: ticket.complete_time,
                    });
                    current = 2;
                    status = 'finish';
                    break;
                case TicketStatus.UserCancel:
                    steps.push({
                        title: gLang('ticket.status.D'),
                        description: ticket.complete_time,
                    });
                    current = 1;
                    status = 'error';
                    break;
                case TicketStatus.Entrust:
                    steps.push({
                        title: gLang('ticket.assigned'),
                        description: ticket.assigned_time,
                    });
                    steps.push({
                        title: gLang('ticket.status.E'),
                        description: ticket.complete_time,
                    });
                    current = 2;
                    status = 'process';
                    break;
            }
        }

        return { steps, current, status };
    };

    // 使用useMemo确保ticket变化时重新生成steps
    const { steps, current, status = 'wait' } = useMemo(() => generateSteps(ticket), [ticket]);

    // 解析纯文本中的 1 开头六位数字为可点击的 TID 链接（仅管理员）
    const renderTextWithTidLinks = (text?: string, isTitle: boolean = false): ReactNode => {
        const raw = text ?? '';
        if (!isAdmin || !/\b1\d{5}\b/.test(raw)) {
            return raw;
        }
        const parts = raw.split(/(\b1\d{5}\b)/g);
        return (
            <span style={{ whiteSpace: 'pre-wrap' }}>
                {parts.map((part, idx) => {
                    if (/^1\d{5}$/.test(part)) {
                        const tidNum = Number(part);
                        return (
                            <a
                                key={`tid_title_${idx}_${part}`}
                                href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    const evt = new CustomEvent('openTidFromDetail', {
                                        detail: { tid: tidNum },
                                    });
                                    window.dispatchEvent(evt);
                                }}
                                style={{
                                    padding: 0,
                                    lineHeight: 'inherit',
                                    fontSize: 'inherit',
                                    fontWeight: isTitle ? 600 : 'inherit',
                                    textDecoration: 'none',
                                }}
                            >
                                {part}
                            </a>
                        );
                    }
                    return <span key={`txt_title_${idx}`}>{part}</span>;
                })}
            </span>
        );
    };

    const formatReplyContent = (content: string): ReactNode => {
        // 基础替换：简单标题和加粗
        let processed = content.replace(/^(#+)\s*(.*)$/gm, (match, hashes, content) => {
            return `<strong>${content}</strong>`;
        });
        processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 不在此处插入内联链接，统一在后续拆分渲染阶段处理

        const displayedContentPattern =
            />(https?:\/\/www\.bilibili\.com\/video\/BV([a-zA-Z0-9]+))</g;
        if (displayedContentPattern.test(processed)) {
            const bvs = processed
                .match(displayedContentPattern)
                ?.map(match =>
                    match.replace(/>|</g, '').replace(/https?:\/\/www\.bilibili\.com\/video\//, '')
                );
            return (
                <Space direction="horizontal" size="small" align="center">
                    <HTMLComponent content={processed} />
                    <Space direction="horizontal" size="small">
                        {bvs?.map(bv => (
                            <span
                                key={`bv_${bv}`}
                                style={{ display: 'inline-flex', alignItems: 'center' }}
                            >
                                <span
                                    style={{ marginLeft: 8, cursor: 'pointer' }}
                                    onClick={() => {
                                        setModalOpen(true);
                                        setBv(bv);
                                    }}
                                >
                                    <svg
                                        width="30"
                                        height="30"
                                        viewBox="0 0 1024 1024"
                                        fill="currentColor"
                                    >
                                        <path d="M512 128C300.3 128 128 300.3 128 512s172.3 384 384 384 384-172.3 384-384S723.7 128 512 128zm0 704c-176.7 0-320-143.3-320-320s143.3-320 320-320 320 143.3 320 320-143.3 320-320 320zm0-480c-88.4 0-160 71.6-160 160s71.6 160 160 160 160-71.6 160-160-71.6-160-160-160zm0 256c-53 0-96-43-96-96s43-96 96-96 96 43 96 96-43 96-96 96z" />
                                    </svg>
                                </span>
                            </span>
                        ))}
                    </Space>
                </Space>
            );
        }

        // 将 1 开头的六位数字渲染为链接按钮（仅管理员）
        if (isAdmin && /\b1\d{5}\b/.test(processed)) {
            // 拆分并逐段渲染，非 TID 片段使用内联 span 避免强制换行
            const parts = processed.split(/(\b1\d{5}\b)/g);
            return (
                <span style={{ whiteSpace: 'pre-wrap' }}>
                    {parts.map((part, idx) => {
                        if (/^1\d{5}$/.test(part)) {
                            const tidNum = Number(part);
                            return (
                                <Button
                                    key={`tid_${idx}_${part}`}
                                    type="link"
                                    size="small"
                                    style={{ padding: 0, height: 'auto', lineHeight: 1 }}
                                    onClick={() => {
                                        const evt = new CustomEvent('openTidFromDetail', {
                                            detail: { tid: tidNum },
                                        });
                                        window.dispatchEvent(evt);
                                    }}
                                >
                                    {part}
                                </Button>
                            );
                        }
                        return (
                            <span key={`txt_${idx}`} dangerouslySetInnerHTML={{ __html: part }} />
                        );
                    })}
                </span>
            );
        }

        return <HTMLComponent content={processed} />;
    };

    return (
        <>
            {contextHolder}
            <Modal
                title={gLang('ticketDetail.revokeConfirmTitle')}
                open={revokeModalVisible}
                onOk={handleRevoke}
                onCancel={() => {
                    setRevokeModalVisible(false);
                    setRevokeId(null);
                }}
                okText={gLang('ticketDetail.dropConfirmY')}
                cancelText={gLang('ticketDetail.dropConfirmN')}
                okButtonProps={{ danger: true }}
            >
                <p>{gLang('ticketDetail.revokeConfirm')}</p>
            </Modal>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Space size="small" wrap>
                    <Tag color={ltransTicketStatusColor(ticket?.status)}>
                        {ticket
                            ? ltransTicketStatusForUser(
                                  ticket.status,
                                  ticket.priority,
                                  isAdmin,
                                  ticket.type
                              )
                            : '...'}
                    </Tag>
                    <Tag color={ltransTicketPriorityColor(ticket?.priority)}>
                        {ticket ? ltransTicketPriority(ticket.priority) : '...'}
                    </Tag>
                </Space>
                <Statistic
                    loading={!ticket}
                    title={
                        ticket ? (
                            // GU类型工单隐藏TID
                            ticket.type === TicketType.Feedback ? (
                                ltransTicketType(ticket.type)
                            ) : (
                                gLang('ticket.TID') +
                                ticket.tid +
                                ' - ' +
                                ltransTicketType(ticket.type)
                            )
                        ) : (
                            <Skeleton active paragraph={{ rows: 1 }} />
                        )
                    }
                    value={ticket ? (ticket.title ?? '') : 'Loading...'}
                    formatter={(val: any) => renderTextWithTidLinks(String(val), true)}
                />
                {ticket && (
                    <Descriptions>
                        {![TicketType.Consultation].includes(ticket.type) && (
                            <Descriptions.Item label={gLang('ticketList.account.' + ticket.type)}>
                                {ticket.initiator == '' ? 'N/A' : ticket.initiator}
                            </Descriptions.Item>
                        )}
                        {[
                            TicketType.ReportPlayer,
                            TicketType.ReportStaff,
                            TicketType.Others,
                            TicketType.MediaMonthlyReport,
                            TicketType.MediaAudit,
                        ].includes(ticket.type) && (
                            <Descriptions.Item label={gLang('ticketList.target.' + ticket.type)}>
                                {ticket.target == ''
                                    ? 'N/A'
                                    : renderTextWithTidLinks(ticket.target)}
                            </Descriptions.Item>
                        )}
                        {ticket.type === TicketType.WikiBinding && (
                            <Descriptions.Item label={gLang('ticketList.target.' + ticket.type)}>
                                {(() => {
                                    const wikiUsername = ticket.target || 'N/A';
                                    // 从工单详情中提取WIKI用户ID
                                    let wikiUserid: number | null = null;
                                    if (ticket.details && ticket.details.length > 0) {
                                        const firstDetail = ticket.details[0];
                                        if (firstDetail && firstDetail.content) {
                                            const useridMatch =
                                                firstDetail.content.match(/WIKI用户ID:\s*(\d+)/);
                                            if (useridMatch && useridMatch[1]) {
                                                wikiUserid = parseInt(useridMatch[1], 10);
                                            }
                                        }
                                    }
                                    return wikiUserid
                                        ? `${wikiUsername} (ID: ${wikiUserid})`
                                        : wikiUsername;
                                })()}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                )}
                {/* GU类型工单不显示处理流程图，显示反馈状态 */}
                {ticket?.type !== TicketType.Feedback && (
                    <Steps current={current} status={status} items={steps} />
                )}
                {ticket?.type === TicketType.Feedback && (
                    <Tag color={ltransTicketStatusColor(ticket.status)} style={{ marginTop: 16 }}>
                        {gLang('feedback.feedbackStatus')}:{' '}
                        {ltransTicketStatusForUser(
                            ticket.status,
                            ticket.priority,
                            isAdmin,
                            ticket.type
                        )}
                    </Tag>
                )}

                <ConfigProvider
                    theme={{
                        components: {
                            Timeline: {
                                // itemPaddingBottom: 0
                            },
                        },
                    }}
                >
                    {ticket ? (
                        <Timeline
                            key={'ticketList'}
                            style={{ marginTop: '10px' }}
                            items={[
                                ...(ticket.details?.map((detail, index) => ({
                                    key: index,
                                    color: ltransTicketDetailDotColor(detail.action),
                                    children: (
                                        <Typography id={`feedback-detail-${detail.id}`}>
                                            {(detail.action === TicketAction.Reply ||
                                                detail.action === TicketAction.Withdraw ||
                                                detail.action === TicketAction.Note) && (
                                                <Paragraph
                                                    style={{
                                                        marginBottom: '8px',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {/* GU类型工单的官方回复标识 */}
                                                    {ticket.type === TicketType.Feedback &&
                                                        detail.operator && (
                                                            <Button
                                                                type="text"
                                                                icon={<TagOutlined />}
                                                                style={{
                                                                    position: 'absolute',
                                                                    right: 0,
                                                                    top: 0,
                                                                    color: '#1890ff',
                                                                    fontSize: '16px',
                                                                    padding: '0 4px',
                                                                    height: 'auto',
                                                                    lineHeight: 1,
                                                                    zIndex: 10,
                                                                }}
                                                                onClick={() => {
                                                                    // 滚动到该回复位置
                                                                    const element =
                                                                        document.getElementById(
                                                                            `feedback-detail-${detail.id}`
                                                                        );
                                                                    if (element) {
                                                                        element.scrollIntoView({
                                                                            behavior: 'smooth',
                                                                            block: 'center',
                                                                        });
                                                                    }
                                                                }}
                                                                title={
                                                                    gLang(
                                                                        'feedback.officialReply'
                                                                    ) +
                                                                    ' - ' +
                                                                    gLang('feedback.jumpToReply')
                                                                }
                                                            />
                                                        )}
                                                    <Flex align="center" gap="small" wrap>
                                                        {detail.operator ? (
                                                            <Tooltip title={detail.operator}>
                                                                <span
                                                                    style={{
                                                                        fontWeight: 'bold',
                                                                        color:
                                                                            detail.action ===
                                                                                TicketAction.Withdraw ||
                                                                            detail.action ===
                                                                                TicketAction.Note
                                                                                ? '#999'
                                                                                : 'inherit',
                                                                    }}
                                                                >
                                                                    {detail.displayTitle}
                                                                </span>
                                                            </Tooltip>
                                                        ) : (
                                                            <span
                                                                style={{
                                                                    fontWeight: 'bold',
                                                                    color:
                                                                        detail.action ===
                                                                            TicketAction.Withdraw ||
                                                                        detail.action ===
                                                                            TicketAction.Note
                                                                            ? '#999'
                                                                            : 'inherit',
                                                                }}
                                                            >
                                                                {detail.displayTitle}
                                                            </span>
                                                        )}
                                                        {detail.action ===
                                                            TicketAction.Withdraw && (
                                                            <Tag
                                                                color="default"
                                                                style={{
                                                                    fontSize: '10px',
                                                                    color: '#999',
                                                                }}
                                                            >
                                                                {gLang(
                                                                    'ticketDetail.revokedMessage'
                                                                )}
                                                            </Tag>
                                                        )}
                                                        {detail.action === TicketAction.Note && (
                                                            <Tag
                                                                color="default"
                                                                style={{
                                                                    fontSize: '10px',
                                                                    color: '#999',
                                                                }}
                                                            >
                                                                {isAdmin
                                                                    ? gLang(
                                                                          'ticketDetail.internalNote'
                                                                      )
                                                                    : gLang(
                                                                          'ticketDetail.noteLabel'
                                                                      )}
                                                            </Tag>
                                                        )}
                                                        <Text
                                                            disabled
                                                            style={{
                                                                fontSize: '12px',
                                                                color: '#999',
                                                            }}
                                                        >
                                                            @ {detail.create_time}/{ticket.tid}
                                                        </Text>
                                                        {isAdmin &&
                                                            (detail.operator.startsWith(
                                                                'AUTH_UID_'
                                                            ) ||
                                                                detail.operator === 'AUTO_SOLVE' ||
                                                                detail.operator === 'AUTO_SOLVER' ||
                                                                detail.operator === 'SYSTEM') &&
                                                            detail.action ===
                                                                TicketAction.Reply && (
                                                                <Tooltip
                                                                    title={gLang(
                                                                        'ticketDetail.revoke'
                                                                    )}
                                                                >
                                                                    <Button
                                                                        type="text"
                                                                        size="small"
                                                                        icon={<DeleteOutlined />}
                                                                        style={{
                                                                            padding: '2px 4px',
                                                                            fontSize: '12px',
                                                                            height: '20px',
                                                                            minWidth: '20px',
                                                                            color: '#999',
                                                                            flexShrink: 0,
                                                                        }}
                                                                        onClick={() =>
                                                                            showRevokeModal(
                                                                                detail.id
                                                                            )
                                                                        }
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                    </Flex>
                                                </Paragraph>
                                            )}
                                            {(() => {
                                                const messageStyle = detail.displayTitle
                                                    ? getMessageStyleConfig(detail.displayTitle)
                                                    : null;

                                                if (messageStyle) {
                                                    return (
                                                        <SystemMessageDisplay
                                                            detail={detail}
                                                            onApplyAIDraft={content => {
                                                                onApplyAIDraft?.(content);
                                                                messageApi.success(
                                                                    gLang(
                                                                        'ticketDetail.aiDraftApplied'
                                                                    )
                                                                );
                                                                // 滚动到回复卡片
                                                                setTimeout(() => {
                                                                    const replyCard =
                                                                        document.querySelector(
                                                                            '[data-testid="reply-card"]'
                                                                        ) ||
                                                                        document.querySelector(
                                                                            `.ant-card .ant-card-head-title:contains("${gLang('ticketDetail.replyCardTitle')}")`
                                                                        );
                                                                    if (replyCard) {
                                                                        replyCard.scrollIntoView({
                                                                            behavior: 'smooth',
                                                                            block: 'start',
                                                                        });
                                                                    }
                                                                }, 100);
                                                            }}
                                                            onExecuteAIAction={content => {
                                                                setAiConfirmContent(content);
                                                                setAiConfirmOpen(true);
                                                            }}
                                                            formatReplyContent={formatReplyContent}
                                                            ltransTicketDetailTextColor={
                                                                ltransTicketDetailTextColor
                                                            }
                                                        />
                                                    );
                                                }

                                                // 默认显示逻辑
                                                return (
                                                    <Paragraph
                                                        style={{
                                                            color: ltransTicketDetailTextColor(
                                                                detail.action
                                                            ),
                                                            fontWeight:
                                                                detail.action === TicketAction.Reply
                                                                    ? 'bold'
                                                                    : 'default',
                                                            opacity:
                                                                detail.action ===
                                                                    TicketAction.Withdraw ||
                                                                detail.action === TicketAction.Note
                                                                    ? 0.6
                                                                    : 1,
                                                        }}
                                                    >
                                                        {detail.content
                                                            .split('\n')
                                                            .map((line, index) => (
                                                                <React.Fragment key={index}>
                                                                    {formatReplyContent(line)}
                                                                </React.Fragment>
                                                            ))}
                                                    </Paragraph>
                                                );
                                            })()}
                                            {/*ChatGPT写翻车了，所以做个兼容处理，过滤掉非string的字段*/}
                                            <AttachmentPreview
                                                attachments={
                                                    detail.attachments
                                                        ? detail.attachments.filter(e =>
                                                              typeof (e as
                                                                  | string
                                                                  | {
                                                                        uid: string;
                                                                    }) === 'string'
                                                                  ? e
                                                                  : undefined
                                                          )
                                                        : []
                                                }
                                            />
                                        </Typography>
                                    ),
                                })) || []),
                                ...(ticket.complete_time
                                    ? [
                                          {
                                              key: 'completion',
                                              color:
                                                  ticket.status === TicketStatus.Accept ||
                                                  ticket.status === TicketStatus.AutoAccept ||
                                                  ticket.status === TicketStatus.Entrust
                                                      ? 'green'
                                                      : 'red',
                                              children: (
                                                  <Typography>
                                                      <Paragraph>
                                                          {ticket.status === TicketStatus.Accept ||
                                                          ticket.status === TicketStatus.AutoAccept
                                                              ? gLang('ticket.process', {
                                                                    tid: ticket.tid,
                                                                })
                                                              : (ticket.status ===
                                                                TicketStatus.UserCancel
                                                                    ? gLang('ticket.revocation')
                                                                    : ticket.status ===
                                                                        TicketStatus.Entrust
                                                                      ? gLang('ticket.entrust', {
                                                                            tid: ticket.tid,
                                                                        })
                                                                      : gLang('ticket.reject', {
                                                                            tid: ticket.tid,
                                                                        })
                                                                )
                                                                    .split('\n')
                                                                    .map((line, _index) => (
                                                                        <React.Fragment
                                                                            key={'ending'}
                                                                        >
                                                                            <HTMLComponent
                                                                                content={line}
                                                                            />
                                                                        </React.Fragment>
                                                                    ))}
                                                      </Paragraph>
                                                  </Typography>
                                              ),
                                          },
                                      ]
                                    : []),
                            ]}
                        />
                    ) : (
                        <Space direction="vertical" style={{ width: '100%', marginTop: 32 }}>
                            <Skeleton avatar active paragraph={{ rows: 2 }} />
                            <Skeleton avatar active paragraph={{ rows: 2 }} />
                            <Skeleton avatar active paragraph={{ rows: 2 }} />
                        </Space>
                    )}
                </ConfigProvider>

                {modalOpen && bv && (
                    <MonthlyLinkVideoModal
                        bv={bv}
                        open={modalOpen}
                        onCancel={() => {
                            setModalOpen(false);
                            setBv(null);
                        }}
                    />
                )}

                {/* 确认执行AI操作建议（受控 Modal，继承主题以适配暗黑模式） */}
                <Modal
                    title={gLang('ticketDetail.aiConfirmTitle')}
                    open={aiConfirmOpen}
                    onOk={() => {
                        if (aiConfirmContent) {
                            onExecuteAIAction?.(aiConfirmContent);
                        }
                        setAiConfirmOpen(false);
                        setAiConfirmContent(null);
                    }}
                    onCancel={() => {
                        setAiConfirmOpen(false);
                        setAiConfirmContent(null);
                    }}
                    okText={gLang('ticketDetail.aiConfirmOk')}
                    cancelText={gLang('common.cancel')}
                >
                    {gLang('ticketDetail.aiConfirmContent')}
                </Modal>
            </Space>
        </>
    );
};

const AttachmentPreview: React.FC<{ attachments: string[] }> = ({ attachments }) => {
    const [urls, setUrls] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUrls = async () => {
            const urlPromises =
                attachments?.map(async attachment => {
                    const fullUrl = `https://ec-user-center.oss-cn-hangzhou.aliyuncs.com/${attachment}`;
                    const tempUrl = await generateTemporaryUrl(fullUrl);
                    return { [attachment]: tempUrl };
                }) || [];

            const results = await Promise.all(urlPromises);
            const urlMap = results.reduce((acc, urlObj) => ({ ...acc, ...urlObj }), {});
            setUrls(urlMap);
            setLoading(false);
        };

        fetchUrls();
    }, [attachments]);

    return (
        <Flex wrap gap="small">
            <Image.PreviewGroup>
                {attachments?.map(attachment => {
                    const lowerAttachment = attachment.toLowerCase();
                    if (loading) {
                        return <Spin key={attachment} />;
                    } else if (lowerAttachment.match(/\.(mp4|mov|webm)$/)) {
                        return (
                            <VideoPlayerComponent
                                key={attachment}
                                src={urls[attachment] || ''}
                                width={50}
                                height={50}
                            />
                        );
                    } else if (lowerAttachment.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) {
                        return (
                            <Image
                                key={attachment}
                                width={50}
                                height={50}
                                src={urls[attachment] || ''}
                            />
                        );
                    } else {
                        return (
                            <Button
                                type="dashed"
                                key={attachment}
                                style={{
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-all',
                                    height: 'auto',
                                    lineHeight: 'normal',
                                    padding: '8px',
                                }}
                                onClick={() => window.open(urls[attachment] || '', '_blank')}
                            >
                                {gLang('common.download')}{' '}
                                {(() => {
                                    const fileName = attachment.substring(
                                        attachment.lastIndexOf('/') + 1
                                    );
                                    const pattern = /^(\d{14})_(.+)$/;
                                    const match = fileName.match(pattern);
                                    if (match) {
                                        const dateTime = dayjs(match[1], 'YYYYMMDDHHmmss').format(
                                            'YYYY-MM-DD HH:mm:ss'
                                        );
                                        return `[${dateTime}] ${match[2]}`;
                                    } else {
                                        return fileName;
                                    }
                                })()}
                            </Button>
                        );
                    }
                })}
            </Image.PreviewGroup>
        </Flex>
    );
};

export default TicketDetailComponent;

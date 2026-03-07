// 工单管理主页

import { Col, message, Modal, Row, Space, theme, Typography, Button, Statistic } from 'antd';
import { fetchData } from '@common/axiosConfig';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gLang } from '@common/language';
import './Admin.css';

// 格式化秒数为 小时/分钟/秒 的简短表示
const formatSeconds = (secs: number | undefined | null) => {
    if (secs === null || secs === undefined) return '—';
    const s = Math.round(secs);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0)
        return gLang('admin.dashboardDurationHms', {
            h: String(h),
            m: String(m),
            sec: String(sec),
        });
    if (m > 0) return gLang('admin.dashboardDurationMs', { m: String(m), sec: String(sec) });
    return gLang('admin.dashboardDurationS', { sec: String(sec) });
};
import {
    CarryOutOutlined,
    CloudServerOutlined,
    ContainerOutlined,
    IssuesCloseOutlined,
    SolutionOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { TicketCountPublic } from '@ecuc/shared/types/ticket.types';
import useIsPC from '@common/hooks/useIsPC';
import { useAuth } from '@common/contexts/AuthContext';
import EntrustList from './components/EntrustList';
import TodayTicketsModal from './components/TodayTicketsModal';
import SeniorUnassignedTicketsModal from './components/SeniorUnassignedTicketsModal';
import { useTicketCountUpdate } from '@common/hooks/useTicketStatusUpdate';
import AdminToolsPanel from './AdminToolsPanel';
import AdminStatLinkItem from '../components/AdminStatLinkItem';
import usePageTitle from '@common/hooks/usePageTitle';
import { applyLocalStorageFromUrl } from '@common/utils/localStorageFromUrl';
import { switchDomain } from '@common/utils/crossDomainSwitch';

const Admin = () => {
    usePageTitle(); // 使用管理端页面标题管理Hook

    const navigate = useNavigate();

    // 用于 AutoDo 的跨域切换函数，支持动态目标类型
    const handleCrossDomainSwitchForAutoDo = async (targetPath: string, targetType: string) => {
        const normalizedType = targetType.trim();
        if (normalizedType !== 'user' && normalizedType !== 'admin') {
            return;
        }
        await switchDomain({ type: normalizedType, path: targetPath });
    };

    // 从 URL 参数中解析并设置 localStorage
    useEffect(() => {
        applyLocalStorageFromUrl();

        // 检查是否从用户端切换过来，并保存用户端路径
        const params = new URLSearchParams(window.location.search);
        const userReturnPath = params.get('user_return_path');
        if (userReturnPath) {
            localStorage.setItem('user_last_path', userReturnPath);

            // 清理 URL 参数（可选，避免刷新页面时重复保存）
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('user_return_path');
            window.history.replaceState({}, '', newUrl.toString());
        }

        // 检查并处理 AutoDo
        const autoDo = localStorage.getItem('AutoDo');
        if (autoDo) {
            // 解析 GOTO 函数：GOTO(admin,/wiki-bindings) 或 GOTO(user,/)
            // 使用更宽松的正则表达式，支持路径中包含引号和特殊字符
            // 先找到最后一个 )，然后向前匹配
            const lastParenIndex = autoDo.lastIndexOf(')');
            if (lastParenIndex === -1) {
                localStorage.removeItem('AutoDo');
                return;
            }
            const beforeParen = autoDo.substring(0, lastParenIndex);
            const gotoMatch = beforeParen.match(/^GOTO\(([^,]+),\s*(.+)$/);
            if (gotoMatch) {
                let [, targetType, targetPath] = gotoMatch;
                // 处理转义的引号：将 \" 还原为 "
                targetPath = targetPath.replace(/\\"/g, '"');

                const trimmedType = targetType.trim();
                // 去除 localStorage 中的 AutoDo
                localStorage.removeItem('AutoDo');

                // 本页面属于管理端，目标为 admin 则站内跳转，否则跨域跳转（如 user）
                if (trimmedType === 'admin') {
                    navigate(targetPath);
                } else {
                    handleCrossDomainSwitchForAutoDo(targetPath, trimmedType);
                }
            } else {
                // 如果不是 GOTO 函数，清除 AutoDo
                localStorage.removeItem('AutoDo');
            }
        }
    }, []);

    const [ticketCount, setTicketCount] = useState<TicketCountPublic>();
    const [processStats, setProcessStats] = useState<any>();
    const { Title, Paragraph } = Typography;

    const isPC = useIsPC();
    const { user } = useAuth();
    const { useToken } = theme;
    const { token } = useToken();

    // 使用实时更新hook
    const countUpdateTrigger = useTicketCountUpdate();

    const [messageApi, messageContextHolder] = message.useMessage();

    const [showTodayModal, setShowTodayModal] = useState(false);
    const [showSeniorUnassignedModal, setShowSeniorUnassignedModal] = useState(false);

    // 高风险审批未审核提示相关状态
    const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
    const [showApprovalReminder, setShowApprovalReminder] = useState(false);

    useEffect(() => {
        fetchData({
            url: '/ticket/count',
            method: 'GET',
            data: { type: 'admin' },
            setData: setTicketCount,
        });
    }, [countUpdateTrigger]);

    // 获取处理时效统计（默认最近100个）
    useEffect(() => {
        fetchData({
            url: '/ticket/process-time-stats',
            method: 'GET',
            data: {},
            setData: setProcessStats,
        });
    }, [countUpdateTrigger]);

    // 检查是否有未审核的高风险审批（仅对有 sen.admin 权限的用户）
    useEffect(() => {
        const hasSenAdmin = user?.permission?.includes('sen.admin');
        if (!hasSenAdmin) {
            return;
        }

        // 获取高风险审批列表
        fetchData({
            url: '/risk-approval',
            method: 'GET',
            data: {},
            setData: (data: any) => {
                const approvals = data.approvals || [];
                // 筛选出需要当前用户审核的项目（状态为Pending且用户未投票）
                const pendingApprovals = approvals.filter(
                    (approval: any) => approval.status === 'Pending' && !approval.hasVoted
                );

                if (pendingApprovals.length > 0) {
                    setPendingApprovalsCount(pendingApprovals.length);
                    setShowApprovalReminder(true);
                }
            },
        });
    }, [user]);

    const containerStyle = {
        width: '100%',
        ['--admin-primary-color']: token.colorPrimary,
    } as React.CSSProperties;
    return (
        <Space direction="vertical" size="large" style={containerStyle}>
            {messageContextHolder}
            <div>
                <div style={{ position: 'relative' }}>
                    <Typography>
                        <Title>{gLang('adminMain.title')}</Title>
                        <Paragraph style={{ marginBottom: 12 }}>
                            {gLang('adminMain.intro')}
                        </Paragraph>
                    </Typography>
                </div>

                <div
                    style={{
                        backgroundColor: token.colorFillAlter,
                        borderRadius: token.borderRadiusLG,
                        padding: isPC ? '12px 24px' : '12px 16px',
                        display: 'flex',
                        flexDirection: isPC ? 'row' : 'column',
                        justifyContent: 'space-between',
                        alignItems: isPC ? 'center' : 'stretch',
                        flexWrap: isPC ? 'wrap' : 'nowrap',
                        gap: 16,
                    }}
                >
                    {isPC ? (
                        <>
                            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', flex: 1 }}>
                                <Statistic
                                    title={gLang('admin.dashboardEntrusting')}
                                    value={
                                        ticketCount?.count_waiting_entrust !== undefined
                                            ? ticketCount.count_waiting_entrust
                                            : '—'
                                    }
                                    valueStyle={{ fontSize: 20, fontWeight: 600 }}
                                />
                                <Statistic
                                    title={gLang('admin.dashboardAvgRecent', {
                                        limit: String(processStats?.limit || 100),
                                    })}
                                    value={
                                        processStats?.average_seconds_all !== undefined
                                            ? formatSeconds(processStats?.average_seconds_all)
                                            : '—'
                                    }
                                    valueStyle={{ fontSize: 20, fontWeight: 600 }}
                                />
                                <Statistic
                                    title={gLang('admin.dashboardPersonalAvg')}
                                    value={
                                        processStats?.average_seconds_user !== undefined
                                            ? formatSeconds(processStats?.average_seconds_user)
                                            : '—'
                                    }
                                    valueStyle={{ fontSize: 20, fontWeight: 600 }}
                                />
                            </div>
                            <div>
                                <Button onClick={() => setShowTodayModal(true)}>
                                    {gLang('adminMain.viewTodayTickets')}
                                </Button>
                            </div>
                        </>
                    ) : (
                        // Mobile Layout
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Statistic
                                    title={gLang('admin.dashboardEntrustAll')}
                                    value={
                                        ticketCount?.count_waiting_entrust !== undefined
                                            ? ticketCount.count_waiting_entrust
                                            : '—'
                                    }
                                    valueStyle={{ fontSize: 24, fontWeight: 600 }}
                                />
                                <Button size="small" onClick={() => setShowTodayModal(true)}>
                                    {gLang('adminMain.viewTodayTickets')}
                                </Button>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <Statistic
                                        title={gLang('admin.dashboardAvg', {
                                            limit: String(processStats?.limit || 100),
                                        })}
                                        value={
                                            processStats?.average_seconds_all !== undefined
                                                ? formatSeconds(processStats?.average_seconds_all)
                                                : '—'
                                        }
                                        valueStyle={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            lineHeight: 1.2,
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Statistic
                                        title={gLang('admin.dashboardPersonal')}
                                        value={
                                            processStats?.average_seconds_user !== undefined
                                                ? formatSeconds(processStats?.average_seconds_user)
                                                : '—'
                                        }
                                        valueStyle={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            lineHeight: 1.2,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 高风险审批未审核提示弹窗 */}
            <Modal
                title={
                    <Space>
                        <WarningOutlined style={{ color: '#faad14' }} />
                        <span>{gLang('adminMain.risk.pendingReviewTitle')}</span>
                    </Space>
                }
                open={showApprovalReminder}
                onOk={() => {
                    setShowApprovalReminder(false);
                    navigate('/risk-approval');
                }}
                onCancel={() => setShowApprovalReminder(false)}
                okText={gLang('adminMain.risk.pendingReviewAction')}
                cancelText={gLang('adminMain.risk.pendingReviewLater')}
                centered
            >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Typography.Text>
                        {gLang('adminMain.risk.pendingReviewPrefix')}{' '}
                        <Typography.Text strong style={{ color: '#faad14', fontSize: 16 }}>
                            {pendingApprovalsCount}
                        </Typography.Text>{' '}
                        {gLang('adminMain.risk.pendingReviewSuffix', {
                            label: gLang('adminMain.risk.pendingReview'),
                        })}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                        {gLang('adminMain.risk.pendingReviewHint')}
                    </Typography.Text>
                </Space>
            </Modal>

            <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={4} style={{ marginBottom: 4 }}>
                    {gLang('adminMain.group.ticket')}
                </Title>

                {isPC && (
                    <Space
                        direction="horizontal"
                        size="large"
                        style={{ width: '100%', display: 'flex' }}
                        styles={{ item: { display: 'flex', flex: 1 } }}
                    >
                        <AdminStatLinkItem
                            to="/ticket/assign/my"
                            count={ticketCount?.count_waiting_my?.my}
                            isPC={isPC}
                            icon={<CarryOutOutlined />}
                            title={gLang('adminMain.ticketType.my')}
                            loading={!ticketCount}
                        />
                        <AdminStatLinkItem
                            to="/ticket/assign/upgrade"
                            count={ticketCount?.count_waiting_my?.upgrade}
                            isPC={isPC}
                            icon={<IssuesCloseOutlined />}
                            title={gLang('adminMain.ticketType.upgrade')}
                            loading={!ticketCount}
                        />
                        <AdminStatLinkItem
                            to="/ticket/assign/upgrade"
                            count={ticketCount?.count_waiting_senior_unassigned}
                            isPC={isPC}
                            icon={<IssuesCloseOutlined />}
                            title={gLang('adminMain.ticketType.seniorUnassigned')}
                            onClick={() => setShowSeniorUnassignedModal(true)}
                            loading={!ticketCount}
                        />
                        <AdminStatLinkItem
                            to="/ticket/assign/unassigned"
                            count={ticketCount?.count_waiting_my?.unassigned}
                            isPC={isPC}
                            icon={<ContainerOutlined />}
                            title={gLang('adminMain.ticketType.unassigned')}
                            loading={!ticketCount}
                        />
                    </Space>
                )}

                {!isPC && (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Row gutter={[12, 12]}>
                            <Col span={12}>
                                <AdminStatLinkItem
                                    to="/ticket/query"
                                    isPC={false}
                                    icon={<CloudServerOutlined />}
                                    title={gLang('adminMain.query')}
                                    showValue={false}
                                />
                            </Col>
                            <Col span={12}>
                                <AdminStatLinkItem
                                    to="/ticket/my"
                                    isPC={false}
                                    icon={<SolutionOutlined />}
                                    title={gLang('adminMain.myTicket')}
                                    showValue={false}
                                />
                            </Col>
                        </Row>
                        <Row gutter={[12, 12]}>
                            <Col span={12}>
                                <AdminStatLinkItem
                                    to="/ticket/assign/my"
                                    count={ticketCount?.count_waiting_my?.my}
                                    isPC={false}
                                    icon={<CarryOutOutlined />}
                                    title={gLang('adminMain.ticketType.my')}
                                />
                            </Col>
                            <Col span={12}>
                                <AdminStatLinkItem
                                    to="/ticket/assign/upgrade"
                                    count={ticketCount?.count_waiting_my?.upgrade}
                                    isPC={false}
                                    icon={<IssuesCloseOutlined />}
                                    title={gLang('adminMain.ticketType.upgrade')}
                                />
                            </Col>
                            <Col span={12}>
                                <AdminStatLinkItem
                                    to="/ticket/assign/upgrade"
                                    count={ticketCount?.count_waiting_senior_unassigned}
                                    isPC={false}
                                    icon={<IssuesCloseOutlined />}
                                    title={gLang('adminMain.ticketType.seniorUnassigned')}
                                    onClick={() => setShowSeniorUnassignedModal(true)}
                                />
                            </Col>
                            <Col span={12}>
                                <AdminStatLinkItem
                                    to="/ticket/assign/unassigned"
                                    count={ticketCount?.count_waiting_my?.unassigned}
                                    isPC={false}
                                    icon={<ContainerOutlined />}
                                    title={gLang('adminMain.ticketType.unassigned')}
                                />
                            </Col>
                        </Row>
                    </Space>
                )}
            </Space>
            <TodayTicketsModal open={showTodayModal} onCancel={() => setShowTodayModal(false)} />
            <SeniorUnassignedTicketsModal
                open={showSeniorUnassignedModal}
                onCancel={() => setShowSeniorUnassignedModal(false)}
            />
            <AdminToolsPanel
                onOpenSuperPanel={ecid => navigate('/panel/' + ecid)}
                onOpenTicketAction={tid => navigate('/ticket/operate/my/' + tid)}
                user={user}
                messageApi={messageApi}
            />
            <EntrustList />
        </Space>
    );
};

export default Admin;

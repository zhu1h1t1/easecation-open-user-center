// 管理员PC端侧边栏组件

import { fetchData } from '@common/axiosConfig';
import { useEffect, useState } from 'react';
import { Badge, Button, Flex, Space, Tabs, Tag, theme, Tooltip, Typography, Watermark } from 'antd';
import { gLang } from '@common/language';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
    CarryOutOutlined,
    ContainerOutlined,
    HomeOutlined,
    IssuesCloseOutlined,
    VideoCameraOutlined,
    MessageOutlined,
} from '@ant-design/icons';
import { useAuth } from '@common/contexts/AuthContext';
import { Ticket, TicketCountPublic } from '@ecuc/shared/types/ticket.types';
import TicketQuery from '../../ticket/TicketQuery';
import TicketListComponent from '../../../../components/TicketListComponent';
import { useTicketStatusUpdate, useTicketCountUpdate } from '@common/hooks/useTicketStatusUpdate';

const TICKET_SIDEBAR_TAB_KEY = 'admin_ticket_sidebar_tab';

const AdminPCSidebar = () => {
    const { Title } = Typography;
    const { tid } = useParams();
    const { useToken } = theme;
    const { token } = useToken();
    const [ticketList, setTicketList] = useState<{
        done: Ticket[];
        inProgress: Ticket[];
    }>({ done: [], inProgress: [] });
    const [ticketCount, setTicketCount] = useState<TicketCountPublic>();
    const [isSpinning, setIsSpinning] = useState(true);
    const [activeTab, setActiveTab] = useState<string>(
        () => sessionStorage.getItem(TICKET_SIDEBAR_TAB_KEY) || 'my'
    );
    const { pathname } = useLocation();
    const countUpdateTrigger = useTicketCountUpdate();

    // 仅根据明确的列表页路由同步 Tab；工单操作页 /ticket/operate/* 不根据 URL 改 Tab，保持前端缓存
    useEffect(() => {
        if (pathname.startsWith('/ticket/query')) {
            setActiveTab('query');
            sessionStorage.setItem(TICKET_SIDEBAR_TAB_KEY, 'query');
        }
        // /ticket/my 和 /ticket/assign 不强制切换 tab，保持前端缓存状态
    }, [pathname]);

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        sessionStorage.setItem(TICKET_SIDEBAR_TAB_KEY, key);
    };

    // 使用实时更新hook
    const updatedInProgressTickets = useTicketStatusUpdate(ticketList.inProgress);
    const updatedDoneTickets = useTicketStatusUpdate(ticketList.done);

    useEffect(() => {
        fetchData({
            url: '/ticket/count',
            method: 'GET',
            data: { type: 'admin' },
            setData: setTicketCount,
        }).then();
        fetchData({
            url: '/ticket/adminMy',
            method: 'GET',
            data: {},
            setData: setTicketList,
            setSpin: setIsSpinning,
        }).then();
    }, [pathname, countUpdateTrigger]);

    const { user } = useAuth();

    return (
        <Watermark
            content={user?.openid}
            font={{ color: 'rgba(0,0,0,.05)' }}
            gap={[10, 10]}
            style={{ display: 'flex', flex: 1, overflow: 'visible' }}
        >
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Flex align="start" justify="space-between">
                        <Title level={4}>{gLang('adminMain.group.ticket')}</Title>
                        <Link to={'/'}>
                            <Tooltip title={gLang('dashboard.admin')}>
                                <Button
                                    type="text"
                                    icon={<HomeOutlined />}
                                    style={{ height: 28, width: 28 }}
                                />
                            </Tooltip>
                        </Link>
                    </Flex>
                    <Link to={'/ticket/assign/my'}>
                        <Badge
                            dot={(ticketCount?.count_waiting_my?.my ?? 0) > 0}
                            styles={{
                                root: { width: '100%' },
                                indicator: { width: 12, height: 12 },
                            }}
                        >
                            <Button
                                size="large"
                                type={ticketCount?.count_waiting_my?.my ? 'primary' : 'default'}
                                block
                                icon={<CarryOutOutlined />}
                            >
                                {gLang('adminMain.ticket.my', {
                                    count: ticketCount?.count_waiting_my?.my ?? 0,
                                })}
                            </Button>
                        </Badge>
                    </Link>
                    <Link to={'/ticket/assign/upgrade'}>
                        <Badge
                            dot={(ticketCount?.count_waiting_my?.upgrade ?? 0) > 0}
                            styles={{
                                root: { width: '100%' },
                                indicator: { width: 12, height: 12 },
                            }}
                        >
                            <Button size="large" block icon={<IssuesCloseOutlined />}>
                                {gLang('adminMain.ticket.upgrade', {
                                    count: ticketCount?.count_waiting_my?.upgrade ?? 0,
                                })}
                            </Button>
                        </Badge>
                    </Link>
                    <Link to={'/ticket/assign/unassigned'}>
                        <Badge
                            dot={(ticketCount?.count_waiting_my?.unassigned ?? 0) > 0}
                            styles={{
                                root: { width: '100%' },
                                indicator: { width: 12, height: 12 },
                            }}
                        >
                            <Button size="large" block icon={<ContainerOutlined />}>
                                {gLang('adminMain.ticket.unassigned', {
                                    count: ticketCount?.count_waiting_my?.unassigned ?? 0,
                                })}
                            </Button>
                        </Badge>
                    </Link>
                    {/* 新增媒体管理中心按钮（PC端） */}
                    {user?.permission?.includes('ticket.media') ? (
                        <Link to={'/media'}>
                            <Badge styles={{ root: { width: '100%' } }}>
                                <Button size="large" block icon={<VideoCameraOutlined />}>
                                    {gLang('adminMain.ticket.media')}
                                </Button>
                            </Badge>
                        </Link>
                    ) : (
                        <></>
                    )}
                    {/* 反馈管理中心按钮 */}
                    <Link to="/feedback">
                        <Badge styles={{ root: { width: '100%' } }}>
                            <Button
                                size="large"
                                block
                                icon={<MessageOutlined />}
                                type={pathname.startsWith('/feedback') ? 'primary' : 'default'}
                            >
                                {gLang('feedback.manageTitle')}
                            </Button>
                        </Badge>
                    </Link>
                </Space>
                <Tabs
                    activeKey={activeTab}
                    onChange={handleTabChange}
                    items={[
                        {
                            key: 'my',
                            label: gLang('adminMain.my'),
                            children: (
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Flex align="start" gap={6}>
                                        <Title level={4}>{gLang('ticketMyAdmin.inProgress')}</Title>
                                        {ticketList?.inProgress && (
                                            <Tag color="blue" style={{ marginTop: 4 }}>
                                                {ticketList.inProgress.length}
                                            </Tag>
                                        )}
                                    </Flex>
                                    <TicketListComponent
                                        tickets={updatedInProgressTickets}
                                        to={ticket => `/ticket/operate/backToMy/${ticket.tid}`}
                                        loading={isSpinning}
                                        selectedTid={tid}
                                        highlightColor={token.colorPrimary}
                                    />
                                    <Title level={4}>{gLang('ticketMyAdmin.done')}</Title>
                                    <TicketListComponent
                                        tickets={updatedDoneTickets}
                                        to={ticket => `/ticket/operate/backToMy/${ticket.tid}`}
                                        loading={isSpinning}
                                        selectedTid={tid}
                                        highlightColor={token.colorPrimary}
                                    />
                                </Space>
                            ),
                        },
                        {
                            key: 'query',
                            label: gLang('adminMain.query'),
                            children: (
                                <Flex vertical style={{ marginTop: 8 }}>
                                    <TicketQuery type="common" />
                                </Flex>
                            ),
                        },
                    ]}
                />
            </Space>
        </Watermark>
    );
};

export default AdminPCSidebar;

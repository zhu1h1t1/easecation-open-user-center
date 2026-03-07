// 媒体中心的侧边栏组件

import { fetchData } from '@common/axiosConfig';
import { useEffect, useState } from 'react';
import { Badge, Button, Flex, Space, Tabs, Tag, Tooltip, Typography, Watermark } from 'antd';
import { gLang } from '@common/language';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
    CarryOutOutlined,
    ContactsOutlined,
    ContainerOutlined,
    HomeOutlined,
    IssuesCloseOutlined,
    LikeOutlined,
    UpCircleOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';
import { useAuth } from '@common/contexts/AuthContext';
import { MediaTicketCountPublic, Ticket } from '@ecuc/shared/types/ticket.types';
import TicketQuery from '../../ticket/TicketQuery';
import TicketListComponent from '../../../../components/TicketListComponent';
import { useTicketStatusUpdate, useTicketCountUpdate } from '@common/hooks/useTicketStatusUpdate';

const MEDIA_TICKET_SIDEBAR_TAB_KEY = 'media_ticket_sidebar_tab';

const MediaPCSidebar = () => {
    const { Title } = Typography;
    const [ticketList, setTicketList] = useState<{
        done: Ticket[];
        inProgress: Ticket[];
    }>({ done: [], inProgress: [] });
    const [ticketCount, setTicketCount] = useState<MediaTicketCountPublic>();
    const [isSpinning, setIsSpinning] = useState(true);
    const [activeTab, setActiveTab] = useState<string>(
        () => sessionStorage.getItem(MEDIA_TICKET_SIDEBAR_TAB_KEY) || 'my'
    );

    const { pathname } = useLocation();
    const { tid } = useParams();

    // 仅根据明确的列表页路由同步 Tab；工单操作页 /media/ticket/operate/* 不根据 URL 改 Tab，保持前端缓存
    useEffect(() => {
        if (pathname.startsWith('/media/ticket/query')) {
            setActiveTab('query');
            sessionStorage.setItem(MEDIA_TICKET_SIDEBAR_TAB_KEY, 'query');
        }
        // /media/ticket/my 和 /media/ticket/assign 不强制切换 tab，保持前端缓存状态
    }, [pathname]);

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        sessionStorage.setItem(MEDIA_TICKET_SIDEBAR_TAB_KEY, key);
    };

    // 使用实时更新hook
    const updatedInProgressTickets = useTicketStatusUpdate(ticketList.inProgress);
    const updatedDoneTickets = useTicketStatusUpdate(ticketList.done);
    const countUpdateTrigger = useTicketCountUpdate();

    useEffect(() => {
        fetchData({
            url: '/ticket/media/count',
            method: 'GET',
            data: { type: 'admin' },
            setData: value => {
                setTicketCount(value);
            },
        }).then();
        fetchData({
            url: '/ticket/media/adminMy',
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
                        <Title level={4}>{gLang('mediaAdmin.title')}</Title>
                        <Space>
                            <Link to={'/media'}>
                                <Tooltip title={gLang('adminMain.mediaSidebar.mediaHomepage')}>
                                    <Button
                                        type="text"
                                        icon={<VideoCameraOutlined />}
                                        style={{ height: 28, width: 28 }}
                                    />
                                </Tooltip>
                            </Link>
                            <Link to={'/'}>
                                <Tooltip title={gLang('dashboard.admin')}>
                                    <Button
                                        type="text"
                                        icon={<HomeOutlined />}
                                        style={{ height: 28, width: 28 }}
                                    />
                                </Tooltip>
                            </Link>
                        </Space>
                    </Flex>
                    {/* 我的处理队列 */}
                    <Link to={'/media/ticket/assign/myMedia'}>
                        <Badge
                            dot={(ticketCount?.count_waiting_my?.my ?? 0) > 0}
                            styles={{
                                root: { width: '100%' },
                                indicator: { width: 12, height: 12 },
                            }}
                        >
                            <Button
                                size="large"
                                type={
                                    (ticketCount?.count_waiting_my?.my ?? 0) > 0
                                        ? 'primary'
                                        : 'default'
                                }
                                block
                                icon={<ContainerOutlined />}
                            >
                                {gLang('adminMain.mediaTicket.myProcessingQueue', {
                                    count: ticketCount?.count_waiting_my?.my ?? 0,
                                })}
                            </Button>
                        </Badge>
                    </Link>
                    {/* 媒体审核 */}
                    <Link to={'/media/ticket/assign/auditMedia'}>
                        <Badge
                            dot={(ticketCount?.count_waiting_audit ?? 0) > 0}
                            styles={{
                                root: { width: '100%' },
                                indicator: { width: 12, height: 12 },
                            }}
                        >
                            <Button size="large" type="default" block icon={<CarryOutOutlined />}>
                                {gLang('adminMain.mediaTicket.mediaAudit', {
                                    count: ticketCount?.count_waiting_audit ?? 0,
                                })}
                            </Button>
                        </Badge>
                    </Link>
                    {/* E点申请 */}
                    <Link to={'/media/ticket/assign/monthlyMedia'}>
                        <Badge
                            dot={(ticketCount?.count_waiting_monthly ?? 0) > 0}
                            styles={{
                                root: { width: '100%' },
                                indicator: { width: 12, height: 12 },
                            }}
                        >
                            <Button
                                size="large"
                                type="default"
                                block
                                icon={<IssuesCloseOutlined />}
                            >
                                {gLang('adminMain.mediaTicket.monthlyMediaReview', {
                                    count: ticketCount?.count_waiting_monthly ?? 0,
                                })}
                            </Button>
                        </Badge>
                    </Link>
                    {/* 修改兑奖账号 */}
                    <Link to={'/media/ticket/assign/updateMedia'}>
                        <Badge
                            dot={(ticketCount?.count_waiting_update ?? 0) > 0}
                            styles={{
                                root: { width: '100%' },
                                indicator: { width: 12, height: 12 },
                            }}
                        >
                            <Button size="large" type="default" block icon={<ContactsOutlined />}>
                                {gLang('adminMain.mediaTicket.changePermissionNumber', {
                                    count: ticketCount?.count_waiting_update ?? 0,
                                })}
                            </Button>
                        </Badge>
                    </Link>
                    {/* 媒体活动 */}
                    <Link to={'/media/ticket/assign/mediaEvent'}>
                        <Badge
                            dot={(ticketCount?.count_waiting_event ?? 0) > 0}
                            styles={{
                                root: { width: '100%' },
                                indicator: { width: 12, height: 12 },
                            }}
                        >
                            <Button size="large" type="default" block icon={<LikeOutlined />}>
                                {gLang('adminMain.mediaTicket.mediaEvent', {
                                    count: ticketCount?.count_waiting_event ?? 0,
                                })}
                            </Button>
                        </Badge>
                    </Link>
                    {/* 升级队列 */}
                    <Link to={'/media/ticket/assign/upgradeMedia'}>
                        <Badge
                            dot={(ticketCount?.count_waiting_my?.upgrade ?? 0) > 0}
                            styles={{
                                root: { width: '100%' },
                                indicator: { width: 12, height: 12 },
                            }}
                        >
                            <Button size="large" block icon={<UpCircleOutlined />} type="default">
                                {gLang('adminMain.mediaTicket.upgradeQueue', {
                                    count: ticketCount?.count_waiting_my?.upgrade ?? 0,
                                })}
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
                            label: gLang('mediaAdmin.ticket.my'),
                            children: (
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
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
                                        to={ticket =>
                                            `/media/ticket/operate/backToMy/${ticket.tid}`
                                        }
                                        style={{}}
                                        loading={isSpinning}
                                        selectedTid={tid}
                                        highlightColor={'#1677ff'}
                                    />
                                    <Title level={4}>{gLang('ticketMyAdmin.done')}</Title>
                                    <TicketListComponent
                                        tickets={updatedDoneTickets}
                                        to={ticket =>
                                            `/media/ticket/operate/backToMy/${ticket.tid}`
                                        }
                                        style={{}}
                                        loading={isSpinning}
                                        selectedTid={tid}
                                        highlightColor={'#1677ff'}
                                    />
                                </Space>
                            ),
                        },
                        {
                            key: 'query',
                            label: gLang('mediaAdmin.ticket.query'),
                            children: (
                                <Flex vertical style={{ marginTop: 8 }}>
                                    <TicketQuery type="media" />
                                </Flex>
                            ),
                        },
                    ]}
                />
            </Space>
        </Watermark>
    );
};

export default MediaPCSidebar;

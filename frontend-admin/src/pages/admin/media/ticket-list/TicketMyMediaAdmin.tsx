// 媒体管理的工单列表页面

import { fetchData } from '@common/axiosConfig';
import React, { useEffect, useState } from 'react';
import { Flex, Space, Tag, Typography } from 'antd';
import { gLang } from '@common/language';
import TicketListComponent from '../../../../components/TicketListComponent';
import { Ticket } from '@ecuc/shared/types/ticket.types';
import { useTicketStatusUpdate, useTicketCountUpdate } from '@common/hooks/useTicketStatusUpdate';

const TicketMyMediaAdmin = () => {
    const { Title, Paragraph } = Typography;
    const [ticketList, setTicketList] = useState<{
        done: Ticket[];
        inProgress: Ticket[];
    }>({ done: [], inProgress: [] });
    const [isSpinning, setIsSpinning] = useState(true);

    // 使用实时更新hook
    const updatedInProgressTickets = useTicketStatusUpdate(ticketList.inProgress);
    const updatedDoneTickets = useTicketStatusUpdate(ticketList.done);
    const countUpdateTrigger = useTicketCountUpdate();

    useEffect(() => {
        fetchData({
            url: '/ticket/media/adminMy',
            method: 'GET',
            data: {},
            setData: setTicketList,
            setSpin: setIsSpinning,
        });
    }, [countUpdateTrigger]);

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <Typography>
                <Title>{gLang('mediaAdmin.ticket.title')}</Title>
                <Paragraph>{gLang('mediaAdmin.ticket.intro')}</Paragraph>
            </Typography>

            <Flex align="start" gap={6}>
                <Title level={3}>{gLang('ticketMyAdmin.inProgress')}</Title>
                {ticketList?.inProgress && (
                    <Tag color="blue" style={{ marginTop: 8 }}>
                        {ticketList.inProgress.length}
                    </Tag>
                )}
            </Flex>

            <TicketListComponent
                tickets={updatedInProgressTickets}
                to={ticket => `/media/ticket/operate/backToMy/${ticket.tid}`}
                loading={isSpinning}
                style={{}}
            />

            <Title level={3}>{gLang('ticketMyAdmin.done')}</Title>
            <TicketListComponent
                tickets={updatedDoneTickets}
                to={ticket => `/media/ticket/operate/backToMy/${ticket.tid}`}
                loading={isSpinning}
                style={{}}
            />
        </Space>
    );
};

export default TicketMyMediaAdmin;

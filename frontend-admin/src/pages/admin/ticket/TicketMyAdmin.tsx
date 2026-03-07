// 我负责的工单

import { fetchData } from '@common/axiosConfig';
import React, { useEffect, useState } from 'react';
import { Space, Typography } from 'antd';
import { gLang } from '@common/language';
import TicketListComponent from '../../../components/TicketListComponent';
import { Ticket } from '@ecuc/shared/types/ticket.types';
import { useTicketStatusUpdate, useTicketCountUpdate } from '@common/hooks/useTicketStatusUpdate';

const TicketMyAdmin = () => {
    const { Title, Paragraph } = Typography;
    const [ticketList, setTicketList] = useState<{
        done: Ticket[];
        inProgress: Ticket[];
    }>({ done: [], inProgress: [] });
    const [isSpinning, setIsSpinning] = useState(false);

    // 使用实时更新hook
    const updatedInProgressTickets = useTicketStatusUpdate(ticketList.inProgress);
    const updatedDoneTickets = useTicketStatusUpdate(ticketList.done);
    const countUpdateTrigger = useTicketCountUpdate();

    useEffect(() => {
        setIsSpinning(true);
        fetchData({
            url: '/ticket/adminMy',
            method: 'GET',
            data: {},
            setData: setTicketList,
            setSpin: setIsSpinning,
        });
    }, [countUpdateTrigger]);
    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <Typography>
                <Title>{gLang('ticketMyAdmin.title')}</Title>
                <Paragraph>{gLang('ticketMyAdmin.intro')}</Paragraph>
            </Typography>
            <Title level={3}>{gLang('ticketMyAdmin.inProgress')}</Title>
            <TicketListComponent
                tickets={updatedInProgressTickets}
                to={ticket => `/ticket/operate/backToMy/${ticket.tid}`}
                loading={isSpinning}
            />
            <Title level={3}>{gLang('ticketMyAdmin.done')}</Title>
            <TicketListComponent
                tickets={updatedDoneTickets}
                to={ticket => `/ticket/operate/backToMy/${ticket.tid}`}
                loading={isSpinning}
            />
        </Space>
    );
};

export default TicketMyAdmin;

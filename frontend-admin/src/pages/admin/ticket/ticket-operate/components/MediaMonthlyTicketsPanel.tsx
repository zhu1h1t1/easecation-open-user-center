// E点申请相关工单面板组件

import React, { useState, useEffect } from 'react';
import { fetchData } from '@common/axiosConfig';
import { Ticket, TicketSimple, TicketType } from '@ecuc/shared/types/ticket.types';
import TicketListPanel from '../../../media/media-list/components/TicketListPanel';
import { gLang } from '@common/language';
import { message } from 'antd';

interface MediaMonthlyTicketsPanelProps {
    ticket: Ticket;
}

const MediaMonthlyTicketsPanel: React.FC<MediaMonthlyTicketsPanelProps> = ({ ticket }) => {
    const [relatedTickets, setRelatedTickets] = useState<TicketSimple[]>([]);
    const [loading, setLoading] = useState(false);
    const [messageApi, messageContextHolder] = message.useMessage();

    // 获取相关工单
    const fetchRelatedTickets = async () => {
        if (!ticket || ticket.type !== TicketType.MediaMonthlyReport) return;

        setLoading(true);
        try {
            await fetchData({
                url: '/ticket/listByOpenIdAndType',
                method: 'POST',
                data: {
                    ticketType: TicketType.MediaMonthlyReport,
                    period: 'month',
                },
                setData: (data: TicketSimple[]) => {
                    // 过滤掉当前工单
                    const filteredTickets = data.filter(t => t.tid !== ticket.tid);
                    setRelatedTickets(filteredTickets);
                },
                setSpin: setLoading,
            });
        } catch (error) {
            messageApi.error(gLang('admin.mediaRelatedTicketsFailed') + JSON.stringify(error));
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRelatedTickets();
    }, [ticket]);

    // 只有当工单类型为 MediaMonthlyReport 时才显示
    if (ticket.type !== TicketType.MediaMonthlyReport) {
        return null;
    }

    return (
        <>
            {messageContextHolder}
            <TicketListPanel
                title={gLang('mediaAdmin.ticket.monthlyMediaReview')}
                tickets={relatedTickets as Ticket[]}
                loading={loading}
                defaultCollapsed={true}
                onTicketClick={_tid => {}}
            />
        </>
    );
};

export default MediaMonthlyTicketsPanel;

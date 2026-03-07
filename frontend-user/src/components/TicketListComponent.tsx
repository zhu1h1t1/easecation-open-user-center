// 工单列表组件

import React from 'react';
import CardWithBadgeComponent from './CardWithBadgeComponent';
import { Ticket } from '@ecuc/shared/types/ticket.types';
import {
    ltransTicketPriority,
    ltransTicketStatusColor,
    ltransTicketStatusForUser,
} from '@common/languageTrans';
import { Skeleton, Space } from 'antd';

interface TicketListComponentProps {
    tickets?: Ticket[];
    style?: React.CSSProperties;
    to?: (ticket: Ticket) => string;
    loading?: boolean;
    onTicketClick?: (tid: number) => void;
    badgeText?: string | ((ticket: Ticket) => string);
    badgeColor?: string | ((ticket: Ticket) => string);
    selectedTid?: string | number;
    highlightColor?: string;
    subTitle?: (ticket: Ticket) => React.ReactNode;
    title?: string | ((ticket: Ticket) => string); // 支持自定义标题
    isAdmin?: boolean; // Whether the viewer is admin
}

const TicketListComponent: React.FC<TicketListComponentProps> = ({
    tickets,
    style,
    to,
    loading,
    onTicketClick,
    badgeText,
    badgeColor,
    selectedTid,
    highlightColor,
    subTitle,
    title,
    isAdmin = true, // Default to admin view for backward compatibility
}) => {
    if (loading) {
        return <Skeleton active paragraph={{ rows: 2 }} style={{ width: '100%', ...style }} />;
    }
    if (tickets === undefined) {
        return <Skeleton active paragraph={{ rows: 2 }} style={{ width: '100%', ...style }} />;
    }
    if (!tickets || tickets.length === 0) {
        return null;
    }

    return (
        <Space direction="vertical" size={4} style={{ width: '100%', ...style }}>
            {tickets.map(ticket => (
                <CardWithBadgeComponent
                    key={ticket.tid}
                    title={typeof title === 'function' ? title(ticket) : (title ?? ticket.title)}
                    subTitle={
                        subTitle
                            ? subTitle(ticket) || undefined
                            : `TID#${ticket.tid} - ${ltransTicketPriority(ticket.priority)}`
                    }
                    loading={false}
                    to={to ? to(ticket) : `/ticket/${ticket.tid}`}
                    badgeText={
                        typeof badgeText === 'function'
                            ? badgeText(ticket)
                            : (badgeText ??
                              ltransTicketStatusForUser(
                                  ticket.status,
                                  ticket.priority,
                                  isAdmin,
                                  ticket.type
                              ))
                    }
                    badgeColor={
                        typeof badgeColor === 'function'
                            ? badgeColor(ticket)
                            : (badgeColor ?? ltransTicketStatusColor(ticket.status))
                    }
                    isHoverable
                    onClick={onTicketClick ? () => onTicketClick(ticket.tid) : undefined}
                    style={
                        selectedTid?.toString() === ticket.tid.toString()
                            ? {
                                  borderColor: highlightColor ?? '#1677ff',
                                  boxShadow: `0 0 0 2px ${highlightColor ?? '#1677ff'}30`,
                              }
                            : undefined
                    }
                />
            ))}
        </Space>
    );
};

export default TicketListComponent;

import { useEffect, useState } from 'react';
import { Ticket, TicketStatus } from '@ecuc/shared/types/ticket.types';

// 全局状态管理，用于存储工单状态更新
let ticketStatusListeners: Array<(tid: number, status: string) => void> = [];
let ticketCountListeners: Array<() => void> = [];

// 订阅工单状态更新
export const subscribeToTicketStatusUpdate = (callback: (tid: number, status: string) => void) => {
    ticketStatusListeners.push(callback);
    return () => {
        ticketStatusListeners = ticketStatusListeners.filter(listener => listener !== callback);
    };
};

// 订阅工单数量更新
export const subscribeToTicketCountUpdate = (callback: () => void) => {
    ticketCountListeners.push(callback);
    return () => {
        ticketCountListeners = ticketCountListeners.filter(listener => listener !== callback);
    };
};

// 通知工单状态更新
export const notifyTicketStatusUpdate = (tid: number, status: string) => {
    ticketStatusListeners.forEach(listener => listener(tid, status));
};

// 通知工单数量更新
export const notifyTicketCountUpdate = () => {
    ticketCountListeners.forEach(listener => listener());
};

// 自定义hook，用于在组件中订阅工单状态更新
export const useTicketStatusUpdate = (tickets?: Ticket[]) => {
    const [updatedTickets, setUpdatedTickets] = useState<Ticket[]>(tickets || []);

    useEffect(() => {
        if (!tickets) return;

        setUpdatedTickets(tickets);

        const unsubscribe = subscribeToTicketStatusUpdate((tid, status) => {
            setUpdatedTickets(prevTickets =>
                prevTickets.map(ticket =>
                    ticket.tid === tid ? { ...ticket, status: status as TicketStatus } : ticket
                )
            );
        });

        return unsubscribe;
    }, [tickets]);

    return updatedTickets;
};

// 自定义hook，用于在组件中订阅工单数量更新
export const useTicketCountUpdate = () => {
    const [updateTrigger, setUpdateTrigger] = useState(0);

    useEffect(() => {
        const unsubscribe = subscribeToTicketCountUpdate(() => {
            setUpdateTrigger(prev => prev + 1);
        });

        return unsubscribe;
    }, []);

    return updateTrigger;
};

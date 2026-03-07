import { Ticket, TicketType } from '@ecuc/shared/types/ticket.types';

// 显示媒体账号快捷面板的工单
export const ticketWithCreator = (ticket: Ticket) => {
    return [
        TicketType.MediaMonthlyReport,
        TicketType.MediaAudit,
        TicketType.MediaBinding,
        TicketType.MediaApplyBinding,
        TicketType.MediaUpdate,
        TicketType.MediaEvents,
    ].includes(ticket.type);
};

// 显示工单发起人ECID快捷面板的工单
export const ticketWithInitiator = (ticket: Ticket) => {
    return ![
        TicketType.Consultation,
        TicketType.MediaMonthlyReport,
        TicketType.MediaAudit,
        TicketType.MediaBinding,
        TicketType.MediaApplyBinding,
    ].includes(ticket.type);
};

// 显示工单目标ECID快捷面板的工单
export const ticketWithTarget = (ticket: Ticket) => {
    return [
        TicketType.ReportPlayer,
        TicketType.MediaMonthlyReport,
        TicketType.MediaAudit,
        TicketType.Others,
        TicketType.MediaApplyBinding,
        TicketType.MediaUpdate,
    ].includes(ticket.type);
};

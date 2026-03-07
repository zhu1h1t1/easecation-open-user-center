// 工单页面Meta信息生成工具
import { Ticket, TicketType } from '@ecuc/shared/types/ticket.types';
import {
    TICKET_TYPE_NAME_MAP,
    TICKET_STATUS_NAME_MAP,
} from '@ecuc/shared/constants/ticket.constants';
import { gLang } from '../language';

// 工单状态名称映射
interface TicketMetaInfo {
    title: string;
    description: string;
    type: string;
}

// 检查工单类型并生成描述
export const checkTicketType = (ticket: Ticket): string => {
    const typeName = TICKET_TYPE_NAME_MAP[ticket.type] || gLang('ticketMeta.unknownType');
    let description: string;
    if (ticket.type === TicketType.Suggestion || ticket.type === TicketType.Consultation) {
        // 建议与反馈、游戏玩法咨询：TID、类型和标题
        description = `TID#${ticket.tid} - ${typeName}`;
        if (ticket.title) {
            description += ` - ${ticket.title}`;
        }
    } else {
        // 其他类型：TID和类型
        description = `TID#${ticket.tid} - ${typeName}`;
    }
    return description;
};

/**
 * 为管理员工单操作页面生成Meta信息
 */
export const generateAdminTicketMeta = (ticket: Ticket): TicketMetaInfo => {
    const typeName = TICKET_TYPE_NAME_MAP[ticket.type] || gLang('ticketMeta.unknownType');
    const description = checkTicketType(ticket);
    // 标签页标题：TID、类型和工单标题
    let title = `TID#${ticket.tid} - ${typeName}`;
    if (ticket.title) {
        title += ` - ${ticket.title}`;
    }

    return {
        title,
        description,
        type: 'article',
    };
};

/**
 * 为用户工单详情页面生成Meta信息
 */
export const generateUserTicketMeta = (ticket: Ticket): TicketMetaInfo => {
    const typeName = TICKET_TYPE_NAME_MAP[ticket.type] || gLang('ticketMeta.unknownType');
    const statusName = TICKET_STATUS_NAME_MAP[ticket.status] || gLang('ticketMeta.unknownStatus');
    var description = checkTicketType(ticket);

    // 标签页标题：TID、类型和工单标题
    let title = `TID#${ticket.tid} - ${typeName}`;
    if (ticket.title) {
        title += ` - ${ticket.title}`;
    }

    // 添加状态信息到描述中
    description += gLang('ticketMeta.statusLabel', { statusName });

    return {
        title,
        description,
        type: 'article',
    };
};

/**
 * 为工单快照页面生成Meta信息
 */
export const generateSnapshotTicketMeta = (ticket: Ticket): TicketMetaInfo => {
    const typeName = TICKET_TYPE_NAME_MAP[ticket.type] || gLang('ticketMeta.unknownType');
    var description = checkTicketType(ticket);

    // 标签页标题：TID、类型和工单标题
    let title = `TID#${ticket.tid} - ${typeName}`;
    if (ticket.title) {
        title += ` - ${ticket.title}`;
    }

    // 标记为工单快照
    description += gLang('ticketMeta.ticketSnapshot');

    return {
        title,
        description,
        type: 'article',
    };
};

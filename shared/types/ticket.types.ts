/**
 * 工单账户信息
 */
export interface TicketAccount {
    /** 账户ID */
    id: string;
    /** 显示名称 */
    display: string;
}

/**
 * 工单类型枚举
 */
export enum TicketType {
    /** 空值类型（未选择） */
    None = '',
    /** 误判申诉 */
    Argument = 'AG',
    /** 管理员申请 */
    Application = 'AP',
    /** 举报玩家 */
    ReportPlayer = 'RP',
    /** 商品补发 */
    ResendProduct = 'SP',
    /** 工单账号解冻申请 */
    WeChatUnfreeze = 'AW',
    /** 玩法咨询 */
    Consultation = 'OP',
    /** 建议 */
    Suggestion = 'JY',
    /** 举报员工 */
    ReportStaff = 'RS',
    /** 媒体绑定（已弃用） */
    MediaBinding = 'MB',
    /** 媒体审核（已弃用） */
    MediaAudit = 'MA',
    /** 媒体申请绑定 */
    MediaApplyBinding = 'AB',
    /** 媒体商城（E点申请） */
    MediaMonthlyReport = 'MM',
    /** 媒体兑奖账号变更 */
    MediaUpdate = 'MU',
    /** 其他服务 */
    Others = 'OT',
    /** 媒体活动 */
    MediaEvents = 'ME',
    /** WIKI绑定 */
    WikiBinding = 'WB',
    /** 反馈 */
    Feedback = 'GU',
    /** 裁决 */
    Judgement = 'JG',
    /** 人工复审 */
    ManualReview = 'MR',
}

/**
 * 工单操作类型枚举
 */
export enum TicketAction {
    /** 回复 */
    Reply = 'R',
    /** 备注 */
    Note = 'N',
    /** 撤回 */
    Withdraw = 'W',
    /** 升级 */
    Upgrade = 'U',
    /** 分配 */
    Distribute = 'D',
}

/**
 * 工单状态枚举
 */
export enum TicketStatus {
    /** 待分配 */
    WaitingAssign = 'O',
    /** 待回复 */
    WaitingReply = 'W',
    /** 待客服回复 */
    WaitingStaffReply = 'X',
    /** 自动接受 */
    AutoAccept = 'A',
    /** 自动拒绝 */
    AutoReject = 'B',
    /** 拒绝 */
    Reject = 'R',
    /** 接受 */
    Accept = 'P',
    /** 用户取消 */
    UserCancel = 'D',
    /** 申请转交中 */
    Entrust = 'E',
}

/**
 * 工单转交状态枚举
 */
export enum TicketEntrustStatus {
    /** 待处理 */
    Pending = '0',
    /** 已接受 */
    Approved = '1',
    /** 已拒绝 */
    Rejected = '2',
}

/**
 * 工单优先级枚举
 * 数值越小优先级越高
 */
export enum TicketPriority {
    /** 人工升级通道 */
    Upgrade = 15,
    /** 工单账号解冻申请 */
    WeChatUnfreeze = 25,
    /** 申请E点通道 */
    MediaShop = 27,
    /** 媒体审核 */
    MediaAudit = 28,
    /** 创作者快速通道 */
    MediaFast = 33,
    /** 创作者普通通道 */
    MediaNormal = 35,
    /** VIP 4 专属通道 */
    Vip4 = 43,
    /** VIP 3 专属通道 */
    Vip3 = 44,
    /** 常规通道 */
    Normal = 95,
}

/**
 * 工单完整信息
 */
export type Ticket = {
    /** 工单ID */
    tid: number;
    /** 优先级 */
    priority: TicketPriority;
    /** 工单类型 */
    type: TicketType;
    /** 标题 */
    title: string;
    /** 创建者OpenID */
    creator_openid: string;
    /** 发起人 */
    initiator: string;
    /** 目标对象 */
    target: string;
    /** IP地址 */
    ip: string;
    /** 工单状态 */
    status: TicketStatus;
    /** 创建时间 */
    create_time: string;
    /** 分配时间 */
    assigned_time?: string;
    /** 完成时间 */
    complete_time?: string;
    /** 优先级升级时间 */
    priority_upgrade_time?: string;
    /** 顾问用户ID */
    advisor_uid?: string;
    /** 是否为重点工单 */
    is_key?: boolean;
    /** 工单中使用的别名字典 {uid: alias_id} */
    staff_alias?: string | Record<string, number>;
    /** 工单详情列表 */
    details?: TicketDetail[];
};

/**
 * 工单简化信息
 */
export type TicketSimple = {
    /** 工单ID */
    tid: number;
    /** 状态 */
    status: TicketStatus;
    /** 类型 */
    type: TicketType;
    /** 标题 */
    title: string;
    /** 优先级 */
    priority: TicketPriority;
    /** 创建时间 */
    create_time?: string;
    /** 工单详情列表（在public模式支持显示detail） */
    details?: TicketSimpleDetail[];
};

/** 反馈列表项（/feedback/list 与 /feedback/subscriptions 统一返回格式） */
export type FeedbackListItemDto = {
    tid: number;
    status: TicketStatus;
    type: TicketType;
    title: string;
    priority: TicketPriority;
    create_time: string;
    /** 标签，来自 feedback_meta.tag */
    tag: string;
    /** 建议/BUG，来自 feedback_meta.type */
    feedbackType: 'SUGGESTION' | 'BUG';
    /** 最近一条回复时间 */
    lastReplyTime: string | null;
    /** 回复总条数（含主帖后的回复） */
    replyCount: number;
};

/**
 * 反馈完整信息
 */
export type Feedback = {
    /** 工单ID */
    tid: number;
    /** 优先级 */
    priority: TicketPriority;
    /** 工单类型 */
    type: TicketType;
    /** 标题 */
    title: string;
    /** 创建者OpenID */
    creator_openid: string;
    /** 发起人 */
    initiator: string;
    /** 目标对象 */
    target: string;
    /** IP地址 */
    ip: string;
    /** 工单状态 */
    status: TicketStatus;
    /** 创建时间 */
    create_time: string;
    /** 分配时间 */
    assigned_time?: string;
    /** 完成时间 */
    complete_time?: string;
    /** 优先级升级时间 */
    priority_upgrade_time?: string;
    /** 顾问用户ID */
    advisor_uid?: string;
    /** 是否为重点工单 */
    is_key?: boolean;
    /** 工单中使用的别名字典 {uid: alias_id} */
    staff_alias?: string | Record<string, number>;
    /** 工单详情列表 */
    details?: TicketDetail[];
    /** 标签，来自 feedback_meta.tag */
    tag: string;
    /** 建议/BUG，来自 feedback_meta.type */
    feedbackType: 'SUGGESTION' | 'BUG';
    /** 最近一条回复时间 */
    lastReplyTime: string | null;
    /** 回复总条数（含主帖后的回复） */
    replyCount: number;
};

/**
 * 工单简化详情
 */
export type TicketSimpleDetail = {
    /** 内容 */
    content: string;
    /** 显示标题 */
    displayTitle: string;
    /** 是否官方回复 */
    isOfficial?: boolean;
    /** 原始操作人标识 */
    operator?: string;
};

/**
 * 工单详情原始数据
 */
export type TicketDetailRaw = {
    /** 详情ID */
    id: number;
    /** 工单ID */
    tid: number;
    /** 显示标题 */
    displayTitle: string;
    /** 操作类型 */
    action: TicketAction;
    /** 操作者 */
    operator: string;
    /** 内容 */
    content: string;
    /** 附件（字符串格式） */
    attachments: string;
    /** IP地址 */
    ip: string;
    /** 创建时间 */
    create_time: string;
    /** 是否官方回复 */
    isOfficial?: boolean;
};

/**
 * 工单详情
 */
export type TicketDetail = {
    /** 详情ID */
    id: number;
    /** 工单ID */
    tid: number;
    /** 显示标题 */
    displayTitle: string;
    /** 操作类型 */
    action: TicketAction;
    /** 操作者 */
    operator: string;
    /** 内容（原始 Markdown） */
    content: string;
    /** 内容 HTML（后端 Markdown 解析，供管理端展示，含字号/颜色） */
    contentHtml?: string;
    /** 内容 HTML 用户端（后端 Markdown 解析，供用户端展示，不含 style） */
    contentHtmlUser?: string;
    /** 附件列表 */
    attachments: string[];
    /** IP地址 */
    ip: string;
    /** 创建时间 */
    create_time: string;
    /** 是否官方回复 */
    isOfficial?: boolean;
    /** 楼中楼：被回复的 detail id（仅反馈工单、回复某条时存在） */
    parentDetailId?: number;
};

/**
 * 工单操作日志
 */
export interface TicketActionLog {
    /** 日志ID */
    log_id: number;
    /** 用户ID */
    uid: number;
    /** 目标对象 */
    target: string;
    /** 操作记录 */
    action: TicketActionLogAction[];
    /** 创建时间 */
    create_time: string;
    /** 授权者 */
    authorizer: string;
}

/**
 * 工单操作日志中的具体操作
 */
export interface TicketActionLogAction {
    /** 操作类型 */
    type: string;
    /** 操作数据 */
    data: string;
    /** 操作原因 */
    reason: string;
}

/**
 * 公开工单统计信息
 */
export type TicketCountPublic = {
    /** 等待总数 */
    count_waiting_total?: number;
    /** 等待分配数 */
    count_waiting_unassigned?: number;
    /** 等待处理数 */
    count_waiting_assigned?: number;
    /** 高级专员待分配总数 */
    count_waiting_senior_unassigned?: number;
    /** 当前全路网委托处理中 */
    count_waiting_entrust?: number;
    /** 下一个VIP工单ID */
    next_tid_vip?: number;
    /** 下一个普通工单ID */
    next_tid_normal?: number;
    /** 我的等待工单统计 */
    count_waiting_my?: TicketCountWaitingMy;
};

/**
 * 媒体工单公开统计信息
 */
export type MediaTicketCountPublic = {
    /** 等待审核数 */
    count_waiting_audit?: number;
    /** 等待月度报告数 */
    count_waiting_monthly?: number;
    /** 等待更新数 */
    count_waiting_update?: number;
    /** 等待活动数 */
    count_waiting_event?: number;
    /** 下一个VIP工单ID */
    next_tid_vip?: number;
    /** 下一个普通工单ID */
    next_tid_normal?: number;
    /** 我的等待工单统计 */
    count_waiting_my?: TicketCountWaitingMy;
};

/**
 * 分配工单结果
 */
export type TicketAssignResult = {
    /** 下个Tid */
    tid: number;
    /** 状态 */
    status: number;
};

/**
 * 我的等待工单统计
 */
export type TicketCountWaitingMy = {
    /** 我的工单数 */
    my: number;
    /** 未分配数 */
    unassigned: number;
    /** 升级数 */
    upgrade: number;
};

/**
 * 媒体工单统计
 */
export type MediaTicketCount = {
    /** 等待审核数 */
    count_waiting_audit?: number;
    /** 等待月度报告数 */
    count_waiting_monthly?: number;
    /** 等待更新数 */
    count_waiting_update?: number;
    /** 等待活动数 */
    count_waiting_event?: number;
};

/**
 * 工单统计
 */
export type TicketCount = {
    /** 等待分配数 */
    count_waiting_unassigned: number;
    /** 等待处理数 */
    count_waiting_assigned: number;
};

/**
 * 下一个工单信息
 */
export type NextTicket = {
    /** 下一个VIP工单ID */
    next_tid_vip?: number;
    /** 下一个普通工单ID */
    next_tid_normal?: number;
};

/**
 * 最早工单列表
 */
export type EarliestTicketList = {
    /** VIP工单ID列表 */
    vip: number[];
    /** 普通工单ID列表 */
    normal: number[];
    /** 升级工单ID列表 */
    upgrade: number[];
};

/**
 * 工单分配类型
 */
export type TicketAssignType =
    /** 我的工单 */
    | 'my'
    /** 升级工单 */
    | 'upgrade'
    /** 未分配工单 */
    | 'unassigned'
    /** 我的媒体工单 */
    | 'myMedia'
    /** 升级媒体工单 */
    | 'upgradeMedia'
    /** 审核媒体工单 */
    | 'auditMedia'
    /** 月度媒体工单 */
    | 'monthlyMedia'
    /** 更新媒体工单 */
    | 'updateMedia'
    /** 媒体活动工单 */
    | 'mediaEvent'
    /** WIKI绑定工单 */
    | 'wikiBinding';

/**
 * 工单转交信息
 */
export interface TicketEntrust {
    /** 转交ID */
    id: number;
    /** 工单ID */
    tid: number;
    /** 顾问用户ID */
    advisor_uid: number;
    /** 转交状态 */
    status: TicketEntrustStatus;
    /** 目标对象 */
    target: string;
    /** 原始状态 */
    origin_status: TicketStatus;
    /** 介绍说明 */
    introduce?: string;
    /** 创建时间 */
    create_time?: Date;
}

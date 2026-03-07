/**
 * WIKI绑定状态枚举
 */
export enum WikiBindStatus {
    /** 正常 */
    Open = 'O',
    /** 解绑 */
    Unbound = 'X',
    /** 冻结 */
    Frozen = 'F',
}

/**
 * WIKI绑定信息
 */
export interface WikiBinding {
    /** 绑定ID */
    id: number;
    /** ECID */
    ecid: string;
    /** WIKI用户名（可选，可能变更） */
    wiki_username?: string | null;
    /** WIKI用户ID（永久标识） */
    wiki_userid?: number | null;
    /** OpenID */
    openid: string;
    /** 绑定状态 */
    status: WikiBindStatus;
    /** 创建时间 */
    create_time: string;
    /** 解绑时间 */
    unbind_time?: string;
}

/**
 * WIKI绑定结果
 */
export interface WikiBindingResult {
    /** 有效绑定列表 */
    valid: WikiBinding[];
    /** 无效绑定列表 */
    invalid: Omit<WikiBinding, 'status'>[];
}

/**
 * WIKI绑定工单表单数据
 */
export interface WikiBindingTicketForm {
    /** 选择的ECID */
    ecid: string;
    /** WIKI用户名 */
    wiki_username: string;
    /** WIKI截图文件 */
    wiki_screenshot: string[];
    /** 工单标题 */
    title: string;
    /** 工单内容 */
    content: string;
}

/**
 * WIKI绑定列表查询参数
 */
export interface WikiBindingListQuery {
    /** 页码 */
    page?: number;
    /** 每页数量 */
    pageSize?: number;
    /** 搜索字段 */
    searchField?: 'ecid' | 'wiki_username' | 'openid';
    /** 搜索值 */
    searchValue?: string;
    /** 状态筛选 */
    status?: WikiBindStatus;
    /** 开始日期 */
    startDate?: string;
    /** 结束日期 */
    endDate?: string;
}

/**
 * WIKI绑定列表响应数据
 */
export interface WikiBindingListResponse {
    /** 绑定列表数据 */
    data: WikiBinding[];
    /** 总记录数 */
    total: number;
}

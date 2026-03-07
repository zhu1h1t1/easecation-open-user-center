/**
 * 物品 JSON 基础结构
 */
export type ItemJson = {
    /** 分类标识（如 addition、attack-eff） */
    category: string;
    /** 物品原始 ID（资源中的 id） */
    idItem: string;
    /** 附加数值/等级/权重等 */
    data: number;
};

// 商品限购
/**
 * 商品限购（按用户-商品维度）
 */
export type SalesLimit = {
    /** 用户 ID */
    uid: number;
    /** 商品 ID */
    itemID: number;
    /** 个人累计购买数量（总） */
    sales: number;
    /** 个人当月购买数量 */
    current_month_sales: number;
};

// 商品类型
/**
 * 商品项（用于邮件/发货的物品清单）
 */
export type Merchandise = {
    /** 分类标识 */
    category: string;
    /** 物品原始 ID */
    idItem: string;
    /** 数量/等级等 */
    data: number;
};

/**
 * 统一基础字段：用于创建/更新/记录
 */
export interface ItemBase {
    /** 商品标题 */
    title: string;
    /**
     * 商品内容 JSON 字符串
     * 用法：前端已组装好的 JSON 字符串，后端直接入库
     */
    json: string;
    /** 商品单价（单位：整 E 点，整数） */
    price: number;
    /** 商品描述/详情 */
    detail: string;
    /** 每月总存货（全体用户当月可购买总量上限；0 表示不限） */
    total_limit?: number | null;
    /** 每月个人限购（单用户当月可购买上限；0 表示不限） */
    monthly_limit?: number | null;
    /** 总个人限购（单用户累计可购买上限；0 表示不限） */
    global_limit?: number | null;
    /** 永久总库存（全体用户累计可购买总量上限；0 表示不限） */
    permanent_limit?: number | null;
    /** 是否 VIP 商品（0 普通，1 VIP） */
    is_vip?: number;
    /** 是否隐藏（0 显示，1 隐藏） */
    is_hidden?: number;
}

/**
 * 创建商品 DTO
 * - 必填：title、json、price、detail
 * - 可选：imgLink、total_limit、monthly_limit、global_limit、permanent_limit、is_vip、is_hidden
 */
export type CreateProductDTO = Required<Pick<ItemBase, 'title' | 'json' | 'price' | 'detail'>> &
    Partial<Omit<ItemBase, 'title' | 'json' | 'price' | 'detail'>>;

/**
 * 更新商品 DTO（部分字段可选）
 */
export type UpdateProductDTO = Partial<CreateProductDTO>;

/**
 * 业务返回商品类型（含用户态派生字段）
 */
export interface VirtualProduct extends ItemBase {
    /** 商品主键 id */
    id: number;
    /** 所有人当月总销量（系统统计） */
    sales_monthly: number;
    /** 永久总库存 */
    permanent_limit: number;
    /** 是否隐藏 */
    is_hidden: number;
    /** 个人累计购买数量 */
    limit_sales: number;
    /** 个人当月购买数量 */
    current_month_sales: number;
    /** 所有人累计总销量 */
    sales: number;
}

/**
 * 前端商品展示类型
 */
export type Product = Omit<VirtualProduct, 'permanent_limit' | 'is_hidden'> & {
    /** 商品图片链接（响应计算字段，可缺省） */
    imageUrl?: string;
    /** 永久总库存（前端使用 null 表示无/缺省） */
    permanent_limit: number | null;
    /** 是否隐藏（前端冗余，可选） */
    is_hidden?: number;
};

/**
 * 管理端 - 本周统计返回类型
 */
export interface WeeklyStatsResponse {
    totalPurchases: number;
    totalEBalanceSpent: number;
    topItem: {
        itemId: number;
        quantity: number;
        totalSpent: number;
        title?: string;
        imgLink?: string;
    } | null;
}

export interface StaffAlias {
    /** 别名ID */
    id: number;
    /** 客服UID */
    uid: string;
    /** 自定义展示名称 */
    alias: string;
    /** 是否为默认别名 */
    is_default: boolean;
    /** 是否参与随机选择 */
    in_random_pool: boolean;
    /** 最后更新时间 */
    updated_at: string;
    /** 最后修改人 */
    updated_by: string | null;
}

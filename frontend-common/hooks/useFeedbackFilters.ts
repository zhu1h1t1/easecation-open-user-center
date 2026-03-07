// 反馈中心筛选器 Hook - 管理筛选状态和参数构建

import { useState, useCallback } from 'react';

export type FeedbackSortBy = 'createTime' | 'lastReplyTime' | 'heat';
export type FeedbackOrder = 'asc' | 'desc';

export interface FeedbackFiltersState {
    filterTag?: string;
    filterType?: string;
    filterStatus?: string | string[];
    sortBy: FeedbackSortBy;
    order: FeedbackOrder;
    page: number;
}

export interface UseFeedbackFiltersOptions {
    pageSize?: number;
    initialFilters?: Partial<FeedbackFiltersState>;
}

export interface UseFeedbackFiltersReturn {
    // 状态
    filterTag?: string;
    filterType?: string;
    filterStatus?: string | string[];
    sortBy: FeedbackSortBy;
    order: FeedbackOrder;
    page: number;
    pageSize: number;

    // 更新方法
    setFilterTag: (tag?: string) => void;
    setFilterType: (type?: string) => void;
    setFilterStatus: (status?: string | string[]) => void;
    setSortBy: (sortBy: FeedbackSortBy) => void;
    setOrder: (order: FeedbackOrder) => void;
    setPage: (page: number) => void;

    // 重置筛选
    resetFilters: () => void;

    // 构建 API 参数
    buildParams: () => Record<string, string | number | string[]>;
}

/**
 * 反馈中心筛选器 Hook
 *
 * 用于管理反馈列表的筛选状态（标签、类型、状态、排序、分页）
 *
 * @example
 * ```tsx
 * const filters = useFeedbackFilters({ pageSize: 20 });
 *
 * // 使用筛选状态
 * <Segmented value={filters.sortBy} onChange={filters.setSortBy} />
 *
 * // 构建 API 请求参数
 * const params = filters.buildParams();
 * fetchData({ url: '/feedback/list', data: params });
 * ```
 */
export const useFeedbackFilters = (
    options: UseFeedbackFiltersOptions = {}
): UseFeedbackFiltersReturn => {
    const { pageSize = 20, initialFilters = {} } = options;

    const [filterTag, setFilterTag] = useState<string | undefined>(initialFilters.filterTag);
    const [filterType, setFilterType] = useState<string | undefined>(initialFilters.filterType);
    const [filterStatus, setFilterStatus] = useState<string | string[] | undefined>(
        initialFilters.filterStatus
    );
    const [sortBy, setSortBy] = useState<FeedbackSortBy>(initialFilters.sortBy || 'createTime');
    const [order, setOrder] = useState<FeedbackOrder>(initialFilters.order || 'desc');
    const [page, setPage] = useState<number>(initialFilters.page || 1);

    // 重置所有筛选条件
    const resetFilters = useCallback(() => {
        setFilterTag(undefined);
        setFilterType(undefined);
        setFilterStatus(undefined);
        setSortBy('createTime');
        setOrder('desc');
        setPage(1);
    }, []);

    // 构建 API 请求参数
    const buildParams = useCallback((): Record<string, string | number | string[]> => {
        const params: Record<string, string | number | string[]> = {
            sortBy,
            order,
            page: String(page),
            pageSize: String(pageSize),
        };

        if (filterTag != null && filterTag !== '') params.tag = filterTag;
        if (filterType != null && filterType !== '') params.type = filterType;
        if (filterStatus != null) {
            if (Array.isArray(filterStatus) && filterStatus.length > 0) {
                params.status = filterStatus;
            } else if (typeof filterStatus === 'string' && filterStatus !== '') {
                params.status = filterStatus;
            }
        }

        return params;
    }, [filterTag, filterType, filterStatus, sortBy, order, page, pageSize]);

    return {
        // 状态
        filterTag,
        filterType,
        filterStatus,
        sortBy,
        order,
        page,
        pageSize,

        // 更新方法
        setFilterTag,
        setFilterType,
        setFilterStatus,
        setSortBy,
        setOrder,
        setPage,

        // 工具方法
        resetFilters,
        buildParams,
    };
};

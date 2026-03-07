import { Ticket } from './ticket.types';

export type MediaListData = {
    is_media_member: boolean;
    media_group: MediaStatus | '';
    media_expiry: string;
    can_submit_ticket?: boolean;
    media: MediaUser;
};

/**
 * 定义媒体用户类型
 */
export type MediaUser = {
    id: number;
    openID: string;
    status: MediaStatus;
    mpa: string;
    EBalance: number;
    QQNumber?: string;
    link?: string;
    ECID?: string;
    expireDate?: Date;
    lastReviewed?: Date;
    createTime?: Date;
    penalty_record?: string[];
};

export type MediaEpointChangeSource = 'player' | 'admin' | 'system';

export type MediaEpointChangeType = 'purchase' | 'grant' | 'deduct' | 'expire' | 'adjust';

export interface MediaEpointChangeLog {
    id: number;
    media_id: number;
    request_id: string | null;
    source: MediaEpointChangeSource;
    change_type: MediaEpointChangeType;
    amount: number;
    balance_after: number;
    target_openid: string; // target user's openid
    operator_openid: string | null; // operator's openid
    extra?: Record<string, any> | null;
    created_at: string;
}

/**
 * 媒体用户状态
 */
/**
 * NOTE: The string values for MediaStatus are intentionally non-semantic and correspond to legacy codes
 * required for backward compatibility with existing databases and APIs. Do not change these values
 * unless you are certain it will not break integration with other systems.
 */
export enum MediaStatus {
    /**
     * 等待审核
     */
    PendingReview = '-2',
    /**
     * 冻结
     */
    Frozen = '-1',
    /**
     * 普通玩家
     */
    Player = '0',
    /**
     * 过期土豆创作者
     */
    ExpiredCreator = '1',
    /**
     * 活跃土豆创作者
     */
    ActiveCreator = '2',
    /**
     * 卓越创作者
     */
    ExcellentCreator = '3',
}

/**
 * 媒体平台代码
 */
export enum MediaPlatform {
    /**
     * 哔哩哔哩
     */
    Bilibili = 'B',
    /**
     * 抖音
     */
    Douyin = 'D',
    /**
     * 小红书
     */
    Xiaohongshu = 'X',
    /**
     * 快手
     */
    Kuaishou = 'K',
    /**
     * 微信视频号
     */
    Wechat = 'W',
    /**
     * 其他
     */
    Other = 'Z',
}

export type UserBindMediaWithFullData = MediaUser & {
    tickets: {
        key: Ticket[];
        regular: Ticket[];
    };
};

export type MediaInfo = {
    is_media_member: boolean;
    media_group: MediaStatus | '';
    media_expiry: string;
    valid: MediaUser;
};

export type MediaAbleToChoose = {
    id: string;
    display: string;
};

/**
 * 公告接口定义
 */
export interface Announcement {
    id: number;
    title: string;
    content: string;
    autoShow: boolean;
    startTime: string;
    endTime: string;
    dieTime: string;
    card: string;
    carddesc: string;
}

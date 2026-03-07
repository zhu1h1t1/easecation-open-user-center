// 媒体类工单类型集合
import { TicketType } from '../types';
import { MediaStatus, MediaPlatform } from '../types';

// 媒体相关常量
export const SHORT_PLATFORM_CODES = [
    MediaPlatform.Douyin,
    MediaPlatform.Kuaishou,
    MediaPlatform.Xiaohongshu,
];

export const MEDIA_TYPES = [
    TicketType.MediaAudit,
    TicketType.MediaBinding,
    TicketType.MediaApplyBinding,
    TicketType.MediaUpdate,
    TicketType.MediaMonthlyReport,
    TicketType.MediaEvents,
];

export const MEDIA_PLATFORM_MAP: Record<MediaPlatform, string> = {
    [MediaPlatform.Bilibili]: '哔哩哔哩',
    [MediaPlatform.Douyin]: '抖音',
    [MediaPlatform.Xiaohongshu]: '小红书',
    [MediaPlatform.Kuaishou]: '快手',
    [MediaPlatform.Wechat]: '微信视频号',
    [MediaPlatform.Other]: '其他',
};

export const MEDIA_PLATFORM_CODES = Object.values(MediaPlatform);

// 宽松映射（便于后端用 string 做索引），集中在 shared 内进行一次断言
export const MEDIA_NAME: Record<string, string> = MEDIA_PLATFORM_MAP as unknown as Record<
    string,
    string
>; // 媒体账号状态映射表

export const MEDIA_STATUS_MAP: Record<MediaStatus, string> = {
    [MediaStatus.PendingReview]: '等待审核',
    [MediaStatus.Frozen]: '冻结',
    [MediaStatus.Player]: '普通玩家',
    [MediaStatus.ExpiredCreator]: '土豆创作者',
    [MediaStatus.ActiveCreator]: '土豆创作者',
    [MediaStatus.ExcellentCreator]: '卓越创作者',
};

// 丑陋闪烁背景效果的强制用户ID列表
export const UGLY_FLASH_USER_IDS: number[] = [];

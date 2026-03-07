import React, { type ReactElement } from 'react';
import { Button } from 'antd';

import { Announcement } from '@ecuc/shared/types/media.types';
import { gLang } from '../language';

// 检查公告是否在当前时间范围内
export const isAnnouncementActive = (announcement: Announcement): boolean => {
    const now = Date.now();
    const startTime = new Date(announcement.startTime).getTime();
    const endTime = new Date(announcement.endTime).getTime();
    const dieTime = announcement.dieTime ? new Date(announcement.dieTime).getTime() : null;
    // 活跃定义：当前时间在 startTime ~ endTime 之间，且未到 dieTime
    const isActive = now >= startTime && now <= endTime && (!dieTime || now < dieTime);
    return isActive;
};

// 解析 $$$Open("模态框名")$$$ 格式，返回模态框名称或null
export const parseModalOpenCommand = (text: string): string | null => {
    const modalOpenRegex = /\$\$\$Open\("([^"]+)"\)\$\$\$/;
    const match = text.match(modalOpenRegex);
    return match ? match[1] : null;
};

// 检查文本是否包含 $$$Open("模态框名")$$$ 格式
export const hasModalOpenCommand = (text: string): boolean => {
    return parseModalOpenCommand(text) !== null;
};

// 识别 [文本](链接) 格式并渲染为可点击链接
// 同时处理 $$$Open("模态框名")$$$ 格式，替换为按钮（需要传入onModalOpen回调）
export const renderTextWithLinks = (text: string, onModalOpen?: (modalName: string) => void) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const modalOpenRegex = /\$\$\$Open\("([^"]+)"\)\$\$\$/g;
    const elements: (string | ReactElement)[] = [];
    let lastIndex = 0;

    // 收集所有匹配项（链接和模态框命令）
    const matches: Array<{ index: number; type: 'link' | 'modal'; match: RegExpExecArray }> = [];

    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = linkRegex.exec(text)) !== null) {
        matches.push({ index: linkMatch.index, type: 'link', match: linkMatch });
    }

    let modalMatch: RegExpExecArray | null;
    while ((modalMatch = modalOpenRegex.exec(text)) !== null) {
        matches.push({ index: modalMatch.index, type: 'modal', match: modalMatch });
    }

    // 按索引排序
    matches.sort((a, b) => a.index - b.index);

    // 渲染
    for (const item of matches) {
        if (item.index > lastIndex) {
            elements.push(text.slice(lastIndex, item.index));
        }

        if (item.type === 'link') {
            const match = item.match;
            elements.push(
                React.createElement(
                    'a',
                    {
                        key: item.index,
                        href: match[2],
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        style: {
                            color: '#1890ff',
                            textDecoration: 'underline',
                        },
                    },
                    match[1]
                )
            );
        } else if (item.type === 'modal' && onModalOpen) {
            const match = item.match;
            const modalName = match[1];
            elements.push(
                React.createElement(
                    Button,
                    {
                        key: item.index,
                        type: 'primary',
                        size: 'small',
                        onClick: () => onModalOpen(modalName),
                        style: {
                            margin: '0 4px',
                        },
                    },
                    gLang('openLink')
                )
            );
        } else if (item.type === 'modal') {
            // 如果没有提供回调，则移除命令文本（不显示）
            // 这样在主页卡片中就不会显示命令文本
        }

        lastIndex = item.index + item.match[0].length;
    }

    if (lastIndex < text.length) {
        elements.push(text.slice(lastIndex));
    }

    return elements;
};

// 新的localStorage键定义
const ANNOUNCEMENT_POPUP_SETTING_KEY = 'announcement_popup_setting';
const ANNOUNCEMENT_POPUP_TIME_KEY = 'announcement_popup_time';
const ANNOUNCEMENT_LATEST_ID_KEY = 'announcement_latest_id';

// 弹出设置类型
export type PopupSetting = 'any' | 'day' | 'week' | 'never';

// 弹出设置选项
export const POPUP_SETTING_OPTIONS: Array<{
    value: PopupSetting;
    labelKey: string;
    fallback: string;
}> = [
    {
        value: 'any',
        labelKey: 'announcement.modal.popup.options.any',
        fallback: gLang('announcement.modal.popup.options.any'),
    },
    {
        value: 'day',
        labelKey: 'announcement.modal.popup.options.day',
        fallback: gLang('announcement.modal.popup.options.day'),
    },
    {
        value: 'week',
        labelKey: 'announcement.modal.popup.options.week',
        fallback: gLang('announcement.modal.popup.options.week'),
    },
    {
        value: 'never',
        labelKey: 'announcement.modal.popup.options.never',
        fallback: gLang('announcement.modal.popup.options.never'),
    },
];

// 解析UTC时间字符串为Date对象
const parseUTCISO = (isoString: string): Date | null => {
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
};

// 检查两个UTC时间是否在同一天
const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate()
    );
};

// 检查两个UTC时间是否在同一周
const isSameWeek = (date1: Date, date2: Date): boolean => {
    const startOfWeek1 = new Date(date1);
    startOfWeek1.setUTCDate(date1.getUTCDate() - date1.getUTCDay());
    startOfWeek1.setUTCHours(0, 0, 0, 0);

    const startOfWeek2 = new Date(date2);
    startOfWeek2.setUTCDate(date2.getUTCDate() - date2.getUTCDay());
    startOfWeek2.setUTCHours(0, 0, 0, 0);

    return startOfWeek1.getTime() === startOfWeek2.getTime();
};

// 获取存储的弹出设置
export const getStoredPopupSetting = (): PopupSetting => {
    const stored = localStorage.getItem(ANNOUNCEMENT_POPUP_SETTING_KEY);
    if (stored === 'any' || stored === 'day' || stored === 'week' || stored === 'never') {
        return stored;
    }
    return 'any'; // 默认值
};

// 设置存储的弹出设置
export const setStoredPopupSetting = (setting: PopupSetting): void => {
    localStorage.setItem(ANNOUNCEMENT_POPUP_SETTING_KEY, setting);
};

// 获取存储的弹出时间
export const getStoredPopupTime = (): Date | null => {
    const stored = localStorage.getItem(ANNOUNCEMENT_POPUP_TIME_KEY);
    if (!stored) return null;
    return parseUTCISO(stored);
};

// 设置存储的弹出时间
export const setStoredPopupTime = (time: Date | null): void => {
    if (time === null) {
        localStorage.removeItem(ANNOUNCEMENT_POPUP_TIME_KEY);
    } else {
        localStorage.setItem(ANNOUNCEMENT_POPUP_TIME_KEY, time.toISOString());
    }
};

// 获取存储的最新公告ID
export const getStoredLatestAnnouncementId = (): number | null => {
    const stored = localStorage.getItem(ANNOUNCEMENT_LATEST_ID_KEY);
    if (!stored) return null;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : null;
};

// 设置存储的最新公告ID
export const setStoredLatestAnnouncementId = (id: number | null): void => {
    if (id === null) {
        localStorage.removeItem(ANNOUNCEMENT_LATEST_ID_KEY);
    } else {
        localStorage.setItem(ANNOUNCEMENT_LATEST_ID_KEY, String(id));
    }
};

// 检查是否应该弹出公告
export const shouldShowAnnouncement = (
    latestAnnouncementId: number | null,
    hasActiveAutoShowAnnouncement: boolean
): boolean => {
    const popupSetting = getStoredPopupSetting();
    const storedLatestId = getStoredLatestAnnouncementId();
    const lastPopupTime = getStoredPopupTime();
    const now = new Date();

    // 步骤1：如果有新公告且为活跃的autoShow公告，总是弹出
    if (
        hasActiveAutoShowAnnouncement &&
        latestAnnouncementId &&
        storedLatestId !== latestAnnouncementId
    ) {
        // 更新存储的最新公告ID
        setStoredLatestAnnouncementId(latestAnnouncementId);
        return true;
    }

    // 步骤2：若步骤1没有弹出，则依据上次弹出时间与弹出设置判断
    // 关键：只有在有活跃的autoShow公告时才考虑用户设置
    if (!hasActiveAutoShowAnnouncement) {
        return false; // 没有autoShow公告，不弹出
    }

    // 有autoShow公告，根据用户设置判断
    switch (popupSetting) {
        case 'any':
            return true;
        case 'day':
            if (!lastPopupTime) return true;
            return !isSameDay(lastPopupTime, now);
        case 'week':
            if (!lastPopupTime) return true;
            return !isSameWeek(lastPopupTime, now);
        case 'never':
            return false;
        default:
            return true;
    }
};

// 更新弹出时间（当模态框打开时调用）
export const updatePopupTime = (): void => {
    setStoredPopupTime(new Date());
};

// 更新最新公告ID（当获取公告列表后调用）
export const updateLatestAnnouncementId = (latestId: number | null): void => {
    setStoredLatestAnnouncementId(latestId);
};

// 获取最新的活跃公告
export const getLatestActiveAnnouncement = (announcements: Announcement[]): Announcement | null => {
    const activeAnnouncements = announcements.filter(isAnnouncementActive);
    if (activeAnnouncements.length === 0) {
        return null;
    }

    return activeAnnouncements.reduce((latest, curr) => {
        return new Date(curr.startTime).getTime() > new Date(latest.startTime).getTime()
            ? curr
            : latest;
    }, activeAnnouncements[0]);
};

// 检查是否有活跃的autoShow公告
export const hasActiveAutoShowAnnouncement = (announcements: Announcement[]): boolean => {
    return announcements.some(
        announcement => isAnnouncementActive(announcement) && announcement.autoShow
    );
};

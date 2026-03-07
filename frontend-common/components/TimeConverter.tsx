import React from 'react';
import { gLang } from '../language';

/**
 * UTC时间转换器组件
 * 用于集中处理UTC时间转换为1990-01-01 00:00:00格式
 */
export interface TimeConverterProps {
    /** UTC时间戳 (毫秒) 或 Date 对象 */
    utcTime: number | Date | string | undefined | null;
    /** 是否显示时间 */
    showTime?: boolean;
    /** 自定义日期格式 */
    dateFormat?: string;
    /** 自定义时间格式 */
    timeFormat?: string;
    /** CSS类名 */
    className?: string;
    /** 样式 */
    style?: React.CSSProperties;
}

/**
 * 智能格式化时间显示（今年不显示年份，去掉秒数）
 * @param utcTimeString UTC时间字符串/时间戳/Date对象
 * @returns 格式化的时间字符串，如 "01-15 14:30" 或 "2023-01-15 14:30"
 */
export const formatSmartTime = (
    utcTimeString: number | Date | string | undefined | null
): string => {
    if (utcTimeString === undefined || utcTimeString === null) {
        return gLang('time.unknown');
    }

    let date: Date;

    // 处理不同类型的输入
    if (typeof utcTimeString === 'number') {
        date = new Date(utcTimeString);
    } else if (typeof utcTimeString === 'string') {
        if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(utcTimeString)) {
            // 后端传递的时间已经是东八区时间，不需要再添加Z后缀
            date = new Date(utcTimeString);
        } else {
            date = new Date(utcTimeString);
        }
    } else {
        date = utcTimeString;
    }

    // 检查日期是否有效
    if (!date || isNaN(date.getTime())) {
        return gLang('time.invalid');
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const dateYear = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // 如果是今年，不显示年份
    if (dateYear === currentYear) {
        return `${month}-${day} ${hours}:${minutes}`;
    } else {
        return `${dateYear}-${month}-${day} ${hours}:${minutes}`;
    }
};

/**
 * 处理后端传递的UTC时间字符串，转换为本地时区显示
 * 后端传递的时间格式为: "2024-01-01 12:00:00" (UTC) -> "2024-01-01 20:00:00" (+8时区)
 * @param utcTimeString 后端传递的UTC时间字符串 (YYYY-MM-DD HH:mm:ss)
 * @param format 可选的自定义格式字符串
 * @param useLocalTime 是否使用本地时间（+8时区），默认为true
 * @returns 格式化的时间字符串
 */
export const convertUTCToFormat = (
    utcTimeString: number | Date | string | undefined | null,
    format?: string,
    useLocalTime: boolean = true
): string => {
    // 处理 undefined 和 null
    if (utcTimeString === undefined || utcTimeString === null) {
        return gLang('time.unknown');
    }

    let date: Date;

    // 处理不同类型的输入
    if (typeof utcTimeString === 'number') {
        date = new Date(utcTimeString);
    } else if (typeof utcTimeString === 'string') {
        // 如果字符串已经是 YYYY-MM-DD HH:mm:ss 格式，需要解析为正确的UTC时间
        if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(utcTimeString)) {
            // 这种情况下假设字符串代表UTC时间，直接转换为Date对象
            date = new Date(utcTimeString + 'Z'); // 添加Z表示UTC
        } else {
            date = new Date(utcTimeString);
        }
    } else {
        date = utcTimeString;
    }

    // 检查日期是否有效
    if (!date || isNaN(date.getTime())) {
        return gLang('time.invalid');
    }

    // 如果提供了自定义格式，使用自定义格式
    if (format) {
        // 使用本地时间格式化（+8时区）
        return formatDate(date, format);
    }

    if (useLocalTime) {
        // 转换为+8时区显示 (本地时间)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } else {
        // 显示UTC时间（不转换时区）
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
};

/**
 * 根据自定义格式字符串格式化日期
 * @param date Date对象
 * @param format 格式字符串，支持 YYYY、MM、DD、HH、mm、ss
 * @returns 格式化后的时间字符串（默认显示+8时区）
 */
export const formatDate = (date: Date, format: string): string => {
    // 使用本地时间方法（+8时区）而不是UTC方法
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const replacements: Record<string, string | number> = {
        YYYY: year,
        MM: String(month).padStart(2, '0'),
        DD: String(day).padStart(2, '0'),
        HH: String(hours).padStart(2, '0'),
        mm: String(minutes).padStart(2, '0'),
        ss: String(seconds).padStart(2, '0'),
    };

    let result = format;
    for (const [pattern, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(pattern, 'g'), String(value));
    }

    return result;
};

/**
 * TimeConverter 组件
 * 用于渲染转换后的时间格式
 */
export const TimeConverter: React.FC<TimeConverterProps> = ({
    utcTime,
    showTime = true,
    dateFormat = 'YYYY-MM-DD',
    timeFormat = 'HH:mm:ss',
    className,
    style,
}) => {
    // 构建完整的格式字符串
    const format = showTime ? `${dateFormat} ${timeFormat}` : dateFormat;
    const formattedTime = convertUTCToFormat(utcTime, format);

    return (
        <span className={className} style={style}>
            {formattedTime}
        </span>
    );
};

/**
 * 获取相对于当前时间的描述性文本
 * 例如："2小时前"、"3天前"、"刚刚"
 */
export const getRelativeTimeText = (utcTime: number | Date | string | undefined | null): string => {
    // 处理 undefined 和 null
    if (utcTime === undefined || utcTime === null) {
        return gLang('time.unknown');
    }

    const date =
        typeof utcTime === 'number'
            ? new Date(utcTime)
            : typeof utcTime === 'string'
              ? new Date(utcTime)
              : utcTime;

    // 检查日期是否有效
    if (!date || isNaN(date.getTime())) {
        return gLang('time.invalid');
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    if (diffSeconds < 60) {
        return diffSeconds <= 0
            ? gLang('time.justNow')
            : gLang('time.secondsAgo', { n: diffSeconds });
    } else if (diffMinutes < 60) {
        return gLang('time.minutesAgo', { n: diffMinutes });
    } else if (diffHours < 24) {
        return gLang('time.hoursAgo', { n: diffHours });
    } else if (diffDays < 30) {
        return gLang('time.daysAgo', { n: diffDays });
    } else if (diffMonths < 12) {
        return gLang('time.monthsAgo', { n: diffMonths });
    } else {
        return gLang('time.yearsAgo', { n: diffYears });
    }
};

/**
 * RelativeTime 组件
 * 显示相对时间文本
 */
export interface RelativeTimeProps {
    /** UTC时间戳 (毫秒) 或 Date 对象 */
    utcTime: number | Date | string | undefined | null;
    /** CSS类名 */
    className?: string;
    /** 样式 */
    style?: React.CSSProperties;
    /** 标题属性（悬停时显示完整时间） */
    showTooltip?: boolean;
}

export const RelativeTime: React.FC<RelativeTimeProps> = ({
    utcTime,
    className,
    style,
    showTooltip = true,
}) => {
    const relativeText = getRelativeTimeText(utcTime);
    const fullTime = convertUTCToFormat(utcTime);

    return (
        <span className={className} style={style} title={showTooltip ? fullTime : undefined}>
            {relativeText}
        </span>
    );
};

export default TimeConverter;

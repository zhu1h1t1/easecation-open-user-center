import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

/**
 * 判断给定日期是否为本周（自然周，周一到周日）
 * @param pubdate 日期字符串或 dayjs 支持的类型
 */
export const isCurrentWeek = (pubdate: string) => {
    const videoDate = dayjs(pubdate).utcOffset(8);
    const today = dayjs().utcOffset(8);
    const startOfWeek = today.subtract((today.day() + 6) % 7, 'day').startOf('day');
    const endOfWeek = startOfWeek.add(6, 'day').endOf('day');
    return videoDate.isBetween(startOfWeek, endOfWeek, null, '[]');
};
/**
 * 判断给定日期是否为本月
 * @param pubdate 日期字符串或 dayjs 支持的类型
 */
export const isCurrentMonth = (pubdate: string) => {
    const videoDate = dayjs(pubdate).utcOffset(8);
    const today = dayjs().utcOffset(8);
    return videoDate.isSame(today, 'month');
};

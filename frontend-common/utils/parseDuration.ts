// 解析类似 "1h", "1d", "1m", "半年" 等时长为小时数，逻辑与 PlayerPanelAction 中一致
import { gLang } from '../language';

export function parseDuration(input: string): number {
    if (!input) return 0;
    let total = 0;
    const s = input.trim().toLowerCase();
    const halfYearLabel = gLang('parseDuration.halfYear');
    if (s.includes(halfYearLabel)) {
        total += 180 * 24;
    }
    const re = /(\d+(?:\.\d+)?)(y|a|年|m|mo|月|d|天|h|小时)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
        const num = parseFloat(m[1]);
        const u = m[2];
        if (/^(h|小时)$/.test(u)) total += num;
        else if (/^(d|天)$/.test(u)) total += num * 24;
        else if (/^(m|mo|月)$/.test(u)) total += num * 720;
        else if (/^(y|a|年)$/.test(u)) total += num * 8760;
    }
    if (total === 0 && /^\d+(?:\.\d+)?$/.test(s)) {
        total = parseFloat(s);
    }
    return Math.round(total);
}

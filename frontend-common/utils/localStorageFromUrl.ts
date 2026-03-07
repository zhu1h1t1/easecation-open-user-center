/**
 * 从 URL 查询参数中解析 localStorage 设置并应用
 * 格式：/?localStorage=["key1"="value1","key2"="value2"]
 *
 * 使用示例：
 * - /?localStorage=["showAdminLogin"="true"]
 * - /?localStorage=["showAdminLogin"="true","theme"="dark"]
 */
export const applyLocalStorageFromUrl = () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const localStorageParam = params.get('localStorage');

        if (!localStorageParam) {
            return;
        }

        // 解析格式：["key1"="value1","key2"="value2"]
        // 使用正则表达式匹配 "key"="value" 格式
        // 支持值中包含转义引号的情况，如 "key"="value with \"quotes\""
        const regex = /"([^"]+)"\s*=\s*"((?:[^"\\]|\\.)*)"/g;
        let match;
        let hasMatches = false;

        while ((match = regex.exec(localStorageParam)) !== null) {
            const key = match[1];
            let value = match[2];
            // 处理转义的引号：将 \" 还原为 "
            value = value.replace(/\\"/g, '"');
            // 处理其他转义字符
            value = value.replace(/\\n/g, '\n');
            value = value.replace(/\\r/g, '\r');
            value = value.replace(/\\t/g, '\t');
            if (key && value !== undefined) {
                localStorage.setItem(key, value);
                hasMatches = true;
            }
        }

        // 如果成功解析了参数，清除 URL 参数，避免刷新页面时重复应用
        if (hasMatches) {
            const newParams = new URLSearchParams(params);
            newParams.delete('localStorage');
            const newUrl = newParams.toString()
                ? `${window.location.pathname}?${newParams.toString()}`
                : window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    } catch (error) {
        console.error('Failed to apply localStorage from URL:', error);
    }
};

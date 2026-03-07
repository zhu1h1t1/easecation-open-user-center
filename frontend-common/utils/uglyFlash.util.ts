export const toggleUglyFlashByUserId = (userId?: number, targetUserIds?: number[]) => {
    const styleId = 'ugly-flash-style';
    const removeStyle = () => {
        const existing = document.getElementById(styleId);
        if (existing) existing.remove();
    };
    if (userId !== undefined && Array.isArray(targetUserIds) && targetUserIds.includes(userId)) {
        removeStyle();
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
@keyframes uglyFlash{0%{background:#000;filter:invert(0) hue-rotate(0deg)}50%{background:#fff;filter:invert(1) hue-rotate(180deg)}100%{background:#000;filter:invert(0) hue-rotate(360deg)}}
@keyframes uglyShake{from{transform:translate(0,0) rotate(0deg)}to{transform:translate(2px,-2px) rotate(0.3deg)}}
html,body,#root{animation:uglyFlash .25s steps(2,end) infinite,uglyShake .05s infinite alternate !important}
*{text-shadow:0 0 2px #0ff,0 0 4px #f0f,0 0 6px #ff0 !important}
`;
        document.head.appendChild(styleEl);
        return () => removeStyle();
    }
    removeStyle();
    return () => removeStyle();
};

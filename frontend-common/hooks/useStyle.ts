import { createStyles } from 'antd-style';

export const useStyle = createStyles(({ prefixCls, css }: { prefixCls: string; css: any }) => ({
    // 渐变按钮
    aiButton: css`
        &.${prefixCls}-btn-primary:not([disabled]):not(.${prefixCls}-btn-dangerous) {
            border-width: 0;

            > span {
                position: relative;
            }

            &::before {
                content: '';
                background: linear-gradient(
                    90.92deg,
                    rgb(122, 100, 255) 0%,
                    rgb(214, 148, 255) 100%
                );
                position: absolute;
                inset: 0;
                opacity: 1;
                transition: all 0.3s;
                border-radius: inherit;
            }

            &:hover::before {
                opacity: 0.8;
            }
        }
    `,
}));

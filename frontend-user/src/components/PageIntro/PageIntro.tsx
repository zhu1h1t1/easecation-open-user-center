// PageIntro.tsx
import React, { ReactNode } from 'react';
import styles from './PageIntro.module.css';

interface PageIntroProps {
    /** 图片路径，可选 */
    imageSrc?: string;
    /** 图片缩放系数，可选，默认1 */
    imgSize?: number;
    /** 图片位置，可选，'left' | 'right'，默认'left' */
    imgPosition?: 'left' | 'right';
    /** 文字内容，通常使用 <Typography> 等容器包裹 */
    children: ReactNode;
}

const DEFAULT_IMAGE_WIDTH = 200;
const DEFAULT_IMAGE_HEIGHT = 200;
const DEFAULT_IMG_SIZE = 1;
const DEFAULT_IMG_POSITION = 'left';

const PageIntro: React.FC<PageIntroProps> = ({
    imageSrc,
    imgSize = DEFAULT_IMG_SIZE,
    imgPosition = DEFAULT_IMG_POSITION,
    children,
}) => {
    // 计算缩放后的宽高
    const width = DEFAULT_IMAGE_WIDTH * imgSize;
    const height = DEFAULT_IMAGE_HEIGHT * imgSize;

    // 根据图片位置决定内容顺序
    const content =
        imgPosition === 'left' ? (
            <>
                {imageSrc && (
                    <div className={styles.image} style={{ width, height }}>
                        <img
                            src={imageSrc}
                            alt=""
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                )}
                <div className={styles.text}>{children}</div>
            </>
        ) : (
            <>
                <div className={styles.text}>{children}</div>
                {imageSrc && (
                    <div className={styles.image} style={{ width, height }}>
                        <img
                            src={imageSrc}
                            alt=""
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                )}
            </>
        );

    return <div className={styles.container}>{content}</div>;
};

export default PageIntro;

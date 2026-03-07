// 反馈页面锚点目录路由分发组件
// PC 端：使用 FeedbackAnchor 组件
// 移动端：使用 FeedbackAnchorMobile 组件

import React from 'react';
import useIsPC from '@common/hooks/useIsPC';
import FeedbackAnchor from './FeedbackAnchor';
import FeedbackAnchorMobile from './FeedbackAnchorMobile';
import BackToTop from './BackToTop';

interface FeedbackAnchorRouteProps {
    officialReplies: Array<{
        id: number;
        floor: number;
        title: string;
    }>;
    cardIndex: React.MutableRefObject<number>;
    animationDelay: number;
}

const FeedbackAnchorRoute: React.FC<FeedbackAnchorRouteProps> = ({
    officialReplies,
    cardIndex,
    animationDelay,
}) => {
    const isPC = useIsPC();

    return (
        <>
            {/* 移动端使用简化的锚点目录 */}
            {!isPC && (
                <>
                    <FeedbackAnchorMobile
                        officialReplies={officialReplies}
                        cardIndex={cardIndex}
                        animationDelay={animationDelay}
                    />
                    <BackToTop isPC={isPC} officialReplies={officialReplies} />
                </>
            )}

            {/* PC 端使用标准锚点目录 */}
            {isPC && (
                <>
                    <FeedbackAnchor
                        officialReplies={officialReplies}
                        cardIndex={cardIndex}
                        animationDelay={animationDelay}
                    />
                    <BackToTop isPC={isPC} officialReplies={officialReplies} />
                </>
            )}
        </>
    );
};

export default FeedbackAnchorRoute;

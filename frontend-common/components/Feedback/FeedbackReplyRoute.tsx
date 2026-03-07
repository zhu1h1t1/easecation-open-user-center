// 反馈回复路由分发组件
// PC 端：使用 FeedbackReply 组件
// 移动端：使用 FeedbackReplyMobile 组件

import React from 'react';
import useIsPC from '@common/hooks/useIsPC';
import FeedbackReply from './FeedbackReply';
import FeedbackReplyMobile from './FeedbackReplyMobile';
import { Ticket } from '@ecuc/shared/types/ticket.types';

interface FeedbackReplyRouteProps {
    ticket: Ticket;
    onReply: (values: any, parent_detail_id?: number) => void;
    onCancelReply: () => void;
    replyingToDetailId: number | null;
    isFormDisabled: boolean;
    animationDelay: number;
    cardIndex: React.MutableRefObject<number>;
    mainPost: any;
    replies: any[];
    uploadedFiles?: string[];
    setUploadedFiles?: (files: string[]) => void;
    isUploading?: boolean;
    setIsUploading?: (uploading: boolean) => void;
}

const FeedbackReplyRoute: React.FC<FeedbackReplyRouteProps> = ({
    ticket,
    onReply,
    onCancelReply,
    replyingToDetailId,
    isFormDisabled,
    animationDelay,
    cardIndex,
    mainPost,
    replies,
}) => {
    const isPC = useIsPC();

    // 如果是在移动端，都使用简化的回复框
    if (!isPC) {
        return (
            <FeedbackReplyMobile
                ticket={ticket}
                onReply={onReply}
                onCancelReply={onCancelReply}
                replyingToDetailId={replyingToDetailId}
                isFormDisabled={isFormDisabled}
                animationDelay={animationDelay}
                cardIndex={cardIndex}
                mainPost={mainPost}
                replies={replies}
            />
        );
    }

    // PC 端使用标准回复框
    return (
        <FeedbackReply
            ticket={ticket}
            onReply={onReply}
            onCancelReply={onCancelReply}
            replyingToDetailId={replyingToDetailId}
            isFormDisabled={isFormDisabled}
            animationDelay={animationDelay}
            cardIndex={cardIndex}
            mainPost={mainPost}
            replies={replies}
        />
    );
};

export default FeedbackReplyRoute;

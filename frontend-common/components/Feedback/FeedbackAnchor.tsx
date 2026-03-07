// PC端反馈页面的锚点目录组件

import React from 'react';
import Card from 'antd/es/card';
import Anchor from 'antd/es/anchor';
import Affix from 'antd/es/affix';
import { gLang } from '@common/language';

const { Link: AnchorLink } = Anchor;

interface FeedbackAnchorProps {
    officialReplies: Array<{
        id: number;
        floor: number;
        title: string;
    }>;
    cardIndex: React.MutableRefObject<number>;
    animationDelay: number;
}

const FeedbackAnchor: React.FC<FeedbackAnchorProps> = ({
    officialReplies,
    cardIndex,
    animationDelay,
}) => {
    if (officialReplies.length === 0) {
        return null;
    }

    return (
        <Affix offsetTop={20}>
            <div
                style={{
                    opacity: 0,
                    animation: `fadeInUp 0.5s ease-in-out ${cardIndex.current++ * animationDelay}s forwards`,
                }}
            >
                <Card
                    title={gLang('feedback.officialReplyIndex')}
                    style={{ width: 220, borderRadius: 8 }}
                    size="small"
                >
                    <Anchor>
                        {officialReplies.map(reply => (
                            <AnchorLink
                                key={reply.id}
                                href={`#feedback-floor-${reply.id}`}
                                title={`#${reply.floor} ${reply.title}`}
                            />
                        ))}
                    </Anchor>
                </Card>
            </div>
        </Affix>
    );
};

export default FeedbackAnchor;

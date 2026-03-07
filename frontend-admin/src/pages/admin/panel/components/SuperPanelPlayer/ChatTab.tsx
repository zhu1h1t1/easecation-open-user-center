import React from 'react';
import { Card, Space, Spin, Typography } from 'antd';
import { gLang } from '@common/language';
import { convertUTCToFormat } from '@common/components/TimeConverter';

const { Title, Text, Paragraph } = Typography;

interface ChatTabProps {
    playerChatHistory: any[] | undefined;
    spinningChat: boolean;
}

export const ChatTab: React.FC<ChatTabProps> = ({ playerChatHistory, spinningChat }) => (
    <Spin spinning={spinningChat}>
        <Space orientation="vertical" style={{ width: '100%' }}>
            <Title level={5}>{gLang('superPanel.title.chat')}</Title>
            {playerChatHistory?.map(chat => (
                <Card key={chat.time}>
                    <Text disabled>
                        {chat.type} - {chat.posId} @ {convertUTCToFormat(chat.time)}
                    </Text>
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{chat.message}</Paragraph>
                </Card>
            ))}
        </Space>
    </Spin>
);

import React from 'react';
import { Card, Descriptions, Space, Spin, Typography } from 'antd';
import { gLang } from '@common/language';
import { convertUTCToFormat } from '@common/components/TimeConverter';

const { Title, Text } = Typography;

interface LoginTabProps {
    playerLoginHistory: any[] | undefined;
    spinningAuth: boolean;
}

export const LoginTab: React.FC<LoginTabProps> = ({ playerLoginHistory, spinningAuth }) => (
    <Spin spinning={spinningAuth}>
        <Space orientation="vertical" style={{ width: '100%' }}>
            <Title level={5} style={{ marginBottom: '0px' }}>
                {gLang('superPanel.title.login')}
            </Title>
            {playerLoginHistory?.map(auth => (
                <Card key={auth.idlog}>
                    <Text disabled>
                        {auth.idlog} @ {convertUTCToFormat(auth.datelog)}
                    </Text>
                    <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
                        <Descriptions.Item label={gLang('superPanel.item.device')}>
                            {auth.device}
                        </Descriptions.Item>
                        {/*<Descriptions.Item label={gLang('superPanel.item.ip')}>{auth.ip}</Descriptions.Item>*/}
                        <Descriptions.Item label={gLang('superPanel.item.uuid')}>
                            {auth.uuid}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            ))}
        </Space>
    </Spin>
);

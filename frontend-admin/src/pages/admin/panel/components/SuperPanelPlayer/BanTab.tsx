import React from 'react';
import { BanInfoComponent } from './index';
import { PlayerBanInfo } from '@ecuc/shared/types/player.types';
import { TicketActionLog } from '@ecuc/shared/types/ticket.types';
import { Alert, Button, Descriptions, Spin, Typography } from 'antd';
import { gLang } from '@common/language';

const { Title, Text } = Typography;

interface BanTabProps {
    playerBan: PlayerBanInfo[] | undefined;
    playerTicketLogs: TicketActionLog[] | undefined;
    spinningBan: boolean;
    spinningTicketLogs: boolean;
    setPreviewTid: React.Dispatch<React.SetStateAction<number | null>>;
}

const BanTab: React.FC<BanTabProps> = ({
    playerBan,
    playerTicketLogs,
    spinningBan,
    spinningTicketLogs,
    setPreviewTid,
}) => {
    return (
        <div>
            <Title level={5} style={{ marginBottom: 8 }}>
                {gLang('superPanel.title.actionLog')}
            </Title>
            <Spin style={{ display: 'block' }} spinning={spinningTicketLogs} />
            {!spinningTicketLogs && playerTicketLogs?.length === 0 && (
                <Text type="secondary">{gLang('superPanel.title.actionLogEmpty')}</Text>
            )}
            {!spinningTicketLogs &&
                playerTicketLogs?.map(log => (
                    <Alert
                        key={log.log_id}
                        style={{ marginBottom: 8, paddingBottom: 12 }}
                        description={
                            <>
                                <Text disabled>
                                    {log.log_id} @ {log.create_time}
                                </Text>
                                <Descriptions
                                    size="small"
                                    style={{ marginTop: 4, marginBottom: 4 }}
                                    column={{ xs: 1, sm: 2 }}
                                >
                                    <Descriptions.Item label={gLang('superPanel.item.modifier')}>
                                        {log.uid}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={gLang('superPanel.item.authorizer')}>
                                        {log.authorizer}
                                    </Descriptions.Item>
                                </Descriptions>
                                {log.action?.map((act, idx) => (
                                    <div
                                        key={`${log.log_id}-action-${idx}`}
                                        style={{ marginTop: idx > 0 ? 8 : 0 }}
                                    >
                                        <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
                                            <Descriptions.Item
                                                label={gLang('superPanel.item.actionType')}
                                            >
                                                {act.type}
                                            </Descriptions.Item>
                                            {act.data !== undefined && (
                                                <Descriptions.Item
                                                    label={gLang('superPanel.item.actionData')}
                                                >
                                                    {String(act.data)}
                                                </Descriptions.Item>
                                            )}
                                        </Descriptions>
                                        {act.reason && (
                                            <Descriptions
                                                size="small"
                                                column={1}
                                                style={{ marginTop: 4 }}
                                            >
                                                <Descriptions.Item
                                                    label={gLang('superPanel.item.actionReason')}
                                                >
                                                    {act.reason}
                                                </Descriptions.Item>
                                            </Descriptions>
                                        )}
                                    </div>
                                ))}
                            </>
                        }
                        type="info"
                        action={
                            log.authorizer?.startsWith('TID_') && (
                                <Button
                                    size="small"
                                    type="default"
                                    style={{ color: '#1890ff', borderColor: '#1890ff' }}
                                    onClick={() =>
                                        setPreviewTid(Number.parseInt(log.authorizer?.substring(4)))
                                    }
                                >
                                    {gLang('superPanel.detailBtn')}
                                </Button>
                            )
                        }
                    />
                ))}
            <Title level={5} style={{ marginTop: 8, marginBottom: 8 }}>
                {gLang('superPanel.title.banLog')}
            </Title>
            <Spin style={{ display: 'block' }} spinning={spinningBan} />
            {!spinningBan && playerBan?.length === 0 && (
                <Text type="secondary">{gLang('superPanel.title.banLogEmpty')}</Text>
            )}
            {!spinningBan &&
                playerBan?.map(ban => (
                    <BanInfoComponent key={ban.logid} ban={ban} setPreviewTid={setPreviewTid} />
                ))}
        </div>
    );
};

export { BanTab };

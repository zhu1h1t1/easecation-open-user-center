import React, { useState } from 'react';
import { Alert, Descriptions, Modal, Space, Typography } from 'antd';
import { gLang } from '@common/language';
import TicketListComponent from '../../../../../components/TicketListComponent';
import OpenidPanelComponent from '../../../ticket/ticket-operate/components/openid-panel/OpenIDPanel';

const { Title, Text } = Typography;

interface TicketTabProps {
    playerTickets: any;
    spinningTickets: boolean;
    setPreviewTid: React.Dispatch<React.SetStateAction<number | null>>;
    ecid: string;
}

export const TicketTab: React.FC<TicketTabProps> = ({
    playerTickets,
    setPreviewTid,
    ecid,
    spinningTickets,
}) => {
    // OpenIDPanel模态框状态
    const [openidPanelVisible, setOpenidPanelVisible] = useState(false);
    const [selectedOpenid, setSelectedOpenid] = useState<string>('');

    // 处理openid点击事件
    const handleOpenidClick = (openid: string) => {
        setSelectedOpenid(openid);
        setOpenidPanelVisible(true);
    };

    // 关闭OpenIDPanel模态框
    const handleOpenidPanelClose = () => {
        setOpenidPanelVisible(false);
        setSelectedOpenid('');
    };

    return (
        <Space direction="vertical" style={{ width: '100%', padding: '0 4px' }}>
            <Title level={5} style={{ marginBottom: '0px' }}>
                {gLang('superPanel.title.bindHistory')}
            </Title>
            {playerTickets?.ticket_bind_records?.length === 0 && (
                <Text type="secondary">{gLang('superPanel.title.bindHistoryEmpty')}</Text>
            )}
            {playerTickets?.ticket_bind_records?.map((record: any, idx: number) => (
                <Alert
                    key={`${record.openid}-${record.create_time || idx}`}
                    style={{ marginBottom: 0, paddingBottom: 12 }}
                    description={
                        <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
                            <Descriptions.Item label={gLang('superPanel.item.is_frozen')}>
                                {gLang('superPanel.bindStatus.' + record.status)}
                            </Descriptions.Item>
                            <Descriptions.Item label={gLang('superPanel.item.open_id')}>
                                <Text
                                    style={{
                                        color: '#1890ff',
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                    }}
                                    onClick={() => handleOpenidClick(record.openid)}
                                >
                                    {record.openid}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={gLang('superPanel.item.bind_time')}>
                                {record.create_time}
                            </Descriptions.Item>
                            {record.unbind_time && (
                                <Descriptions.Item label={gLang('superPanel.item.unbind_time')}>
                                    {record.unbind_time}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    }
                    type="info"
                />
            ))}
            <Title level={5} style={{ marginTop: 8 }}>
                {gLang('superPanel.title.ticketNormal')}
            </Title>
            {playerTickets?.tickets?.regular.length === 0 && (
                <Text type="secondary">{gLang('superPanel.title.ticketNormalEmpty')}</Text>
            )}
            <TicketListComponent
                tickets={playerTickets?.tickets?.regular ?? []}
                to={() => ''}
                loading={spinningTickets}
                onTicketClick={tid => setPreviewTid(tid)}
                style={{}}
                {...{
                    badgeText: (ticket: any) =>
                        ticket.target == ecid
                            ? gLang('admin.ticketAsTarget')
                            : gLang('admin.ticketAsInitiator'),
                    badgeColor: (ticket: any) => (ticket.target == ecid ? 'blue' : 'green'),
                }}
                subTitle={ticket =>
                    `TID#${ticket.tid} - ${gLang('ticket.priority.' + ticket.priority)} (${gLang('ticket.status.' + ticket.status)})`
                }
            />

            {/* OpenIDPanel模态框 */}
            <Modal
                title={gLang('admin.ticketOpenidPanel', { openid: selectedOpenid })}
                open={openidPanelVisible}
                onCancel={handleOpenidPanelClose}
                footer={null}
                width="95%"
                style={{ top: 20 }}
                destroyOnHidden
            >
                <div style={{ height: '80vh', overflow: 'auto' }}>
                    <OpenidPanelComponent openid={selectedOpenid} defaultExpanded={true} />
                </div>
            </Modal>
        </Space>
    );
};

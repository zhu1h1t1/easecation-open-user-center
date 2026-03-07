// 查看工单进度组件

import React from 'react';
import { List, Modal, Spin, Typography } from 'antd';
import { gLang } from '@common/language';
import { TicketCountPublic } from '@ecuc/shared/types/ticket.types';

interface TicketProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketCount?: TicketCountPublic;
    isLoading: boolean;
}

const TicketProgressModal: React.FC<TicketProgressModalProps> = ({
    isOpen,
    onClose,
    ticketCount,
    isLoading,
}) => {
    const { Text, Paragraph } = Typography;

    const progressItems = [
        {
            title: gLang('ticketList.count_waiting_total', {
                count: ticketCount?.count_waiting_total ?? gLang('loading'),
            }),
            key: 'waiting_total',
        },
        {
            title: gLang('ticketList.count_waiting_unassigned', {
                count: ticketCount?.count_waiting_unassigned ?? gLang('loading'),
            }),
            key: 'waiting_unassigned',
        },
        {
            title: gLang('ticketList.count_waiting_assigned', {
                count: ticketCount?.count_waiting_assigned ?? gLang('loading'),
            }),
            key: 'waiting_assigned',
        },
        {
            title:
                ticketCount?.next_tid_vip === 0
                    ? gLang('ticketList.no_next_ticket_vip')
                    : gLang('ticketList.next_tid_vip', {
                          tid: ticketCount?.next_tid_vip ?? gLang('loading'),
                      }),
            key: 'next_tid_vip',
        },
        {
            title:
                ticketCount?.next_tid_normal === 0
                    ? gLang('ticketList.no_next_ticket_normal')
                    : gLang('ticketList.next_tid_normal', {
                          tid: ticketCount?.next_tid_normal ?? gLang('loading'),
                      }),
            key: 'next_tid_normal',
        },
    ];

    return (
        <Modal
            title={gLang('ticketList.progressTitle')}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={700}
        >
            <Spin spinning={isLoading}>
                <List
                    bordered
                    dataSource={progressItems}
                    renderItem={item => (
                        <List.Item key={item.key}>
                            <Text>{item.title}</Text>
                        </List.Item>
                    )}
                    style={{ marginBottom: '20px' }}
                />

                <div style={{ marginTop: '20px' }}>
                    <Paragraph>{gLang('ticketProgressModal.effort')}</Paragraph>
                    <Paragraph>
                        <span
                            dangerouslySetInnerHTML={{
                                __html: gLang('ticketProgressModal.autoAssign'),
                            }}
                        />
                    </Paragraph>
                    <Paragraph>{gLang('ticketProgressModal.reasonIntro')}</Paragraph>
                    <ul>
                        <li>{gLang('ticketProgressModal.reason1')}</li>
                        <li>{gLang('ticketProgressModal.reason2')}</li>
                        <li>{gLang('ticketProgressModal.reason3')}</li>
                        <li>{gLang('ticketProgressModal.reason4')}</li>
                    </ul>
                    <Paragraph>
                        <span
                            dangerouslySetInnerHTML={{
                                __html: gLang('ticketProgressModal.notDelay'),
                            }}
                        />
                    </Paragraph>
                    <Paragraph>{gLang('ticketProgressModal.thanks')}</Paragraph>
                </div>
            </Spin>
        </Modal>
    );
};

export default TicketProgressModal;

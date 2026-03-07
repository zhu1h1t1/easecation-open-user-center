// OpenID模态框组件

import React from 'react';
import { Button, Empty, Modal, Space, Typography } from 'antd';
import { EditOutlined, FileTextOutlined, HistoryOutlined, StopOutlined } from '@ant-design/icons';
import { Ticket } from '@ecuc/shared/types/ticket.types';
import { gLang } from '@common/language';
import TicketListComponent from '../../../../../../components/TicketListComponent';

const { Title } = Typography;

interface OpenIDTicketModalProps {
    openid: string;
    visible: boolean;
    onClose: () => void;
    onBindingManage: () => void;
    onBindingHistory: () => void;
    onPunishmentManage: () => void;
    onTicketClick: (tid: number) => void;
    ticketList: Ticket[];
    loading: boolean;
}

const OpenIDTicketModal: React.FC<OpenIDTicketModalProps> = ({
    openid,
    visible,
    onClose,
    onBindingManage,
    onBindingHistory,
    onPunishmentManage,
    onTicketClick,
    ticketList,
    loading,
}) => {
    return (
        <Modal
            title={
                <Space>
                    <FileTextOutlined />
                    <span>{`${gLang('superPanel.allTicket')} (${openid})`}</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
        >
            <Space direction="vertical" size={24} style={{ width: '100%', marginTop: 8 }}>
                {/* 操作按钮 */}
                <Space wrap>
                    <Button icon={<EditOutlined />} onClick={onBindingManage}>
                        {gLang('superPanel.manageBindingAccounts')}
                    </Button>
                    <Button icon={<HistoryOutlined />} onClick={onBindingHistory}>
                        {gLang('superPanel.allTicket')}
                    </Button>
                    <Button icon={<StopOutlined />} onClick={onPunishmentManage}>
                        {gLang('openidPanel.punishmentManagement')}
                    </Button>
                </Space>

                <div>
                    <Title level={5} style={{ marginBottom: 16 }}>
                        <Space>
                            <FileTextOutlined />
                            {gLang('superPanel.title.ticketNormal')}
                        </Space>
                    </Title>
                    {ticketList.length > 0 ? (
                        <TicketListComponent
                            tickets={ticketList}
                            to={() => '/'}
                            loading={loading}
                            onTicketClick={onTicketClick}
                            style={{}}
                        />
                    ) : (
                        <Empty
                            description={gLang('superPanel.noTickets')}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </div>
            </Space>
        </Modal>
    );
};

export default OpenIDTicketModal;

import React from 'react';
import { Empty, Modal, Space, Spin } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { Ticket } from '@ecuc/shared/types/ticket.types';
import { gLang } from '@common/language';
import TicketDetailComponent from '../../../../../../components/TicketDetailComponent';

interface TicketDetailModalProps {
    tid: number | null;
    visible: boolean;
    onClose: () => void;
    ticket: Ticket | null;
    loading: boolean;
    screens: any;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
    tid,
    visible,
    onClose,
    ticket,
    loading,
    screens,
}) => {
    return (
        <Modal
            title={
                <Space>
                    <FileTextOutlined />
                    <span>{`${gLang('superPanel.ticketDetail')} (TID#${tid})`}</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={screens.md ? '70%' : '95%'}
            destroyOnHidden
        >
            {loading ? (
                <Spin>
                    <div style={{ minHeight: 200 }} />
                </Spin>
            ) : ticket ? (
                <TicketDetailComponent ticket={ticket} isAdmin />
            ) : (
                <Empty
                    description={gLang('superPanel.ticketDetailFailed')}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            )}
        </Modal>
    );
};

export default TicketDetailModal;

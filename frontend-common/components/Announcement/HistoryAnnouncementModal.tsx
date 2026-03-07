import React from 'react';
import { Modal, List, Tag, Space, Button } from 'antd';
import { renderTextWithLinks, isAnnouncementActive } from '../../utils/announcementUtils';
import { Announcement } from '@ecuc/shared/types/media.types';
import { TimeConverter } from '../TimeConverter';
import { gLang } from '../../language';

interface HistoryAnnouncementModalProps {
    visible: boolean;
    onClose: () => void;
    announcements: Announcement[];
    onModalOpen?: (modalName: string) => void;
}

const HistoryAnnouncementModal: React.FC<HistoryAnnouncementModalProps> = ({
    visible,
    onClose,
    announcements,
    onModalOpen,
}) => {
    const inactiveAnnouncements = announcements.filter(
        announcement => !isAnnouncementActive(announcement)
    );

    return (
        <Modal
            title={
                <span style={{ fontSize: '20px', fontWeight: '600' }}>
                    {gLang('announcement.modal.history')}
                </span>
            }
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>
                    {gLang('announcement.modal.close')}
                </Button>,
            ]}
            width={1000}
        >
            <List
                dataSource={inactiveAnnouncements || []}
                renderItem={announcement => (
                    <List.Item key={announcement.id}>
                        <List.Item.Meta
                            title={
                                <Space align="center">
                                    <Tag color="gray" style={{ fontSize: '16px' }}>
                                        {gLang('announcement.modal.inactive')}
                                    </Tag>
                                    <span style={{ fontSize: '18px', fontWeight: '500' }}>
                                        {announcement.title}
                                    </span>
                                    {announcement.autoShow && (
                                        <Tag color="orange" style={{ fontSize: '12px' }}>
                                            {gLang('announcement.modal.autoShow')}
                                        </Tag>
                                    )}
                                </Space>
                            }
                            description={
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <div
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            color: '#666',
                                            fontSize: '16px',
                                        }}
                                    >
                                        {renderTextWithLinks(announcement.content, onModalOpen)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                        {gLang('announcement.modal.startTime')}:{' '}
                                        <TimeConverter utcTime={announcement.startTime} />
                                        {announcement.endTime && (
                                            <>
                                                {' - ' + gLang('announcement.modal.endTime') + ': '}
                                                <TimeConverter utcTime={announcement.endTime} />
                                            </>
                                        )}
                                    </div>
                                </Space>
                            }
                        />
                    </List.Item>
                )}
                locale={{
                    emptyText: gLang('announcement.modal.empty'),
                }}
            />
        </Modal>
    );
};

export default HistoryAnnouncementModal;

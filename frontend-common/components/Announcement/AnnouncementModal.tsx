import React from 'react';
import { Modal, Tag, Space, Button, Select, List } from 'antd';
import {
    renderTextWithLinks,
    isAnnouncementActive,
    POPUP_SETTING_OPTIONS,
    PopupSetting,
} from '../../utils/announcementUtils';
import { gLang } from '../../language';
import { Announcement } from '@ecuc/shared/types/media.types';
import { useTheme } from '../../contexts/ThemeContext';

interface AnnouncementModalProps {
    visible: boolean;
    onClose: () => void;
    onShowHistory: () => void;
    announcements: Announcement[];
    popupSetting: PopupSetting;
    onPopupSettingChange: (setting: PopupSetting) => void;
    latestActiveAnnouncement: Announcement | null;
    onModalOpen?: (modalName: string) => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
    visible,
    onClose,
    onShowHistory,
    announcements,
    popupSetting,
    onPopupSettingChange,
    onModalOpen,
}) => {
    useTheme();
    const activeAnnouncements = announcements.filter(isAnnouncementActive);

    const popupSettingOptions = React.useMemo(
        () =>
            POPUP_SETTING_OPTIONS.map(option => {
                const labelValue = gLang(option.labelKey);
                const label = labelValue === option.labelKey ? option.fallback : labelValue;
                return {
                    value: option.value,
                    label,
                };
            }),
        [gLang]
    );

    return (
        <Modal
            title={
                <span style={{ fontSize: '20px', fontWeight: '600' }}>
                    {gLang('announcement.modal.title')}
                </span>
            }
            open={visible}
            onCancel={onClose}
            footer={[
                <Space key="popup-setting" style={{ marginRight: 16 }}>
                    <Select<PopupSetting>
                        value={popupSetting}
                        options={popupSettingOptions}
                        onChange={value => {
                            const setting: PopupSetting = value ?? 'any';
                            onPopupSettingChange(setting);
                        }}
                        styles={{ popup: { root: { minWidth: 120 } } }}
                        popupMatchSelectWidth={false}
                    />
                </Space>,
                <Button key="history" type="default" onClick={onShowHistory}>
                    {gLang('announcement.modal.history')}
                </Button>,
                <Button key="close" onClick={onClose}>
                    {gLang('announcement.modal.close')}
                </Button>,
            ]}
            width={800}
        >
            <List
                dataSource={activeAnnouncements || []}
                renderItem={announcement => (
                    <List.Item key={announcement.id}>
                        <List.Item.Meta
                            title={
                                <Space align="center">
                                    <Tag color="blue" style={{ fontSize: '16px' }}>
                                        {gLang('announcement.modal.active')}
                                    </Tag>
                                    <span style={{ fontSize: '18px', fontWeight: '500' }}>
                                        {announcement.title}
                                    </span>
                                </Space>
                            }
                            description={
                                <Space direction="vertical" size={4}>
                                    <div
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            color: '#666',
                                            fontSize: '16px',
                                        }}
                                    >
                                        {renderTextWithLinks(announcement.content, onModalOpen)}
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

export default AnnouncementModal;

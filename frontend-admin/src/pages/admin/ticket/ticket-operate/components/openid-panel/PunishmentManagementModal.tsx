// OpenID处罚管理模态框组件

import React, { useEffect, useState } from 'react';
import {
    Modal,
    Form,
    InputNumber,
    DatePicker,
    Button,
    message,
    Space,
    Descriptions,
    Tag,
    Dropdown,
    Row,
    Col,
    Divider,
} from 'antd';
import { fetchData, submitData } from '@common/axiosConfig';
import { gLang } from '@common/language';
import dayjs from 'dayjs';

interface PunishmentManagementModalProps {
    openid: string;
    visible: boolean;
    onClose: () => void;
    screens: any;
}

interface PunishmentData {
    openid: string;
    is_frozen: number;
    is_muted: number;
    mute_expires_at: string | null;
    experience: number;
    checkin_count: number;
    last_checkin_date: string | null;
}

const PunishmentManagementModal: React.FC<PunishmentManagementModalProps> = ({
    openid,
    visible,
    onClose,
    screens,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PunishmentData | null>(null);
    const [, contextHolder] = message.useMessage();

    // 加载处罚数据
    const loadData = async () => {
        setLoading(true);
        try {
            await fetchData({
                url: '/user/punishment',
                method: 'GET',
                data: { openid },
                setData: response => {
                    const punishmentData = response.data || response;
                    setData(punishmentData);
                    form.setFieldsValue({
                        mute_expires_at: punishmentData.mute_expires_at
                            ? dayjs(punishmentData.mute_expires_at)
                            : null,
                        experience: punishmentData.experience || 0,
                        checkin_count: punishmentData.checkin_count || 0,
                        last_checkin_date: punishmentData.last_checkin_date
                            ? dayjs(punishmentData.last_checkin_date)
                            : null,
                    });
                },
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (openid && visible) {
            loadData();
        }
    }, [openid, visible]);

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            await submitData({
                data: {
                    openid,
                    mute_expires_at: values.mute_expires_at
                        ? values.mute_expires_at.toISOString()
                        : null,
                    experience: values.experience || 0,
                    checkin_count: values.checkin_count || 0,
                    last_checkin_date: values.last_checkin_date
                        ? values.last_checkin_date.format('YYYY-MM-DD')
                        : null,
                },
                url: '/user/punishment',
                method: 'POST',
                successMessage: gLang('openidPanel.updateSuccess'),
                setIsFormDisabled: setLoading,
                setIsModalOpen: () => {},
            });
            await loadData();
        } finally {
            setLoading(false);
        }
    };

    const handleFreeze = async () => {
        setLoading(true);
        try {
            await submitData({
                data: { openid },
                url: '/user/punishment/freeze',
                method: 'POST',
                successMessage: gLang('openidPanel.freezeSuccess'),
                setIsFormDisabled: setLoading,
                setIsModalOpen: () => {},
            });
            await loadData();
        } finally {
            setLoading(false);
        }
    };

    const handleUnfreeze = async () => {
        setLoading(true);
        try {
            await submitData({
                data: { openid },
                url: '/user/punishment/unfreeze',
                method: 'POST',
                successMessage: gLang('openidPanel.unfreezeSuccess'),
                setIsFormDisabled: setLoading,
                setIsModalOpen: () => {},
            });
            await loadData();
        } finally {
            setLoading(false);
        }
    };

    const handleMute = async (permanent: boolean = false) => {
        setLoading(true);
        try {
            await submitData({
                data: {
                    openid,
                    expires_at: permanent ? null : dayjs().add(7, 'day').toISOString(),
                },
                url: '/user/punishment/mute',
                method: 'POST',
                successMessage: permanent
                    ? gLang('openidPanel.permanentMuteSuccess')
                    : gLang('openidPanel.muteSuccess'),
                setIsFormDisabled: setLoading,
                setIsModalOpen: () => {},
            });
            await loadData();
        } finally {
            setLoading(false);
        }
    };

    const handleUnmute = async () => {
        setLoading(true);
        try {
            await submitData({
                data: { openid },
                url: '/user/punishment/unmute',
                method: 'POST',
                successMessage: gLang('openidPanel.unmuteSuccess'),
                setIsFormDisabled: setLoading,
                setIsModalOpen: () => {},
            });
            await loadData();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={gLang('openidPanel.modaltitle')}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={screens.md ? '50%' : '95%'}
            destroyOnClose
        >
            {contextHolder}
            <Space orientation="vertical" size={16} style={{ width: '100%', marginTop: 16 }}>
                {data && (
                    <Descriptions column={2} style={{ fontSize: '14px' }}>
                        <Descriptions.Item label={gLang('openidPanel.freeze')}>
                            <Tag color={data.is_frozen === 1 ? 'error' : 'success'}>
                                {data.is_frozen === 1
                                    ? gLang('openidPanel.frozen')
                                    : gLang('openidPanel.normal')}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={gLang('openidPanel.mute')}>
                            <Tag color={data.is_muted === 1 ? 'error' : 'success'}>
                                {data.is_muted === 1
                                    ? data.mute_expires_at
                                        ? `${gLang('openidPanel.muted')}（${gLang('openidPanel.expires')}：${dayjs(data.mute_expires_at).format('YYYY-MM-DD HH:mm')}）`
                                        : gLang('openidPanel.permanentMute')
                                    : gLang('openidPanel.normal')}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={gLang('openidPanel.experience')}>
                            {data.experience}
                        </Descriptions.Item>
                        <Descriptions.Item label={gLang('openidPanel.checkinCount')}>
                            {data.checkin_count}
                        </Descriptions.Item>
                        <Descriptions.Item label={gLang('openidPanel.lastCheckinDate')} span={2}>
                            {data.last_checkin_date
                                ? dayjs(data.last_checkin_date).format('YYYY-MM-DD')
                                : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                )}

                <div style={{ textAlign: 'right' }}>
                    <Space size="small">
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>
                            {gLang('openidPanel.quickActions')}
                        </span>
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'freeze',
                                        label: gLang('openidPanel.freeze'),
                                        onClick: handleFreeze,
                                    },
                                    {
                                        key: 'unfreeze',
                                        label: gLang('openidPanel.unfreeze'),
                                        onClick: handleUnfreeze,
                                    },
                                ],
                            }}
                            placement="bottomRight"
                        >
                            <Button
                                size="small"
                                loading={loading}
                                style={{ width: '100%', margin: 8 }}
                            >
                                {gLang('openidPanel.freeze')}
                            </Button>
                        </Dropdown>
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'mute7Days',
                                        label: gLang('openidPanel.mute7Days'),
                                        onClick: () => handleMute(false),
                                    },
                                    {
                                        key: 'permanentMute',
                                        label: gLang('openidPanel.permanentMute'),
                                        onClick: () => handleMute(true),
                                    },
                                    {
                                        key: 'unmute',
                                        label: gLang('openidPanel.unmute'),
                                        onClick: handleUnmute,
                                    },
                                ],
                            }}
                            placement="bottomRight"
                        >
                            <Button size="small" loading={loading}>
                                {gLang('openidPanel.mute')}
                            </Button>
                        </Dropdown>
                    </Space>
                </div>

                <Divider style={{ margin: '0' }} />

                <Form form={form} layout="vertical" onFinish={handleSubmit} size="middle">
                    <Row gutter={16} style={{ marginBottom: '16px' }}>
                        <Col span={12}>
                            <Form.Item
                                name="mute_expires_at"
                                label={gLang('openidPanel.muteExpiresAt')}
                                style={{ marginBottom: 0 }}
                            >
                                <DatePicker
                                    showTime
                                    format="YYYY-MM-DD HH:mm:ss"
                                    style={{ width: '100%' }}
                                    placeholder={gLang('openidPanel.selectExpiresTime')}
                                    getPopupContainer={trigger =>
                                        trigger.parentElement as HTMLElement
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="last_checkin_date"
                                label={gLang('openidPanel.lastCheckinDate')}
                                style={{ marginBottom: 0 }}
                            >
                                <DatePicker
                                    format="YYYY-MM-DD"
                                    style={{ width: '100%' }}
                                    placeholder={gLang('openidPanel.selectLastCheckinDate')}
                                    getPopupContainer={trigger =>
                                        trigger.parentElement as HTMLElement
                                    }
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16} style={{ marginBottom: '16px' }}>
                        <Col span={12}>
                            <Form.Item
                                name="experience"
                                label={gLang('openidPanel.experience')}
                                rules={[{ required: true, message: gLang('required') }]}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="checkin_count"
                                label={gLang('openidPanel.checkinCount')}
                                rules={[{ required: true, message: gLang('required') }]}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item style={{ marginTop: '22px', marginBottom: 0, textAlign: 'right' }}>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {gLang('openidPanel.operate')}
                        </Button>
                    </Form.Item>
                </Form>
            </Space>
        </Modal>
    );
};

export default PunishmentManagementModal;

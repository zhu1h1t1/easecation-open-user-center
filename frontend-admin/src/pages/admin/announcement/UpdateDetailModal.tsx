import { Button, Form, Input, message, Modal, Switch, DatePicker } from 'antd';
import { useEffect } from 'react';
import { fetchData } from '@common/axiosConfig';
import { gLang } from '@common/language';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { Announcement } from '@ecuc/shared/types/media.types';

// 注册UTC插件
dayjs.extend(utc);

export const AnnouncementDetailModal = ({
    announcement,
    onClose,
    onSuccess,
}: {
    announcement: Announcement | null;
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [form] = Form.useForm();
    const [messageApi, messageContextHolder] = message.useMessage();

    useEffect(() => {
        if (announcement) {
            const convertToDayjs = (val: any) => (val ? dayjs(val) : null);
            form.setFieldsValue({
                ...announcement,
                startTime: convertToDayjs(announcement.startTime),
                endTime: convertToDayjs(announcement.endTime),
                dieTime: convertToDayjs(announcement.dieTime),
            });
        }
    }, [announcement]);

    const handleSubmitUpdate = async (values: any) => {
        const formatDate = (val: any) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : null);
        const submitData = {
            id: announcement?.id,
            title: values.title,
            content: values.content,
            autoShow: values.autoShow ?? false,
            startTime: formatDate(values.startTime),
            endTime: formatDate(values.endTime),
            dieTime: formatDate(values.dieTime),
            card: values.card,
            carddesc: values.carddesc,
        };
        try {
            await fetchData({
                url: `/announcement/${announcement?.id}`,
                method: 'PUT',
                data: submitData,
                setData: () => {
                    messageApi.success(gLang('announcement.create_success'));
                    onSuccess();
                    onClose();
                },
                setSpin: () => {},
            });
        } catch {
            messageApi.error(gLang('common.internal_server_error'));
        }
    };

    if (!announcement) return null;

    return (
        <Modal
            title={gLang('announcement.modal.edit_title')}
            open={!!announcement}
            onCancel={onClose}
            footer={[
                <Button key="back" onClick={onClose}>
                    {gLang('common.cancel')}
                </Button>,
                <Button key="submit" type="primary" onClick={() => form.submit()}>
                    {gLang('common.save')}
                </Button>,
            ]}
        >
            {messageContextHolder}
            <Form form={form} layout="vertical" onFinish={handleSubmitUpdate}>
                <Form.Item label={gLang('announcement.panel.id')} name="id">
                    <Input disabled />
                </Form.Item>
                <Form.Item
                    label={gLang('announcement.panel.title')}
                    name="title"
                    rules={[
                        {
                            required: true,
                            message: gLang('announcement.panel.title') + gLang('required'),
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={gLang('announcement.panel.content')}
                    name="content"
                    rules={[
                        {
                            required: true,
                            message: gLang('announcement.panel.content') + gLang('required'),
                        },
                    ]}
                >
                    <Input.TextArea rows={4} />
                </Form.Item>
                <Form.Item
                    label={gLang('announcement.panel.autoShow')}
                    name="autoShow"
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren={gLang('common.switch.open')}
                        unCheckedChildren={gLang('common.switch.close')}
                    />
                </Form.Item>
                <Form.Item
                    label={gLang('announcement.panel.startTime')}
                    name="startTime"
                    rules={[
                        {
                            required: true,
                            message: gLang('announcement.panel.startTime') + gLang('required'),
                        },
                    ]}
                >
                    <DatePicker
                        showTime={{ format: 'HH:mm:ss' }}
                        format="YYYY-MM-DD HH:mm:ss"
                        style={{ width: '100%' }}
                        placeholder="2025-07-11 00:00:00"
                    />
                </Form.Item>
                <Form.Item
                    label={gLang('announcement.panel.endTime')}
                    name="endTime"
                    rules={[
                        {
                            required: true,
                            message: gLang('announcement.panel.endTime') + gLang('required'),
                        },
                    ]}
                >
                    <DatePicker
                        showTime={{ format: 'HH:mm:ss' }}
                        format="YYYY-MM-DD HH:mm:ss"
                        style={{ width: '100%' }}
                        placeholder="2025-07-12 00:00:00"
                    />
                </Form.Item>
                <Form.Item
                    label={gLang('announcement.panel.dieTime')}
                    name="dieTime"
                    rules={[
                        {
                            required: true,
                            message: gLang('announcement.panel.dieTime') + gLang('required'),
                        },
                    ]}
                >
                    <DatePicker
                        showTime={{ format: 'HH:mm:ss' }}
                        format="YYYY-MM-DD HH:mm:ss"
                        style={{ width: '100%' }}
                        placeholder="2025-07-13 00:00:00"
                    />
                </Form.Item>
                <Form.Item label={gLang('announcement.panel.card')} name="card">
                    <Input placeholder={gLang('announcement.panel.card')} />
                </Form.Item>
                <Form.Item label={gLang('announcement.panel.carddesc')} name="carddesc">
                    <Input placeholder={gLang('announcement.panel.carddesc')} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

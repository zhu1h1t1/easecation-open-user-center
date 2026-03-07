// 快捷方式编辑页

import {
    Alert,
    Button,
    Card,
    Flex,
    Form,
    Input,
    Modal,
    Popconfirm,
    Select,
    Space,
    Typography,
} from 'antd';
import { gLang } from '@common/language';
import { useEffect, useState } from 'react';
import { fetchData, submitData } from '@common/axiosConfig';
import TextArea from 'antd/es/input/TextArea';
import { StaffShortcut } from '@ecuc/shared/types/player.types';

const Shortcut = () => {
    const { Title, Paragraph, Text } = Typography;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [shortcuts, setShortcuts] = useState<StaffShortcut[]>([]);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData({
            url: '/shortcut/list',
            method: 'GET',
            data: {},
            setData: setShortcuts,
        });
    }, []);

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <Typography>
                <Title level={3}>{gLang('shortcut.title')}</Title>
                <Paragraph type="secondary">{gLang('shortcut.intro')}</Paragraph>
            </Typography>
            <Button
                size="large"
                type="primary"
                block
                style={{ marginBottom: '20px' }}
                onClick={() => setIsModalOpen(true)}
            >
                {gLang('shortcut.newBtn')}
            </Button>

            <Flex wrap gap="small">
                {shortcuts.map((shortcut, index) => (
                    <Card
                        key={`shortcut-card-${shortcut.uid ?? 'noid'}-${index}`}
                        title={gLang('shortcut.' + shortcut.type) + ' - ' + shortcut.title}
                        extra={
                            <Popconfirm
                                title={gLang('shortcut.deleteConfirm')}
                                description={gLang('shortcut.deleteDetail')}
                                onConfirm={() =>
                                    submitData({
                                        data: { title: shortcut.title },
                                        url: '/shortcut/delete',
                                        successMessage: 'success',
                                        method: 'GET',
                                        redirectTo: '/shortcut',
                                        setIsFormDisabled: () => {},
                                        setIsModalOpen: () => {},
                                    })
                                }
                                okText={gLang('shortcut.deleteBtnConfirm')}
                                cancelText={gLang('shortcut.deleteBtnCancel')}
                            >
                                <a>{gLang('shortcut.deleteBtn')}</a>
                            </Popconfirm>
                        }
                        style={{ width: 300 }}
                    >
                        <Paragraph>{shortcut.content}</Paragraph>
                    </Card>
                ))}
            </Flex>

            <Modal
                title={gLang('shortcut.newBtn')}
                open={isModalOpen}
                footer={false}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form
                    name="basic"
                    form={form}
                    onFinish={values => {
                        submitData({
                            data: {
                                type: values.type,
                                title: values.title,
                                content: values.content,
                            },
                            url: '/shortcut/add',
                            successMessage: 'success',
                            method: 'POST',
                            redirectTo: '/shortcut',
                            setIsFormDisabled: setIsFormDisabled,
                            setIsModalOpen: setIsModalOpen,
                        }).then();
                    }}
                    autoComplete="off"
                    disabled={isFormDisabled}
                >
                    <Form.Item
                        label={gLang('shortcut.newType')}
                        name="type"
                        rules={[
                            {
                                required: true,
                                message: gLang('required'),
                            },
                        ]}
                    >
                        <Select
                            options={[
                                { value: 'M', label: gLang('admin.message') },
                                { value: 'A', label: gLang('admin.operation') },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        label={gLang('shortcut.newTitle')}
                        name="title"
                        rules={[
                            {
                                required: true,
                                message: gLang('required'),
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={gLang('shortcut.newDetail')}
                        extra={gLang('shortcut.newDetailIntro')}
                        name="content"
                        dependencies={['type']}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator: (_, value) => {
                                    const type = getFieldValue('type');
                                    if (type === 'A') {
                                        if (!value)
                                            return Promise.reject(new Error(gLang('required')));
                                        try {
                                            JSON.parse(value);
                                            return Promise.resolve();
                                        } catch {
                                            return Promise.reject(
                                                new Error(gLang('shortcut.jsonFormat'))
                                            );
                                        }
                                    }
                                    return value
                                        ? Promise.resolve()
                                        : Promise.reject(new Error(gLang('required')));
                                },
                            }),
                        ]}
                    >
                        <TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            {gLang('shortcut.newSubmit')}
                        </Button>
                    </Form.Item>
                </Form>

                <Alert
                    message={
                        <Typography>
                            <Title level={4}>{gLang('shortcut.docs.title')}</Title>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                                {gLang('shortcut.docs.overview')}
                            </Paragraph>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                                {gLang('shortcut.docs.jsonFormat')}
                            </Paragraph>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                                {gLang('shortcut.docs.typeRules')}
                            </Paragraph>
                            <Title level={5}>{gLang('shortcut.docs.exampleTitle')}</Title>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                                {gLang('shortcut.docs.examples')}
                            </Paragraph>

                            <Text style={{ fontWeight: 'bold' }}>
                                {gLang('overwatch.operationHack')}
                            </Text>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                                {gLang('shortcut.docs.hackExamples', {
                                    time: gLang('admin.fillPunishTime'),
                                })}
                            </Paragraph>

                            <Text style={{ fontWeight: 'bold' }}>
                                {gLang('overwatch.operationBan')}
                            </Text>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                                {gLang('shortcut.docs.banExamples', {
                                    time: gLang('admin.fillPunishTime'),
                                })}
                            </Paragraph>

                            <Text style={{ fontWeight: 'bold' }}>
                                {gLang('shortcut.docs.freezeTitle')}
                            </Text>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                                {gLang('shortcut.docs.freezeExamples')}
                            </Paragraph>

                            <Text style={{ fontWeight: 'bold' }}>
                                {gLang('shortcut.docs.unbanTitle')}
                            </Text>
                            <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                                {gLang('shortcut.docs.unbanExamples')}
                            </Paragraph>
                        </Typography>
                    }
                />
            </Modal>
        </Space>
    );
};

export default Shortcut;

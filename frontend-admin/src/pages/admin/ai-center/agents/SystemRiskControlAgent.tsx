import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Select, Space, Switch, Typography, message } from 'antd';
import Wrapper from '@common/components/Wrapper/Wrapper';
import PageTitle from '@common/components/PageTitle/PageTitle';
import usePageTitle from '@common/hooks/usePageTitle';
import axiosInstance from '@common/axiosConfig';
import { gLang } from '@common/language';
import { AI_CENTER_CONFIG_KEYS, AiCenterConfig } from '@ecuc/shared/types/ai-center.types';
import { TICKET_TYPE_NAME_MAP } from '@ecuc/shared/constants/ticket.constants';

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

const MODEL_OPTIONS = [
    { value: 'qwen-turbo', label: 'qwen-turbo' },
    { value: 'qwen-plus', label: 'qwen-plus' },
    { value: 'qwen-max', label: 'qwen-max' },
    { value: 'qwen-flash', label: 'qwen-flash' },
    { value: 'qwen-long', label: 'qwen-long' },
    { value: 'qwen-coder-turbo', label: 'qwen-coder-turbo' },
    { value: 'qwen-coder-plus', label: 'qwen-coder-plus' },
    { value: 'qwen-math-turbo', label: 'qwen-math-turbo' },
    { value: 'qwen-math-plus', label: 'qwen-math-plus' },
];

const SystemRiskControlAgent: React.FC = () => {
    usePageTitle();
    const [messageApi, contextHolder] = message.useMessage();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<AiCenterConfig | null>(null);

    const ticketTypeOptions = useMemo(() => {
        return Object.entries(TICKET_TYPE_NAME_MAP)
            .filter(([key]) => key && key !== 'None')
            .map(([key, label]) => ({
                value: key,
                label: `${label} (${key})`,
            }));
    }, []);

    const loadConfig = useCallback(async () => {
        try {
            const resp = await axiosInstance.get(
                `/ai-center/configs/${AI_CENTER_CONFIG_KEYS.SystemRiskControl}`
            );
            const payload = resp.data?.config ?? resp.data?.data?.config;
            if (!payload) {
                return;
            }
            setConfig(payload);
            form.setFieldsValue({
                enabled: payload.enabled,
                prompt: payload.prompt,
                ticketTypes: payload.config?.ticketTypes ?? [],
                model: payload.config?.model || undefined,
            });
        } catch {
            messageApi.error(gLang('aiCenter.autoReject.loadFailed'));
        }
    }, [form, messageApi]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            const currentConfig = config?.config ?? {};
            const nextConfig = {
                ...currentConfig,
                ticketTypes: values.ticketTypes ?? [],
                model: values.model ? String(values.model).trim() : '',
            };
            await axiosInstance.put(
                `/ai-center/configs/${AI_CENTER_CONFIG_KEYS.SystemRiskControl}`,
                {
                    enabled: values.enabled,
                    prompt: values.prompt,
                    config: nextConfig,
                }
            );
            messageApi.success(gLang('aiCenter.autoReject.saveSuccess'));
            await loadConfig();
        } catch {
            messageApi.error(gLang('aiCenter.autoReject.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Wrapper>
            {contextHolder}
            <PageTitle title={gLang('aiCenter.autoReject.title')} />
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Paragraph type="secondary">{gLang('aiCenter.autoReject.intro')}</Paragraph>
                <Form form={form} layout="vertical">
                    <Form.Item
                        label={gLang('aiCenter.autoReject.enabled')}
                        name="enabled"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item label={gLang('aiCenter.autoReject.ticketTypes')} name="ticketTypes">
                        <Select
                            mode="multiple"
                            allowClear
                            options={ticketTypeOptions}
                            placeholder={gLang('aiCenter.autoReject.ticketTypesPlaceholder')}
                        />
                    </Form.Item>
                    <Form.Item label={gLang('aiCenter.autoReject.model')} name="model">
                        <Select
                            allowClear
                            options={MODEL_OPTIONS}
                            placeholder={gLang('aiCenter.autoReject.modelPlaceholder')}
                        />
                    </Form.Item>
                    <Form.Item
                        label={gLang('aiCenter.autoReject.prompt')}
                        name="prompt"
                        rules={[
                            {
                                required: true,
                                message: gLang('aiCenter.autoReject.promptRequired'),
                            },
                        ]}
                    >
                        <TextArea
                            rows={10}
                            placeholder={gLang('aiCenter.autoReject.promptPlaceholder')}
                        />
                    </Form.Item>
                </Form>
                <Text type="secondary">{gLang('aiCenter.autoReject.tip')}</Text>
                <Button type="primary" loading={saving} onClick={handleSave}>
                    {gLang('aiCenter.autoReject.saveButton')}
                </Button>
            </Space>
        </Wrapper>
    );
};

export default SystemRiskControlAgent;

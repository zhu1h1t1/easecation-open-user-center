import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Col,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Switch,
    Typography,
    message,
} from 'antd';
import Wrapper from '@common/components/Wrapper/Wrapper';
import PageTitle from '@common/components/PageTitle/PageTitle';
import usePageTitle from '@common/hooks/usePageTitle';
import axiosInstance from '@common/axiosConfig';
import { gLang } from '@common/language';
import {
    AI_CENTER_CONFIG_KEYS,
    AiCenterChannelLimitRule,
    AiCenterConfig,
} from '@ecuc/shared/types/ai-center.types';
import { TICKET_TYPE_NAME_MAP } from '@ecuc/shared/constants/ticket.constants';

const { Paragraph, Text } = Typography;

const ChannelLimitAgent: React.FC = () => {
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

    const normalizeRules = (
        rules: AiCenterChannelLimitRule[] | undefined
    ): AiCenterChannelLimitRule[] => {
        if (!Array.isArray(rules)) {
            return [];
        }
        const timestamp = Date.now();
        const toNumberOrNull = (value: unknown): number | null => {
            if (typeof value === 'number') {
                return value;
            }
            if (typeof value === 'string' && value.trim() !== '') {
                const parsed = Number(value);
                return Number.isFinite(parsed) ? parsed : null;
            }
            return null;
        };
        return rules.map((rule, index) => ({
            id: rule.id || `rule_${timestamp}_${index}`,
            name: rule.name || '',
            enabled: typeof rule.enabled === 'boolean' ? rule.enabled : true,
            ticketTypes: Array.isArray(rule.ticketTypes) ? rule.ticketTypes.filter(Boolean) : [],
            dailyLimit: toNumberOrNull(rule.dailyLimit),
            weeklyLimit: toNumberOrNull(rule.weeklyLimit),
            activeLimit: toNumberOrNull(rule.activeLimit),
            cooldownHours: toNumberOrNull(rule.cooldownHours),
        }));
    };

    const loadConfig = useCallback(async () => {
        try {
            const resp = await axiosInstance.get(
                `/ai-center/configs/${AI_CENTER_CONFIG_KEYS.ChannelLimit}`
            );
            const payload = resp.data?.config ?? resp.data?.data?.config;
            if (!payload) {
                return;
            }
            setConfig(payload);
            const rawConfig = payload.config ?? {};
            form.setFieldsValue({
                enabled: payload.enabled,
                rules: normalizeRules(rawConfig.rules),
            });
        } catch {
            messageApi.error(gLang('aiCenter.channelLimit.loadFailed'));
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
                rules: values.rules ?? [],
            };
            await axiosInstance.put(`/ai-center/configs/${AI_CENTER_CONFIG_KEYS.ChannelLimit}`, {
                enabled: values.enabled,
                config: nextConfig,
            });
            messageApi.success(gLang('aiCenter.channelLimit.saveSuccess'));
            await loadConfig();
        } catch {
            messageApi.error(gLang('aiCenter.channelLimit.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Wrapper>
            {contextHolder}
            <PageTitle title={gLang('aiCenter.channelLimit.title')} />
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Paragraph type="secondary">{gLang('aiCenter.channelLimit.intro')}</Paragraph>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        rules: [],
                    }}
                >
                    <Form.Item
                        label={gLang('aiCenter.channelLimit.enabled')}
                        name="enabled"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item label={gLang('aiCenter.channelLimit.rules.title')}>
                        <Form.List name="rules">
                            {(fields, { add, remove }) => (
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    {fields.map(field => (
                                        <div
                                            key={field.key}
                                            style={{
                                                border: '1px solid #f0f0f0',
                                                borderRadius: 8,
                                                padding: 16,
                                            }}
                                        >
                                            <Form.Item
                                                name={[field.name, 'id']}
                                                hidden
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: gLang(
                                                            'aiCenter.channelLimit.rules.idRequired'
                                                        ),
                                                    },
                                                ]}
                                            >
                                                <Input />
                                            </Form.Item>
                                            <Row gutter={[16, 8]}>
                                                <Col xs={24} sm={12} lg={6}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.channelLimit.rules.enabled'
                                                        )}
                                                        name={[field.name, 'enabled']}
                                                        valuePropName="checked"
                                                    >
                                                        <Switch />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} sm={12} lg={6}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.channelLimit.rules.dailyLimit'
                                                        )}
                                                        name={[field.name, 'dailyLimit']}
                                                    >
                                                        <InputNumber
                                                            min={0}
                                                            style={{ width: '100%' }}
                                                            placeholder={gLang(
                                                                'aiCenter.channelLimit.rules.noLimit'
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} sm={12} lg={6}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.channelLimit.rules.weeklyLimit'
                                                        )}
                                                        name={[field.name, 'weeklyLimit']}
                                                    >
                                                        <InputNumber
                                                            min={0}
                                                            style={{ width: '100%' }}
                                                            placeholder={gLang(
                                                                'aiCenter.channelLimit.rules.noLimit'
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} sm={12} lg={6}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.channelLimit.rules.activeLimit'
                                                        )}
                                                        name={[field.name, 'activeLimit']}
                                                    >
                                                        <InputNumber
                                                            min={0}
                                                            style={{ width: '100%' }}
                                                            placeholder={gLang(
                                                                'aiCenter.channelLimit.rules.noLimit'
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} sm={12} lg={6}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.channelLimit.rules.cooldownHours'
                                                        )}
                                                        name={[field.name, 'cooldownHours']}
                                                    >
                                                        <InputNumber
                                                            min={0}
                                                            style={{ width: '100%' }}
                                                            placeholder={gLang(
                                                                'aiCenter.channelLimit.rules.noLimit'
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} lg={12}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.channelLimit.rules.name'
                                                        )}
                                                        name={[field.name, 'name']}
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message: gLang(
                                                                    'aiCenter.channelLimit.rules.nameRequired'
                                                                ),
                                                            },
                                                        ]}
                                                    >
                                                        <Input
                                                            placeholder={gLang(
                                                                'aiCenter.channelLimit.rules.namePlaceholder'
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} lg={12}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.channelLimit.rules.ticketTypes'
                                                        )}
                                                        name={[field.name, 'ticketTypes']}
                                                    >
                                                        <Select
                                                            mode="multiple"
                                                            allowClear
                                                            options={ticketTypeOptions}
                                                            placeholder={gLang(
                                                                'aiCenter.channelLimit.rules.ticketTypesPlaceholder'
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Button
                                                danger
                                                type="link"
                                                onClick={() => remove(field.name)}
                                            >
                                                {gLang('aiCenter.channelLimit.rules.remove')}
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        onClick={() =>
                                            add({
                                                id: `rule_${Date.now()}_${fields.length}`,
                                                name: '',
                                                enabled: true,
                                                ticketTypes: [],
                                                dailyLimit: null,
                                                weeklyLimit: null,
                                                activeLimit: null,
                                                cooldownHours: null,
                                            })
                                        }
                                    >
                                        {gLang('aiCenter.channelLimit.rules.add')}
                                    </Button>
                                </Space>
                            )}
                        </Form.List>
                    </Form.Item>
                    <Text type="secondary">{gLang('aiCenter.channelLimit.tip')}</Text>
                </Form>
                <Button type="primary" loading={saving} onClick={handleSave}>
                    {gLang('aiCenter.channelLimit.saveButton')}
                </Button>
            </Space>
        </Wrapper>
    );
};

export default ChannelLimitAgent;

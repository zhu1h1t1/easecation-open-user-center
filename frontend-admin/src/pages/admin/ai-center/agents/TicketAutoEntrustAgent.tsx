import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Input, Row, Select, Space, Switch, Typography, message } from 'antd';
import Wrapper from '@common/components/Wrapper/Wrapper';
import PageTitle from '@common/components/PageTitle/PageTitle';
import usePageTitle from '@common/hooks/usePageTitle';
import axiosInstance from '@common/axiosConfig';
import { gLang } from '@common/language';
import {
    AI_CENTER_CONFIG_KEYS,
    AiCenterConfig,
    AiCenterEntrustRule,
} from '@ecuc/shared/types/ai-center.types';
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

const TicketAutoEntrustAgent: React.FC = () => {
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

    const normalizeRules = (rules: AiCenterEntrustRule[] | undefined): AiCenterEntrustRule[] => {
        if (!Array.isArray(rules)) {
            return [];
        }
        const timestamp = Date.now();
        return rules.map((rule, index) => ({
            id: rule.id || `rule_${timestamp}_${index}`,
            name: rule.name || '',
            enabled: typeof rule.enabled === 'boolean' ? rule.enabled : true,
            matchScope: rule.matchScope || 'content',
            matchMode: rule.matchMode || 'contains',
            keywords: Array.isArray(rule.keywords) ? rule.keywords.filter(Boolean) : [],
            aiPrompt: rule.aiPrompt || '',
            ticketTypes: Array.isArray(rule.ticketTypes) ? rule.ticketTypes.filter(Boolean) : [],
            targetUserId: rule.targetUserId || '',
            priority: typeof rule.priority === 'number' ? rule.priority : 50,
        }));
    };

    const loadConfig = useCallback(async () => {
        try {
            const resp = await axiosInstance.get(
                `/ai-center/configs/${AI_CENTER_CONFIG_KEYS.TicketAutoEntrust}`
            );
            const payload = resp.data?.config ?? resp.data?.data?.config;
            if (!payload) {
                return;
            }
            setConfig(payload);
            const rawConfig = payload.config ?? {};
            form.setFieldsValue({
                enabled: payload.enabled,
                prompt: payload.prompt,
                model: rawConfig.model || undefined,
                rules: normalizeRules(rawConfig.rules),
            });
        } catch {
            messageApi.error(gLang('aiCenter.autoEntrust.loadFailed'));
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
                model: values.model ? String(values.model).trim() : '',
            };
            await axiosInstance.put(
                `/ai-center/configs/${AI_CENTER_CONFIG_KEYS.TicketAutoEntrust}`,
                {
                    enabled: values.enabled,
                    prompt: values.prompt ?? '',
                    config: nextConfig,
                }
            );
            messageApi.success(gLang('aiCenter.autoEntrust.saveSuccess'));
            await loadConfig();
        } catch {
            messageApi.error(gLang('aiCenter.autoEntrust.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Wrapper>
            {contextHolder}
            <PageTitle title={gLang('aiCenter.autoEntrust.title')} />
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Paragraph type="secondary">{gLang('aiCenter.autoEntrust.intro')}</Paragraph>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        rules: [],
                    }}
                >
                    <Form.Item
                        label={gLang('aiCenter.autoEntrust.enabled')}
                        name="enabled"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item label={gLang('aiCenter.autoEntrust.model')} name="model">
                        <Select
                            allowClear
                            options={MODEL_OPTIONS}
                            placeholder={gLang('aiCenter.autoEntrust.modelPlaceholder')}
                        />
                    </Form.Item>
                    <Form.Item label={gLang('aiCenter.autoEntrust.prompt')} name="prompt">
                        <TextArea
                            rows={6}
                            placeholder={gLang('aiCenter.autoEntrust.promptPlaceholder')}
                        />
                    </Form.Item>
                    <Form.Item label={gLang('aiCenter.autoEntrust.rules.title')}>
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
                                                            'aiCenter.autoEntrust.rules.idRequired'
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
                                                            'aiCenter.autoEntrust.rules.enabled'
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
                                                            'aiCenter.autoEntrust.rules.priority'
                                                        )}
                                                        name={[field.name, 'priority']}
                                                    >
                                                        <Input type="number" min={0} max={999} />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} lg={12}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.autoEntrust.rules.name'
                                                        )}
                                                        name={[field.name, 'name']}
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message: gLang(
                                                                    'aiCenter.autoEntrust.rules.nameRequired'
                                                                ),
                                                            },
                                                        ]}
                                                    >
                                                        <Input
                                                            placeholder={gLang(
                                                                'aiCenter.autoEntrust.rules.namePlaceholder'
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} sm={12} lg={6}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.autoEntrust.rules.matchScope'
                                                        )}
                                                        name={[field.name, 'matchScope']}
                                                    >
                                                        <Select
                                                            style={{ width: '100%' }}
                                                            options={[
                                                                {
                                                                    value: 'title',
                                                                    label: gLang(
                                                                        'aiCenter.autoEntrust.rules.matchScopeTitle'
                                                                    ),
                                                                },
                                                                {
                                                                    value: 'content',
                                                                    label: gLang(
                                                                        'aiCenter.autoEntrust.rules.matchScopeContent'
                                                                    ),
                                                                },
                                                                {
                                                                    value: 'all',
                                                                    label: gLang(
                                                                        'aiCenter.autoEntrust.rules.matchScopeAll'
                                                                    ),
                                                                },
                                                            ]}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} sm={12} lg={6}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.autoEntrust.rules.matchMode'
                                                        )}
                                                        name={[field.name, 'matchMode']}
                                                    >
                                                        <Select
                                                            style={{ width: '100%' }}
                                                            options={[
                                                                {
                                                                    value: 'contains',
                                                                    label: gLang(
                                                                        'aiCenter.autoEntrust.rules.matchModeContains'
                                                                    ),
                                                                },
                                                                {
                                                                    value: 'regex',
                                                                    label: gLang(
                                                                        'aiCenter.autoEntrust.rules.matchModeRegex'
                                                                    ),
                                                                },
                                                                {
                                                                    value: 'ai',
                                                                    label: gLang(
                                                                        'aiCenter.autoEntrust.rules.matchModeAi'
                                                                    ),
                                                                },
                                                            ]}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} lg={12}>
                                                    <Form.Item
                                                        noStyle
                                                        shouldUpdate={(prev, cur) =>
                                                            prev.rules?.[field.name]?.matchMode !==
                                                            cur.rules?.[field.name]?.matchMode
                                                        }
                                                    >
                                                        {({ getFieldValue }) => {
                                                            const matchMode = getFieldValue([
                                                                'rules',
                                                                field.name,
                                                                'matchMode',
                                                            ]);
                                                            return (
                                                                <Form.Item
                                                                    label={gLang(
                                                                        'aiCenter.autoEntrust.rules.keywords'
                                                                    )}
                                                                    name={[field.name, 'keywords']}
                                                                    rules={[
                                                                        {
                                                                            validator: (
                                                                                _,
                                                                                value
                                                                            ) => {
                                                                                if (
                                                                                    matchMode ===
                                                                                    'ai'
                                                                                ) {
                                                                                    return Promise.resolve();
                                                                                }
                                                                                if (
                                                                                    !value ||
                                                                                    value.length ===
                                                                                        0
                                                                                ) {
                                                                                    return Promise.reject(
                                                                                        new Error(
                                                                                            gLang(
                                                                                                'aiCenter.autoEntrust.rules.keywordRequired'
                                                                                            )
                                                                                        )
                                                                                    );
                                                                                }
                                                                                return Promise.resolve();
                                                                            },
                                                                        },
                                                                    ]}
                                                                >
                                                                    <Select
                                                                        mode="tags"
                                                                        tokenSeparators={[
                                                                            ',',
                                                                            '，',
                                                                        ]}
                                                                        disabled={
                                                                            matchMode === 'ai'
                                                                        }
                                                                        placeholder={gLang(
                                                                            'aiCenter.autoEntrust.rules.keywordsPlaceholder'
                                                                        )}
                                                                    />
                                                                </Form.Item>
                                                            );
                                                        }}
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} lg={12}>
                                                    <Form.Item
                                                        noStyle
                                                        shouldUpdate={(prev, cur) =>
                                                            prev.rules?.[field.name]?.matchMode !==
                                                            cur.rules?.[field.name]?.matchMode
                                                        }
                                                    >
                                                        {({ getFieldValue }) => {
                                                            const matchMode = getFieldValue([
                                                                'rules',
                                                                field.name,
                                                                'matchMode',
                                                            ]);
                                                            if (matchMode !== 'ai') {
                                                                return null;
                                                            }
                                                            return (
                                                                <Form.Item
                                                                    label={gLang(
                                                                        'aiCenter.autoEntrust.rules.aiPrompt'
                                                                    )}
                                                                    name={[field.name, 'aiPrompt']}
                                                                >
                                                                    <TextArea
                                                                        rows={3}
                                                                        placeholder={gLang(
                                                                            'aiCenter.autoEntrust.rules.aiPromptPlaceholder'
                                                                        )}
                                                                    />
                                                                </Form.Item>
                                                            );
                                                        }}
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} lg={12}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.autoEntrust.rules.ticketTypes'
                                                        )}
                                                        name={[field.name, 'ticketTypes']}
                                                    >
                                                        <Select
                                                            mode="multiple"
                                                            allowClear
                                                            options={ticketTypeOptions}
                                                            placeholder={gLang(
                                                                'aiCenter.autoEntrust.rules.ticketTypesPlaceholder'
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} sm={12} lg={6}>
                                                    <Form.Item
                                                        label={gLang(
                                                            'aiCenter.autoEntrust.rules.targetUserId'
                                                        )}
                                                        name={[field.name, 'targetUserId']}
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message: gLang(
                                                                    'aiCenter.autoEntrust.rules.targetUserIdRequired'
                                                                ),
                                                            },
                                                        ]}
                                                    >
                                                        <Input
                                                            placeholder={gLang(
                                                                'aiCenter.autoEntrust.rules.targetUserIdPlaceholder'
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
                                                {gLang('aiCenter.autoEntrust.rules.remove')}
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        onClick={() =>
                                            add({
                                                id: `rule_${Date.now()}_${fields.length}`,
                                                name: '',
                                                enabled: true,
                                                matchScope: 'content',
                                                matchMode: 'contains',
                                                keywords: [],
                                                ticketTypes: [],
                                                targetUserId: '',
                                                priority: 50,
                                            })
                                        }
                                    >
                                        {gLang('aiCenter.autoEntrust.rules.add')}
                                    </Button>
                                </Space>
                            )}
                        </Form.List>
                    </Form.Item>
                    <Text type="secondary">{gLang('aiCenter.autoEntrust.rules.tip')}</Text>
                </Form>
                <Button type="primary" loading={saving} onClick={handleSave}>
                    {gLang('aiCenter.autoEntrust.saveButton')}
                </Button>
            </Space>
        </Wrapper>
    );
};

export default TicketAutoEntrustAgent;

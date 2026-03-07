import { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Form,
    Input,
    Space,
    Typography,
    message,
    Popconfirm,
    Table,
    Modal,
    Switch,
    Checkbox,
    Divider,
    Tag,
} from 'antd';
import { fetchData, submitData } from '@common/axiosConfig';
import { gLang, getErrorMessage } from '@common/language';
import useIsPC from '@common/hooks/useIsPC';
import { StaffAlias } from '@ecuc/shared/types/staff.types';
import { useAuth } from '@common/contexts/AuthContext';

const StaffAliasAdminPublic = () => {
    const [aliases, setAliases] = useState<StaffAlias[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm<{ name: string }>();
    const [messageApi, contextHolder] = message.useMessage();
    const [editingAlias, setEditingAlias] = useState<StaffAlias | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRandomSettingModalOpen, setIsRandomSettingModalOpen] = useState(false);
    const [randomEnabled, setRandomEnabled] = useState(false);
    const [selectedAliasIds, setSelectedAliasIds] = useState<number[]>([]);
    const [loadingRandomSetting, setLoadingRandomSetting] = useState(false);
    const [savingRandomSetting, setSavingRandomSetting] = useState(false);
    const { user } = useAuth();
    const isPC = useIsPC();

    const parseAlias = (alias: string | null | undefined): { name: string } | null => {
        if (!alias || alias.trim().length === 0) {
            return null;
        }
        return {
            name: alias.trim(),
        };
    };

    const fetchAliases = async () => {
        setLoading(true);
        try {
            await fetchData({
                url: '/staff/alias',
                method: 'GET',
                data: {},
                setData: response => {
                    const aliasesList: StaffAlias[] = (response?.aliases ?? []).map(
                        (alias: any) => ({
                            ...alias,
                            is_default: Boolean(alias.is_default),
                        })
                    );
                    const hasDefault = aliasesList.some(a => a.is_default);
                    const hideStaffNameOption: StaffAlias = {
                        id: 0,
                        uid: String(user?.userid || ''),
                        alias: gLang('staffAlias.form.hideStaffName'),
                        is_default: !hasDefault,
                        in_random_pool: false,
                        updated_at: '',
                        updated_by: null,
                    };
                    setAliases([hideStaffNameOption, ...aliasesList]);
                },
                setSpin: setLoading,
            });
        } catch (error: any) {
            const description = error?.response?.data?.EPF_description;
            messageApi.error(description || gLang('staffAlias.message.loadFailed'));
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAliases();
    }, []);

    const handleSubmit = async (values: { name: string }) => {
        setSubmitting(true);
        try {
            await submitData({
                data: {
                    id: editingAlias?.id,
                    name: values.name.trim(),
                    is_default: editingAlias?.is_default || false,
                    in_random_pool: editingAlias?.in_random_pool || false,
                },
                url: '/staff/alias',
                method: 'PUT',
                successMessage: 'staffAlias.message.saveSuccess',
                setIsFormDisabled: setSubmitting,
                setIsModalOpen: (isOpen: boolean) => {
                    if (!isOpen) {
                        setIsModalOpen(false);
                        setEditingAlias(null);
                        form.resetFields();
                        fetchAliases();
                    }
                },
                messageApi,
            });
        } catch (error: any) {
            const errorCode = error?.response?.data?.EPF_code;
            const description = error?.response?.data?.EPF_description;
            if (errorCode && errorCode >= 6001 && errorCode <= 6010) {
                messageApi.error(getErrorMessage(errorCode, description));
            } else {
                messageApi.error(description || gLang('staffAlias.message.saveFailed'));
            }
            setSubmitting(false);
        }
    };

    const handleDelete = async (alias: StaffAlias) => {
        try {
            await submitData({
                data: { id: alias.id },
                url: '/staff/alias',
                method: 'DELETE',
                successMessage: 'staffAlias.message.deleteSuccess',
                setIsFormDisabled: () => {},
                setIsModalOpen: () => {
                    fetchAliases();
                },
                messageApi,
            });
        } catch (error: any) {
            const errorCode = error?.response?.data?.EPF_code;
            const description = error?.response?.data?.EPF_description;
            if (errorCode && errorCode >= 6001 && errorCode <= 6010) {
                messageApi.error(getErrorMessage(errorCode, description));
            } else {
                messageApi.error(description || gLang('staffAlias.message.deleteFailed'));
            }
        }
    };

    const handleSetDefault = async (alias: StaffAlias) => {
        try {
            if (alias.id === 0) {
                await submitData({
                    data: {},
                    url: '/staff/alias/clear-all-default',
                    method: 'POST',
                    successMessage: 'staffAlias.message.clearAllDefaultSuccess',
                    setIsFormDisabled: () => {},
                    setIsModalOpen: () => {
                        fetchAliases();
                    },
                    messageApi,
                });
            } else {
                await submitData({
                    data: { id: alias.id },
                    url: '/staff/alias/set-default',
                    method: 'POST',
                    successMessage: 'staffAlias.message.setDefaultSuccess',
                    setIsFormDisabled: () => {},
                    setIsModalOpen: () => {
                        fetchAliases();
                    },
                    messageApi,
                });
            }
        } catch (error: any) {
            const errorCode = error?.response?.data?.EPF_code;
            const description = error?.response?.data?.EPF_description;
            if (errorCode && errorCode >= 6001 && errorCode <= 6010) {
                messageApi.error(getErrorMessage(errorCode, description));
            } else {
                messageApi.error(description || gLang('staffAlias.message.setDefaultFailed'));
            }
        }
    };

    const handleAddNew = () => {
        setEditingAlias(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (alias: StaffAlias) => {
        setEditingAlias(alias);
        const parsed = parseAlias(alias.alias);
        if (parsed) {
            form.setFieldsValue({
                name: parsed.name,
            });
        }
        setIsModalOpen(true);
    };

    const handleOpenRandomSetting = async () => {
        setIsRandomSettingModalOpen(true);
        setLoadingRandomSetting(true);
        try {
            let setting: any = null;
            await fetchData({
                url: '/staff/alias/random-setting',
                method: 'GET',
                data: {},
                setData: (response: any) => {
                    setting = response?.data || response;
                },
                setSpin: () => {},
            });
            setRandomEnabled(setting?.enabled || false);

            const realAliases = aliases.filter(a => a.id !== 0);
            const selectedIds = realAliases.filter(a => a.in_random_pool).map(a => a.id);
            if (selectedIds.length === 0 && realAliases.length > 0) {
                setSelectedAliasIds(realAliases.map(a => a.id));
            } else {
                setSelectedAliasIds(selectedIds);
            }
        } catch (error: any) {
            const description = error?.response?.data?.EPF_description;
            messageApi.error(description || gLang('staffAlias.randomSetting.loadFailed'));
            const realAliases = aliases.filter(a => a.id !== 0);
            if (realAliases.length > 0) {
                setSelectedAliasIds(realAliases.map(a => a.id));
            }
        } finally {
            setLoadingRandomSetting(false);
        }
    };

    const handleSelectAll = () => {
        setSelectedAliasIds(aliases.map(a => a.id));
    };

    const handleUnselectAll = () => {
        setSelectedAliasIds([]);
        if (randomEnabled) {
            setRandomEnabled(false);
        }
    };

    const handleApplyRandomSetting = async () => {
        if (randomEnabled && selectedAliasIds.length === 0) {
            messageApi.warning(gLang('staffAlias.randomSetting.noAliasSelected'));
            return;
        }
        setSavingRandomSetting(true);
        try {
            await submitData({
                data: {
                    enabled: randomEnabled,
                    selected_alias_ids: selectedAliasIds,
                },
                url: '/staff/alias/random-setting',
                method: 'PUT',
                successMessage: 'staffAlias.randomSetting.saveSuccess',
                setIsFormDisabled: setSavingRandomSetting,
                setIsModalOpen: (isOpen: boolean) => {
                    if (!isOpen) {
                        setIsRandomSettingModalOpen(false);
                        fetchAliases();
                    }
                },
                messageApi,
            });
        } catch (error: any) {
            const description = error?.response?.data?.EPF_description;
            messageApi.error(description || gLang('staffAlias.randomSetting.saveFailed'));
        } finally {
            setSavingRandomSetting(false);
        }
    };

    const columns = [
        {
            title: gLang('staffAlias.table.alias'),
            dataIndex: 'alias',
            key: 'alias',
            render: (alias: string, record: StaffAlias) => (
                <Space>
                    <Typography.Text>{alias}</Typography.Text>
                    {record.is_default && (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            ({gLang('staffAlias.form.default')})
                        </Typography.Text>
                    )}
                    {record.id === 0 && (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            ({gLang('staffAlias.form.hideStaffNameDesc')})
                        </Typography.Text>
                    )}
                </Space>
            ),
        },
        {
            title: gLang('staffAlias.table.lastUpdated'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (updatedAt: string) => (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {updatedAt}
                </Typography.Text>
            ),
        },
        {
            title: gLang('staffAlias.table.action'),
            key: 'action',
            render: (_: any, record: StaffAlias) => {
                if (record.id === 0) {
                    return (
                        <Space>
                            {!record.is_default && (
                                <Button size="small" onClick={() => handleSetDefault(record)}>
                                    {gLang('staffAlias.form.setDefault')}
                                </Button>
                            )}
                        </Space>
                    );
                }
                return (
                    <Space>
                        <Button size="small" onClick={() => handleEdit(record)}>
                            {gLang('staffAlias.form.edit')}
                        </Button>
                        {!record.is_default && (
                            <Button size="small" onClick={() => handleSetDefault(record)}>
                                {gLang('staffAlias.form.setDefault')}
                            </Button>
                        )}
                        <Popconfirm
                            title={gLang('staffAlias.form.deleteConfirm')}
                            onConfirm={() => handleDelete(record)}
                            okText={gLang('staffAlias.form.confirm')}
                            cancelText={gLang('cancel')}
                        >
                            <Button size="small" danger>
                                {gLang('staffAlias.form.delete')}
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    return (
        <Space direction="vertical" style={{ width: '100%' }} size={24}>
            {contextHolder}
            <Typography>
                <Typography.Title level={3}>{gLang('staffAlias.title')}</Typography.Title>
                <Typography.Paragraph type="secondary">
                    {gLang('staffAlias.intro')}
                </Typography.Paragraph>
            </Typography>

            <Alert type="warning" message={gLang('staffAlias.notice')} showIcon />

            <Card
                title={gLang('staffAlias.form.listTitle')}
                loading={loading}
                extra={
                    isPC ? (
                        <Space>
                            <Button onClick={handleOpenRandomSetting}>
                                {gLang('staffAlias.randomSetting.button')}
                            </Button>
                            <Button type="primary" onClick={handleAddNew}>
                                {gLang('staffAlias.form.addNew')}
                            </Button>
                        </Space>
                    ) : undefined
                }
            >
                {!isPC && (
                    <Space
                        direction="vertical"
                        style={{ width: '100%', marginBottom: 16 }}
                        size={8}
                    >
                        <Button onClick={handleOpenRandomSetting} block>
                            {gLang('staffAlias.randomSetting.button')}
                        </Button>
                        <Button type="primary" onClick={handleAddNew} block>
                            {gLang('staffAlias.form.addNew')}
                        </Button>
                    </Space>
                )}
                {isPC ? (
                    <Table
                        columns={columns}
                        dataSource={aliases}
                        rowKey="id"
                        pagination={false}
                        locale={{ emptyText: gLang('staffAlias.meta.defaultPreview') }}
                    />
                ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size={12}>
                        {aliases.map(alias => {
                            return (
                                <Card
                                    key={alias.id}
                                    size="small"
                                    style={{
                                        borderRadius: 8,
                                        border: '1px solid var(--ant-color-border)',
                                    }}
                                >
                                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <Typography.Text strong>
                                                    {alias.alias}
                                                </Typography.Text>
                                                {alias.is_default && (
                                                    <Tag color="blue" style={{ marginLeft: 8 }}>
                                                        {gLang('staffAlias.form.default')}
                                                    </Tag>
                                                )}
                                                {alias.id === 0 && (
                                                    <Typography.Text
                                                        type="secondary"
                                                        style={{
                                                            fontSize: 12,
                                                            display: 'block',
                                                            marginTop: 4,
                                                        }}
                                                    >
                                                        (
                                                        {gLang('staffAlias.form.hideStaffNameDesc')}
                                                        )
                                                    </Typography.Text>
                                                )}
                                            </div>
                                        </div>
                                        {alias.updated_at && (
                                            <Typography.Text
                                                type="secondary"
                                                style={{ fontSize: 12 }}
                                            >
                                                {gLang('staffAlias.table.lastUpdated')}:{' '}
                                                {alias.updated_at}
                                            </Typography.Text>
                                        )}
                                        <Space wrap>
                                            {alias.id === 0 ? (
                                                !alias.is_default && (
                                                    <Button
                                                        size="small"
                                                        onClick={() => handleSetDefault(alias)}
                                                    >
                                                        {gLang('staffAlias.form.setDefault')}
                                                    </Button>
                                                )
                                            ) : (
                                                <>
                                                    <Button
                                                        size="small"
                                                        onClick={() => handleEdit(alias)}
                                                    >
                                                        {gLang('staffAlias.form.edit')}
                                                    </Button>
                                                    {!alias.is_default && (
                                                        <Button
                                                            size="small"
                                                            onClick={() => handleSetDefault(alias)}
                                                        >
                                                            {gLang('staffAlias.form.setDefault')}
                                                        </Button>
                                                    )}
                                                    <Popconfirm
                                                        title={gLang(
                                                            'staffAlias.form.deleteConfirm'
                                                        )}
                                                        onConfirm={() => handleDelete(alias)}
                                                        okText={gLang('staffAlias.form.confirm')}
                                                        cancelText={gLang('cancel')}
                                                    >
                                                        <Button size="small" danger>
                                                            {gLang('staffAlias.form.delete')}
                                                        </Button>
                                                    </Popconfirm>
                                                </>
                                            )}
                                        </Space>
                                    </Space>
                                </Card>
                            );
                        })}
                        {aliases.length === 0 && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: 'var(--ant-color-text-secondary)',
                                }}
                            >
                                {gLang('staffAlias.meta.defaultPreview')}
                            </div>
                        )}
                    </Space>
                )}
            </Card>

            <Modal
                title={
                    editingAlias ? gLang('staffAlias.form.edit') : gLang('staffAlias.form.addNew')
                }
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingAlias(null);
                    form.resetFields();
                }}
                footer={null}
                width={isPC ? undefined : '95%'}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="name"
                        label={gLang('staffAlias.form.name')}
                        rules={[
                            { required: true, message: gLang('required') },
                            {
                                max: 32,
                                message: gLang('staffAlias.form.nameRule'),
                            },
                        ]}
                    >
                        <Input placeholder={gLang('staffAlias.form.namePlaceholder')} />
                    </Form.Item>
                    <Form.Item>
                        {isPC ? (
                            <Space>
                                <Button type="primary" htmlType="submit" loading={submitting}>
                                    {gLang('staffAlias.form.submit')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingAlias(null);
                                        form.resetFields();
                                    }}
                                >
                                    {gLang('cancel')}
                                </Button>
                            </Space>
                        ) : (
                            <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                <Button type="primary" htmlType="submit" loading={submitting} block>
                                    {gLang('staffAlias.form.submit')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingAlias(null);
                                        form.resetFields();
                                    }}
                                    block
                                >
                                    {gLang('cancel')}
                                </Button>
                            </Space>
                        )}
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={gLang('staffAlias.randomSetting.title')}
                open={isRandomSettingModalOpen}
                onCancel={() => {
                    setIsRandomSettingModalOpen(false);
                }}
                footer={null}
                width={isPC ? 600 : '95%'}
                loading={loadingRandomSetting}
            >
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                    <div>
                        <Space>
                            <Switch
                                checked={randomEnabled}
                                disabled={selectedAliasIds.length === 0}
                                onChange={checked => {
                                    if (checked && selectedAliasIds.length === 0) {
                                        messageApi.warning(
                                            gLang('staffAlias.randomSetting.noAliasSelected')
                                        );
                                        return;
                                    }
                                    setRandomEnabled(checked);
                                }}
                            />
                            <Typography.Text>
                                {gLang('staffAlias.randomSetting.enabled')}
                            </Typography.Text>
                        </Space>
                        <Typography.Paragraph
                            type="secondary"
                            style={{ marginTop: 8, marginBottom: 0 }}
                        >
                            {gLang('staffAlias.randomSetting.enabledDesc')}
                        </Typography.Paragraph>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div>
                        <Space style={{ marginBottom: 12 }}>
                            <Button size="small" onClick={handleSelectAll}>
                                {gLang('staffAlias.randomSetting.selectAll')}
                            </Button>
                            <Button size="small" onClick={handleUnselectAll}>
                                {gLang('staffAlias.randomSetting.unselectAll')}
                            </Button>
                        </Space>
                        <Space direction="vertical" style={{ width: '100%' }} size={8}>
                            {aliases.length === 0 ? (
                                <Typography.Text type="secondary">
                                    {gLang('staffAlias.meta.defaultPreview')}
                                </Typography.Text>
                            ) : (
                                aliases
                                    .filter(a => a.id !== 0)
                                    .map(alias => (
                                        <Checkbox
                                            key={alias.id}
                                            checked={selectedAliasIds.includes(alias.id)}
                                            onChange={e => {
                                                if (e.target.checked) {
                                                    setSelectedAliasIds([
                                                        ...selectedAliasIds,
                                                        alias.id,
                                                    ]);
                                                } else {
                                                    const newIds = selectedAliasIds.filter(
                                                        id => id !== alias.id
                                                    );
                                                    setSelectedAliasIds(newIds);
                                                    if (newIds.length === 0 && randomEnabled) {
                                                        setRandomEnabled(false);
                                                    }
                                                }
                                            }}
                                        >
                                            <Space>
                                                <Typography.Text>{alias.alias}</Typography.Text>
                                                {alias.is_default && (
                                                    <Typography.Text
                                                        type="secondary"
                                                        style={{ fontSize: 12 }}
                                                    >
                                                        ({gLang('staffAlias.form.default')})
                                                    </Typography.Text>
                                                )}
                                            </Space>
                                        </Checkbox>
                                    ))
                            )}
                        </Space>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    {isPC ? (
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => setIsRandomSettingModalOpen(false)}>
                                {gLang('staffAlias.randomSetting.cancel')}
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleApplyRandomSetting}
                                loading={savingRandomSetting}
                                disabled={randomEnabled && selectedAliasIds.length === 0}
                            >
                                {gLang('staffAlias.randomSetting.apply')}
                            </Button>
                        </Space>
                    ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size={8}>
                            <Button
                                type="primary"
                                onClick={handleApplyRandomSetting}
                                loading={savingRandomSetting}
                                disabled={randomEnabled && selectedAliasIds.length === 0}
                                block
                            >
                                {gLang('staffAlias.randomSetting.apply')}
                            </Button>
                            <Button onClick={() => setIsRandomSettingModalOpen(false)} block>
                                {gLang('staffAlias.randomSetting.cancel')}
                            </Button>
                        </Space>
                    )}
                </Space>
            </Modal>
        </Space>
    );
};

export default StaffAliasAdminPublic;

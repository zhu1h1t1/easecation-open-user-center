/**
 * 原石商城（管理端）：查看记录、修改原石、openid 别名管理、商品管理（仿媒体商城）
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Tabs,
    Card,
    Table,
    Form,
    Input,
    Button,
    message,
    Space,
    Typography,
    AutoComplete,
    Popconfirm,
    Modal,
    InputNumber,
} from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import axiosInstance from '@common/axiosConfig';
import { gLang } from '@common/language';

interface TlgiftLog {
    id: number;
    openid: string;
    type: string;
    amount: number;
    product_id: string | null;
    ecid: string | null;
    operator: string;
    created_at: string;
}

interface AliasItem {
    alias: string;
    openid: string;
}

interface TlgiftItemRow {
    id: string;
    title: string;
    price: number;
    total_limit: number;
    person_limit: number;
    user_limit: number;
    sales: number;
    json?: string | null;
}

const TlgiftMall: React.FC = () => {
    const [logs, setLogs] = useState<TlgiftLog[]>([]);
    const [queryOpenid, setQueryOpenid] = useState('');
    const [loading, setLoading] = useState(false);
    const [balanceForm] = Form.useForm();
    const [aliases, setAliases] = useState<AliasItem[]>([]);
    const [aliasForm] = Form.useForm();
    const [aliasLoading, setAliasLoading] = useState(false);
    const [items, setItems] = useState<TlgiftItemRow[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [itemEditId, setItemEditId] = useState<string | null>(null);
    const [itemForm] = Form.useForm();
    const [itemSubmitLoading, setItemSubmitLoading] = useState(false);
    const [loadCsvModalOpen, setLoadCsvModalOpen] = useState(false);
    const [loadCsvLoading, setLoadCsvLoading] = useState(false);
    const [uploadCsvModalOpen, setUploadCsvModalOpen] = useState(false);
    const [uploadCsvPending, setUploadCsvPending] = useState<{
        name: string;
        content: string;
    } | null>(null);
    const [uploadCsvLoading, setUploadCsvLoading] = useState(false);
    const uploadCsvInputRef = useRef<HTMLInputElement>(null);
    const [messageApi, contextHolder] = message.useMessage();

    const loadAliases = async () => {
        const res = await axiosInstance.get('/tlgift/aliases');
        if (res.data?.EPF_code === 200 && res.data?.data) setAliases(res.data.data);
    };

    const loadItems = async () => {
        setItemsLoading(true);
        try {
            const res = await axiosInstance.get('/tlgift/items');
            if (res.data?.EPF_code === 200 && Array.isArray(res.data?.data))
                setItems(res.data.data);
            else setItems([]);
        } catch {
            setItems([]);
        } finally {
            setItemsLoading(false);
        }
    };

    useEffect(() => {
        loadAliases();
        loadItems();
    }, []);

    const aliasOptions = aliases.map(a => ({
        value: a.alias,
        label: `${a.alias} (${a.openid})`,
    }));

    const loadLogs = async (openidOrAlias: string) => {
        const o = String(openidOrAlias || '').trim();
        if (!o) {
            messageApi.warning(gLang('tlgiftAdmin.openidOrAliasRequired'));
            return;
        }
        setLoading(true);
        try {
            const res = await axiosInstance.get('/tlgift/logs', { params: { openid: o } });
            if (res.data?.EPF_code === 200 && res.data?.data) setLogs(res.data.data);
            else setLogs([]);
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const onSetBalance = async (v: { openid: string; amount: number }) => {
        const openidStr = String(v.openid ?? '').trim();
        if (!openidStr) {
            messageApi.warning(gLang('admin.tlgiftOpenidRequired'));
            return;
        }
        try {
            const res = await axiosInstance.put('/tlgift/balance', {
                openid: openidStr,
                amount: v.amount,
            });
            if (res.data?.EPF_code === 200) {
                messageApi.success(gLang('tlgiftAdmin.balanceUpdated'));
                (balanceForm as unknown as { resetFields: () => void }).resetFields();
            } else {
                messageApi.error(res.data?.EPF_description || gLang('tlgiftAdmin.failed'));
            }
        } catch (e: any) {
            messageApi.error(
                e.response?.data?.EPF_description || gLang('tlgiftAdmin.requestFailed')
            );
        }
    };

    const onAddAlias = async (v: { alias: string; openid: string }) => {
        const a = String(v.alias ?? '').trim();
        const o = String(v.openid ?? '').trim();
        if (!a || !o) {
            messageApi.warning(gLang('tlgiftAdmin.aliasAndOpenidRequired'));
            return;
        }
        setAliasLoading(true);
        try {
            const res = await axiosInstance.post('/tlgift/aliases', { alias: a, openid: o });
            if (res.data?.EPF_code === 200) {
                messageApi.success(gLang('tlgiftAdmin.added'));
                (aliasForm as unknown as { resetFields: () => void }).resetFields();
                loadAliases();
            } else {
                messageApi.error(res.data?.EPF_description || gLang('tlgiftAdmin.failed'));
            }
        } catch (e: any) {
            messageApi.error(
                e.response?.data?.EPF_description || gLang('tlgiftAdmin.requestFailed')
            );
        } finally {
            setAliasLoading(false);
        }
    };

    const onDeleteAlias = async (alias: string) => {
        try {
            const res = await axiosInstance.delete(`/tlgift/aliases/${encodeURIComponent(alias)}`);
            if (res.data?.EPF_code === 200) {
                messageApi.success(gLang('tlgiftAdmin.deleted'));
                loadAliases();
            } else {
                messageApi.error(res.data?.EPF_description || gLang('tlgiftAdmin.failed'));
            }
        } catch (e: any) {
            messageApi.error(
                e.response?.data?.EPF_description || gLang('tlgiftAdmin.requestFailed')
            );
        }
    };

    const openAddItem = () => {
        setItemEditId(null);
        (itemForm as unknown as { resetFields: () => void }).resetFields();
        (itemForm as unknown as { setFieldsValue: (v: object) => void }).setFieldsValue({
            sales: 0,
            total_limit: 0,
            person_limit: 0,
            user_limit: 0,
        });
        setItemModalOpen(true);
    };

    const formApi = itemForm as unknown as {
        setFieldsValue: (v: object) => void;
        validateFields: () => Promise<Record<string, unknown>>;
    };
    const openEditItem = (row: TlgiftItemRow) => {
        setItemEditId(row.id);
        formApi.setFieldsValue({
            id: row.id,
            title: row.title,
            price: row.price,
            total_limit: row.total_limit,
            person_limit: row.person_limit,
            user_limit: row.user_limit,
            sales: row.sales,
            json: row.json ?? '',
        });
        setItemModalOpen(true);
    };

    const onItemModalOk = async () => {
        const v = await formApi.validateFields().catch(() => null);
        if (!v) return;
        setItemSubmitLoading(true);
        try {
            if (itemEditId) {
                const res = await axiosInstance.put(
                    `/tlgift/items/${encodeURIComponent(itemEditId)}`,
                    {
                        title: v.title,
                        price: v.price,
                        total_limit: v.total_limit,
                        person_limit: v.person_limit,
                        user_limit: v.user_limit,
                        sales: v.sales,
                        json: v.json || undefined,
                    }
                );
                if (res.data?.EPF_code === 200) {
                    messageApi.success(gLang('tlgiftAdmin.updated'));
                    setItemModalOpen(false);
                    loadItems();
                } else {
                    messageApi.error(res.data?.EPF_description || gLang('tlgiftAdmin.failed'));
                }
            } else {
                const res = await axiosInstance.post('/tlgift/items', {
                    id: v.id,
                    title: v.title,
                    price: v.price,
                    total_limit: v.total_limit,
                    person_limit: v.person_limit,
                    user_limit: v.user_limit,
                    sales: v.sales ?? 0,
                    json: v.json || undefined,
                });
                if (res.data?.EPF_code === 200) {
                    messageApi.success(gLang('tlgiftAdmin.added'));
                    setItemModalOpen(false);
                    loadItems();
                } else {
                    messageApi.error(res.data?.EPF_description || gLang('tlgiftAdmin.failed'));
                }
            }
        } catch (e: any) {
            messageApi.error(
                e.response?.data?.EPF_description || gLang('tlgiftAdmin.requestFailed')
            );
        } finally {
            setItemSubmitLoading(false);
        }
    };

    const onDeleteItem = async (id: string) => {
        try {
            const res = await axiosInstance.delete(`/tlgift/items/${encodeURIComponent(id)}`);
            if (res.data?.EPF_code === 200) {
                messageApi.success(gLang('tlgiftAdmin.deleted'));
                loadItems();
            } else {
                messageApi.error(res.data?.EPF_description || gLang('tlgiftAdmin.failed'));
            }
        } catch (e: any) {
            messageApi.error(
                e.response?.data?.EPF_description || gLang('tlgiftAdmin.requestFailed')
            );
        }
    };

    const tabLogs = (
        <Card title={gLang('tlgiftAdmin.tabLogsTitle')}>
            <Space style={{ marginBottom: 16 }}>
                <AutoComplete
                    options={aliasOptions}
                    placeholder={gLang('tlgiftAdmin.openidPlaceholder')}
                    style={{ width: 320 }}
                    value={queryOpenid}
                    onChange={setQueryOpenid}
                    onSelect={val => setQueryOpenid(val)}
                    allowClear
                    filterOption={(input, option) =>
                        (option?.value ?? '').toLowerCase().includes((input || '').toLowerCase()) ||
                        (option?.label ?? '')
                            .toString()
                            .toLowerCase()
                            .includes((input || '').toLowerCase())
                    }
                />
                <Button type="primary" onClick={() => loadLogs(queryOpenid)} loading={loading}>
                    {gLang('tlgiftAdmin.query')}
                </Button>
            </Space>
            <Table
                loading={loading}
                dataSource={logs}
                rowKey="id"
                size="small"
                columns={[
                    {
                        title: gLang('tlgiftAdmin.tableTime'),
                        dataIndex: 'created_at',
                        key: 'created_at',
                        render: (t: string) => t?.slice(0, 19),
                    },
                    {
                        title: gLang('tlgiftAdmin.tableType'),
                        dataIndex: 'type',
                        key: 'type',
                        render: (t: string) =>
                            t === 'consume'
                                ? gLang('tlgiftAdmin.logTypeConsume')
                                : gLang('tlgiftAdmin.logTypeAdjust'),
                    },
                    {
                        title: gLang('tlgiftAdmin.tableAmount'),
                        dataIndex: 'amount',
                        key: 'amount',
                        render: (a: number) => (a > 0 ? `+${a}` : a),
                    },
                    {
                        title: gLang('tlgiftAdmin.tableOperator'),
                        dataIndex: 'operator',
                        key: 'operator',
                    },
                ]}
                pagination={false}
            />
            <Typography.Text type="secondary">{gLang('tlgiftAdmin.logsHint')}</Typography.Text>
        </Card>
    );

    const tabAdmin = (
        <Card title={gLang('tlgiftAdmin.tabAdminTitle')}>
            <Form form={balanceForm} layout="vertical" onFinish={onSetBalance}>
                <Form.Item
                    name="openid"
                    label={gLang('tlgiftAdmin.accountLabel')}
                    rules={[
                        { required: true, message: gLang('tlgiftAdmin.openidOrAliasRequired') },
                    ]}
                >
                    <AutoComplete
                        options={aliasOptions}
                        placeholder={gLang('tlgiftAdmin.openidPlaceholder')}
                        allowClear
                        filterOption={(input, option) =>
                            (option?.value ?? '')
                                .toLowerCase()
                                .includes((input || '').toLowerCase()) ||
                            (option?.label ?? '')
                                .toString()
                                .toLowerCase()
                                .includes((input || '').toLowerCase())
                        }
                    />
                </Form.Item>
                <Form.Item
                    name="amount"
                    label={gLang('tlgiftAdmin.amountLabel')}
                    rules={[{ required: true, message: gLang('tlgiftAdmin.amountRequired') }]}
                >
                    <Input
                        type="number"
                        min={0}
                        placeholder={gLang('tlgiftAdmin.amountPlaceholder')}
                    />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        {gLang('tlgiftAdmin.save')}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );

    const tabItems = (
        <Card title={gLang('tlgiftAdmin.tabItemsTitle')}>
            <Typography.Paragraph type="secondary">
                {gLang('tlgiftAdmin.tabItemsIntro')}
            </Typography.Paragraph>
            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openAddItem}>
                    {gLang('tlgiftAdmin.addProduct')}
                </Button>
                <Button onClick={() => setLoadCsvModalOpen(true)}>
                    {gLang('tlgiftAdmin.loadFromCsv')}
                </Button>
                <Button
                    icon={<UploadOutlined />}
                    onClick={() => uploadCsvInputRef.current?.click()}
                >
                    {gLang('tlgiftAdmin.uploadCsv')}
                </Button>
                <input
                    ref={uploadCsvInputRef}
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                            const content = typeof reader.result === 'string' ? reader.result : '';
                            setUploadCsvPending({ name: file.name, content });
                            setUploadCsvModalOpen(true);
                        };
                        reader.readAsText(file, 'UTF-8');
                        e.target.value = '';
                    }}
                />
            </Space>
            <Table
                loading={itemsLoading}
                dataSource={items}
                rowKey="id"
                size="small"
                columns={[
                    {
                        title: gLang('tlgiftAdmin.colId'),
                        dataIndex: 'id',
                        key: 'id',
                        width: 100,
                        ellipsis: true,
                    },
                    {
                        title: gLang('tlgiftAdmin.colTitle'),
                        dataIndex: 'title',
                        key: 'title',
                        ellipsis: true,
                    },
                    {
                        title: gLang('tlgiftAdmin.colPrice'),
                        dataIndex: 'price',
                        key: 'price',
                        width: 90,
                    },
                    {
                        title: gLang('tlgiftAdmin.colTotalLimit'),
                        dataIndex: 'total_limit',
                        key: 'total_limit',
                        width: 80,
                    },
                    {
                        title: gLang('tlgiftAdmin.colPersonLimit'),
                        dataIndex: 'person_limit',
                        key: 'person_limit',
                        width: 80,
                    },
                    {
                        title: gLang('tlgiftAdmin.colUserLimit'),
                        dataIndex: 'user_limit',
                        key: 'user_limit',
                        width: 90,
                    },
                    {
                        title: gLang('tlgiftAdmin.colSales'),
                        dataIndex: 'sales',
                        key: 'sales',
                        width: 70,
                    },
                    {
                        title: gLang('tlgiftAdmin.colJson'),
                        dataIndex: 'json',
                        key: 'json',
                        ellipsis: true,
                        render: (t: string | null) =>
                            t ? (t.length > 40 ? t.slice(0, 40) + '…' : t) : '—',
                    },
                    {
                        title: gLang('tlgiftAdmin.colAction'),
                        key: 'action',
                        width: 120,
                        render: (_: unknown, row: TlgiftItemRow) => (
                            <Space size="small">
                                <Button type="link" size="small" onClick={() => openEditItem(row)}>
                                    {gLang('tlgiftAdmin.edit')}
                                </Button>
                                <Popconfirm
                                    title={gLang('tlgiftAdmin.deleteItemConfirm')}
                                    onConfirm={() => onDeleteItem(row.id)}
                                >
                                    <Button type="link" danger size="small">
                                        {gLang('tlgiftAdmin.delete')}
                                    </Button>
                                </Popconfirm>
                            </Space>
                        ),
                    },
                ]}
                pagination={{ pageSize: 20 }}
            />
            <Modal
                title={
                    itemEditId
                        ? gLang('tlgiftAdmin.itemModalEdit')
                        : gLang('tlgiftAdmin.itemModalAdd')
                }
                open={itemModalOpen}
                onCancel={() => setItemModalOpen(false)}
                onOk={onItemModalOk}
                confirmLoading={itemSubmitLoading}
                width={520}
                destroyOnClose
            >
                <Form
                    form={itemForm}
                    layout="vertical"
                    initialValues={{ sales: 0, total_limit: 0, person_limit: 0, user_limit: 0 }}
                >
                    <Form.Item
                        name="id"
                        label={gLang('tlgiftAdmin.formId')}
                        rules={[{ required: true }]}
                    >
                        <Input
                            placeholder={gLang('tlgiftAdmin.formIdPlaceholder')}
                            disabled={!!itemEditId}
                        />
                    </Form.Item>
                    <Form.Item
                        name="title"
                        label={gLang('tlgiftAdmin.formTitle')}
                        rules={[{ required: true }]}
                    >
                        <Input placeholder={gLang('tlgiftAdmin.formTitlePlaceholder')} />
                    </Form.Item>
                    <Form.Item
                        name="price"
                        label={gLang('tlgiftAdmin.formPrice')}
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="total_limit" label={gLang('tlgiftAdmin.formTotalLimit')}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="person_limit" label={gLang('tlgiftAdmin.formPersonLimit')}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="user_limit" label={gLang('tlgiftAdmin.formUserLimit')}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="sales" label={gLang('tlgiftAdmin.formSales')}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="json" label={gLang('tlgiftAdmin.formJson')}>
                        <Input.TextArea
                            rows={3}
                            placeholder={gLang('tlgiftAdmin.formJsonPlaceholder')}
                        />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title={gLang('tlgiftAdmin.loadCsvModalTitle')}
                open={loadCsvModalOpen}
                onCancel={() => !loadCsvLoading && setLoadCsvModalOpen(false)}
                onOk={async () => {
                    setLoadCsvLoading(true);
                    try {
                        const res = await axiosInstance.post('/tlgift/items/load-from-csv');
                        if (res.data?.EPF_code === 200) {
                            messageApi.success(
                                res.data?.EPF_description ?? gLang('tlgiftAdmin.loadCsvSuccess')
                            );
                            setLoadCsvModalOpen(false);
                            loadItems();
                        } else {
                            messageApi.error(
                                res.data?.EPF_description ?? gLang('tlgiftAdmin.loadCsvFailed')
                            );
                        }
                    } catch (e: unknown) {
                        messageApi.error(
                            (e as { response?: { data?: { EPF_description?: string } } })?.response
                                ?.data?.EPF_description ?? gLang('tlgiftAdmin.requestFailed')
                        );
                    } finally {
                        setLoadCsvLoading(false);
                    }
                }}
                confirmLoading={loadCsvLoading}
                okText={gLang('tlgiftAdmin.loadCsvOk')}
            >
                <Typography.Paragraph>{gLang('tlgiftAdmin.loadCsvConfirm')}</Typography.Paragraph>
            </Modal>
            <Modal
                title={gLang('tlgiftAdmin.uploadCsvModalTitle')}
                open={uploadCsvModalOpen}
                onCancel={() => {
                    if (!uploadCsvLoading) {
                        setUploadCsvModalOpen(false);
                        setUploadCsvPending(null);
                    }
                }}
                onOk={async () => {
                    if (!uploadCsvPending) return;
                    setUploadCsvLoading(true);
                    try {
                        const res = await axiosInstance.post('/tlgift/items/upload-csv', {
                            csvContent: uploadCsvPending.content,
                        });
                        if (res.data?.EPF_code === 200) {
                            messageApi.success(
                                res.data?.EPF_description ?? gLang('tlgiftAdmin.uploadCsvSuccess')
                            );
                            setUploadCsvModalOpen(false);
                            setUploadCsvPending(null);
                            loadItems();
                        } else {
                            messageApi.error(
                                res.data?.EPF_description ?? gLang('tlgiftAdmin.uploadCsvFailed')
                            );
                        }
                    } catch (e: unknown) {
                        messageApi.error(
                            (e as { response?: { data?: { EPF_description?: string } } })?.response
                                ?.data?.EPF_description ?? gLang('tlgiftAdmin.requestFailed')
                        );
                    } finally {
                        setUploadCsvLoading(false);
                    }
                }}
                confirmLoading={uploadCsvLoading}
                okText={gLang('tlgiftAdmin.uploadCsvOk')}
            >
                <Typography.Paragraph>
                    {uploadCsvPending
                        ? gLang('tlgiftAdmin.uploadCsvConfirm', { name: uploadCsvPending.name })
                        : gLang('tlgiftAdmin.uploadCsvConfirm', { name: '' })}
                </Typography.Paragraph>
            </Modal>
        </Card>
    );

    const tabAlias = (
        <Card title={gLang('tlgiftAdmin.tabAliasTitle')}>
            <Typography.Paragraph type="secondary">
                {gLang('tlgiftAdmin.tabAliasIntro')}
            </Typography.Paragraph>
            <Form
                form={aliasForm}
                layout="inline"
                onFinish={onAddAlias}
                style={{ marginBottom: 16 }}
            >
                <Form.Item name="alias" rules={[{ required: true }]}>
                    <Input
                        placeholder={gLang('tlgiftAdmin.aliasPlaceholder')}
                        style={{ width: 160 }}
                    />
                </Form.Item>
                <Form.Item name="openid" rules={[{ required: true }]}>
                    <Input
                        placeholder={gLang('tlgiftAdmin.openidPlaceholder')}
                        style={{ width: 240 }}
                    />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={aliasLoading}>
                        {gLang('tlgiftAdmin.add')}
                    </Button>
                </Form.Item>
            </Form>
            <Table
                dataSource={aliases}
                rowKey="alias"
                size="small"
                columns={[
                    {
                        title: gLang('tlgiftAdmin.aliasPlaceholder'),
                        dataIndex: 'alias',
                        key: 'alias',
                    },
                    { title: 'openid', dataIndex: 'openid', key: 'openid' },
                    {
                        title: gLang('tlgiftAdmin.colAction'),
                        key: 'action',
                        width: 80,
                        render: (_: unknown, row: AliasItem) => (
                            <Popconfirm
                                title={gLang('tlgiftAdmin.deleteAliasConfirm')}
                                onConfirm={() => onDeleteAlias(row.alias)}
                            >
                                <Button type="link" danger size="small">
                                    {gLang('tlgiftAdmin.delete')}
                                </Button>
                            </Popconfirm>
                        ),
                    },
                ]}
                pagination={false}
            />
        </Card>
    );

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            {contextHolder}
            <Tabs
                items={[
                    { key: 'logs', label: gLang('tlgiftAdmin.tabLabelLogs'), children: tabLogs },
                    { key: 'admin', label: gLang('tlgiftAdmin.tabLabelAdmin'), children: tabAdmin },
                    { key: 'items', label: gLang('tlgiftAdmin.tabLabelItems'), children: tabItems },
                    { key: 'alias', label: gLang('tlgiftAdmin.tabLabelAlias'), children: tabAlias },
                ]}
            />
        </Space>
    );
};

export default TlgiftMall;

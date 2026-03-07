import {
    Form,
    Input,
    InputNumber,
    Modal,
    Radio,
    Upload,
    Button,
    Space,
    Switch,
    Typography,
    message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { gLang } from '@common/language';
import { UploadOutlined } from '@ant-design/icons';
import { fetchData } from '@common/axiosConfig';

export type ProductFormMode = 'add' | 'edit';

export type ProductFormValues = {
    title: string;
    price: number;
    detail: string;
    data: number;
    total_limit?: number | null;
    monthly_limit?: number | null;
    global_limit?: number | null;
    permanent_limit?: number | null;
    is_vip?: number;
    is_hidden?: number;
    // add 模式需要
    category?: string;
    idItem?: string;
};

type ProductFormModalProps = {
    readonly open: boolean;
    readonly onCancel: () => void;
    readonly onSubmit: (values: ProductFormValues) => void;
    readonly confirmLoading?: boolean;
    readonly initialValues?: Partial<ProductFormValues>;
    readonly mode: ProductFormMode;
    // 仅 edit 模式可选：启用图片上传能力
    readonly enableImageUpload?: boolean;
    readonly productIdForUpload?: number;
    readonly onDelete?: () => void;
    // 仅用于预览：编辑态下 category/idItem 固定不可改，从外部透传
    readonly previewCategory?: string;
    readonly previewIdItem?: string;
};

export default function ProductFormModal({
    open,
    onCancel,
    onSubmit,
    confirmLoading,
    initialValues,
    mode,
    enableImageUpload,
    productIdForUpload,
    onDelete,
    previewCategory,
    previewIdItem,
}: ProductFormModalProps) {
    const [form] = Form.useForm<ProductFormValues>();
    const [messageApi, messageContextHolder] = message.useMessage();
    const [overwrite, setOverwrite] = useState(false);

    const isAdd = mode === 'add';

    useEffect(() => {
        if (open) {
            form.resetFields();
            if (initialValues) {
                form.setFieldsValue(initialValues as ProductFormValues);
            }
        }
    }, [open, form, initialValues]);

    const handleOk = () => {
        form.submit();
    };

    const initialRadioValues = useMemo(
        () => ({
            is_vip: 0,
            is_hidden: 0,
        }),
        []
    );

    return (
        <Modal
            forceRender
            title={isAdd ? gLang('shopAdmin.modal.add.title') : gLang('shopAdmin.modal.edit.title')}
            open={open}
            onCancel={() => {
                onCancel();
                form.resetFields();
            }}
            onOk={handleOk}
            confirmLoading={!!confirmLoading}
            destroyOnHidden
            width={600}
            footer={
                [
                    !isAdd && onDelete ? (
                        <Button key="delete" danger onClick={onDelete}>
                            {gLang('common.delete')}
                        </Button>
                    ) : null,
                    <Button
                        key="cancel"
                        onClick={() => {
                            onCancel();
                            form.resetFields();
                        }}
                    >
                        {gLang('common.cancel')}
                    </Button>,
                    <Button key="ok" type="primary" onClick={handleOk} loading={!!confirmLoading}>
                        {gLang('common.confirm')}
                    </Button>,
                ].filter(Boolean) as any
            }
        >
            {messageContextHolder}

            <Form<ProductFormValues>
                form={form}
                layout="vertical"
                initialValues={{ ...initialRadioValues, ...(initialValues ?? {}) }}
                onFinish={onSubmit}
            >
                {!isAdd ? (
                    <Form.Item label={gLang('shopAdmin.label.productId')}>
                        <Input value={productIdForUpload} disabled />
                    </Form.Item>
                ) : null}

                <Form.Item
                    label={gLang('shopAdmin.label.productName')}
                    name="title"
                    rules={[
                        {
                            required: true,
                            message: gLang('shopAdmin.validation.required.productName'),
                        },
                    ]}
                >
                    <Input />
                </Form.Item>

                {isAdd && (
                    <>
                        <Form.Item
                            label={gLang('shopAdmin.label.productCategory')}
                            name="category"
                            rules={[
                                {
                                    required: true,
                                    message: gLang('shopAdmin.validation.required.productCategory'),
                                },
                            ]}
                        >
                            <Input placeholder={gLang('shopAdmin.placeholder.productCategory')} />
                        </Form.Item>
                        <Form.Item
                            label={gLang('shopAdmin.label.itemId')}
                            name="idItem"
                            rules={[
                                {
                                    required: true,
                                    message: gLang('shopAdmin.validation.required.itemId'),
                                },
                            ]}
                        >
                            <Input placeholder={gLang('shopAdmin.placeholder.itemId')} />
                        </Form.Item>
                    </>
                )}

                <Form.Item
                    label={gLang('shopAdmin.label.isVip')}
                    name="is_vip"
                    rules={[
                        { required: true, message: gLang('shopAdmin.validation.required.isVip') },
                    ]}
                >
                    <Radio.Group>
                        <Radio value={0}>{gLang('shopAdmin.option.normalProduct')}</Radio>
                        <Radio value={1}>{gLang('shopAdmin.option.vipProduct')}</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item label={gLang('shopAdmin.label.isHidden')} name="is_hidden">
                    <Radio.Group>
                        <Radio value={0}>{gLang('shopAdmin.option.visible')}</Radio>
                        <Radio value={1}>{gLang('shopAdmin.option.hidden')}</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    label={gLang('shopAdmin.label.price')}
                    name="price"
                    rules={[
                        { required: true, message: gLang('shopAdmin.validation.required.price') },
                        { type: 'number', min: 0 },
                        {
                            validator: (_, value) =>
                                Number.isInteger(value)
                                    ? Promise.resolve()
                                    : Promise.reject(gLang('shop.priceMustBeInteger')),
                        },
                    ]}
                >
                    <InputNumber
                        min={0}
                        step={1}
                        precision={0}
                        formatter={value => `${value}`}
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                <Form.Item
                    label={gLang('shopAdmin.label.validTime')}
                    name="data"
                    rules={[{ required: true, type: 'number', min: 1 }]}
                >
                    <InputNumber
                        min={1}
                        style={{ width: '100%' }}
                        placeholder={gLang('shopAdmin.placeholder.validTime')}
                    />
                </Form.Item>

                {/* 物品ID实时预览 */}
                {(() => {
                    const wCategory = Form.useWatch('category', form);
                    const wIdItem = Form.useWatch('idItem', form);
                    const wData = Form.useWatch('data', form);
                    const cat = (isAdd ? wCategory : (previewCategory ?? wCategory)) ?? '';
                    const idItem = (isAdd ? wIdItem : (previewIdItem ?? wIdItem)) ?? '';
                    const dataVal = typeof wData === 'number' ? wData : undefined;
                    const text = `${cat || ''}${cat || idItem ? '.' : ''}${idItem || ''}${(cat || idItem) && dataVal !== undefined ? ':' : ''}${dataVal ?? ''}`;
                    return (
                        <Form.Item label={gLang('shopAdmin.label.itemId')}>
                            <Typography.Text type="secondary" code style={{ userSelect: 'text' }}>
                                {text || '-'}
                            </Typography.Text>
                        </Form.Item>
                    );
                })()}

                <Form.Item label={gLang('shopAdmin.label.totalLimit')} name="total_limit">
                    <InputNumber
                        min={0}
                        precision={0}
                        style={{ width: '100%' }}
                        placeholder={gLang('shopAdmin.placeholder.totalLimit')}
                    />
                </Form.Item>

                <Form.Item label={gLang('shopAdmin.label.monthlyLimit')} name="monthly_limit">
                    <InputNumber
                        min={0}
                        precision={0}
                        style={{ width: '100%' }}
                        placeholder={gLang('shopAdmin.placeholder.monthlyLimit')}
                    />
                </Form.Item>

                <Form.Item label={gLang('shopAdmin.label.globalLimit')} name="global_limit">
                    <InputNumber
                        min={0}
                        precision={0}
                        style={{ width: '100%' }}
                        placeholder={gLang('shopAdmin.placeholder.globalLimit')}
                    />
                </Form.Item>

                <Form.Item label={gLang('shopAdmin.label.permanentLimit')} name="permanent_limit">
                    <InputNumber
                        min={0}
                        precision={0}
                        style={{ width: '100%' }}
                        placeholder={gLang('shopAdmin.placeholder.permanentLimit')}
                    />
                </Form.Item>

                <Form.Item
                    label={gLang('shopAdmin.label.productDescription')}
                    name="detail"
                    rules={[
                        {
                            required: true,
                            message: gLang('shopAdmin.validation.required.productDescription'),
                        },
                    ]}
                >
                    <Input.TextArea rows={3} />
                </Form.Item>

                {import.meta.env.DEV && !isAdd && enableImageUpload && (
                    <Space
                        direction="horizontal"
                        size="middle"
                        style={{ width: '100%', display: 'flex', alignItems: 'center' }}
                    >
                        <Typography.Text strong>
                            {gLang('shopAdmin.tools.upload.title')}
                        </Typography.Text>
                        <Space>
                            <Typography.Text>
                                {gLang('shopAdmin.tools.upload.overwrite')}
                            </Typography.Text>
                            <Switch checked={overwrite} onChange={setOverwrite} />
                        </Space>
                        <Upload
                            accept="image/*"
                            maxCount={1}
                            showUploadList={false}
                            beforeUpload={async file => {
                                try {
                                    if (!productIdForUpload) return Upload.LIST_IGNORE;
                                    const fileBase64 = await new Promise<string>(
                                        (resolve, reject) => {
                                            const reader = new FileReader();
                                            reader.onload = () => resolve(String(reader.result));
                                            reader.onerror = reject;
                                            reader.readAsDataURL(file);
                                        }
                                    );
                                    await fetchData({
                                        url: '/utils/image/upload-local',
                                        method: 'POST',
                                        data: {
                                            itemId: Number(productIdForUpload),
                                            fileBase64,
                                            overwrite,
                                        },
                                        setData: () => {
                                            messageApi.success(
                                                gLang('shopAdmin.tools.upload.success')
                                            );
                                        },
                                    });
                                } catch {
                                    messageApi.error(gLang('shopAdmin.tools.upload.failed'));
                                }
                                return Upload.LIST_IGNORE;
                            }}
                        >
                            <Button icon={<UploadOutlined />}>
                                {gLang('shopAdmin.tools.upload.button')}
                            </Button>
                        </Upload>
                    </Space>
                )}
            </Form>
        </Modal>
    );
}

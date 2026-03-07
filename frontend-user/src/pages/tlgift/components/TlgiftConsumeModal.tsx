import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    Grid,
    Typography,
    Form,
    Input,
    InputNumber,
    Divider,
    Button,
    message,
    Row,
    Col,
    Space,
    Card,
    Tag,
} from 'antd';
import {
    ShoppingCartOutlined,
    MinusOutlined,
    PlusOutlined,
    GlobalOutlined,
    UserOutlined,
} from '@ant-design/icons';
import axiosInstance from '@common/axiosConfig';
import { gLang } from '@common/language';
import type { TlgiftItem } from './TlgiftProductCard';

const { useBreakpoint } = Grid;
const { Text, Title, Paragraph } = Typography;

interface TlgiftConsumeModalProps {
    product: TlgiftItem | null;
    balance: number;
    defaultImage: string;
    onClose: () => void;
    onSuccess?: () => void;
    /** Add current product + quantity to cart (no balance check). */
    onAddToCart?: (itemId: string, quantity: number) => void;
}

export default function TlgiftConsumeModal({
    product,
    balance,
    defaultImage,
    onClose,
    onSuccess,
    onAddToCart,
}: TlgiftConsumeModalProps) {
    const screens = useBreakpoint();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [messageApi, messageContextHolder] = message.useMessage();
    const quantity = Form.useWatch('quantity', form) ?? 1;
    const ecid = Form.useWatch('ecid', form) ?? '';
    const [personRemaining, setPersonRemaining] = useState<number | null>(null);
    const [personLoading, setPersonLoading] = useState(false);
    const personFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const totalCost = product ? product.price * (Number(quantity) || 1) : 0;
    const insufficientBalance = balance < totalCost;
    const totalSoldOut = product && product.total_remaining != null && product.total_remaining <= 0;
    const userSoldOut = product && product.user_remaining != null && product.user_remaining <= 0;
    const personSoldOut =
        product && product.person_limit > 0 && personRemaining !== null && personRemaining <= 0;
    const limitDisabled = totalSoldOut || userSoldOut || personSoldOut;
    const submitDisabled = insufficientBalance || loading || limitDisabled;
    const maxQty = product
        ? Math.min(
              ...[
                  product.total_remaining != null ? product.total_remaining : Infinity,
                  product.user_remaining != null ? product.user_remaining : Infinity,
                  product.person_limit > 0 && personRemaining != null ? personRemaining : Infinity,
              ].filter(Number.isFinite)
          )
        : Infinity;
    const effectiveMaxQty = Number.isFinite(maxQty) && maxQty > 0 ? maxQty : 0;

    useEffect(() => {
        if (product) {
            form.setFieldsValue({ quantity: 1, ecid: '' });
            setPersonRemaining(null);
        }
    }, [product, form]);

    useEffect(() => {
        if (!product || product.person_limit <= 0) {
            setPersonRemaining(null);
            return;
        }
        const ecidStr = String(ecid ?? '').trim();
        if (!ecidStr) {
            setPersonRemaining(null);
            return;
        }
        if (personFetchRef.current) clearTimeout(personFetchRef.current);
        personFetchRef.current = setTimeout(() => {
            setPersonLoading(true);
            axiosInstance
                .get(`/tlgift/items/${product.id}/person-remaining`, { params: { ecid: ecidStr } })
                .then(res => {
                    if (res.data?.EPF_code === 200 && res.data?.data != null) {
                        setPersonRemaining(Number(res.data.data));
                    } else {
                        setPersonRemaining(null);
                    }
                })
                .catch(() => setPersonRemaining(null))
                .finally(() => {
                    setPersonLoading(false);
                });
        }, 300);
        return () => {
            if (personFetchRef.current) clearTimeout(personFetchRef.current);
        };
    }, [product?.id, product?.person_limit, ecid]);

    const handleSubmit = async (values: { ecid: string; quantity: number }) => {
        if (!product) return;
        setLoading(true);
        try {
            const res = await axiosInstance.post('/tlgift/consume', {
                itemId: product.id,
                quantity: values.quantity,
                ecid: String(values.ecid || '').trim(),
            });
            if (res.data?.EPF_code === 200) {
                messageApi.success(gLang('tlgift.consumeSuccess'));
                onClose();
                onSuccess?.();
            } else {
                messageApi.error(res.data?.EPF_description || gLang('tlgift.consumeFailed'));
            }
        } catch (e: any) {
            messageApi.error(e.response?.data?.EPF_description || gLang('tlgift.requestFailed'));
        } finally {
            setLoading(false);
        }
    };

    const setQuantity = (v: number) => {
        const n = Math.max(1, Math.min(v, effectiveMaxQty || 999));
        form.setFieldsValue({ quantity: n });
    };

    return (
        <>
            {messageContextHolder}
            <Modal
                title={gLang('tlgift.consumeTitle')}
                open={!!product}
                onCancel={onClose}
                footer={null}
                width={screens.md ? 520 : '90%'}
                destroyOnClose
                style={{ top: 20 }}
            >
                {product && (
                    <Form
                        form={form}
                        onFinish={handleSubmit}
                        initialValues={{ quantity: 1, ecid: '' }}
                    >
                        <Space direction="vertical" size={20} style={{ width: '100%' }}>
                            <Row gutter={16} align="middle">
                                <Col span={24} style={{ textAlign: 'center' }}>
                                    <img
                                        src={defaultImage}
                                        alt={product.title}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: screens.md ? 200 : 160,
                                            height: 'auto',
                                            borderRadius: 8,
                                            objectFit: 'contain',
                                        }}
                                    />
                                </Col>
                            </Row>
                            <Title level={5} style={{ margin: 0 }}>
                                {product.title}
                            </Title>
                            <Paragraph type="secondary" style={{ margin: 0 }}>
                                {product.price} {gLang('tlgift.primogemsPerItem')}
                            </Paragraph>

                            <Divider style={{ margin: '8px 0' }}>
                                {gLang('tlgift.limitInfo')}
                            </Divider>
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                {product.total_limit > 0 && (
                                    <Row
                                        align="middle"
                                        gutter={8}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: 'var(--ant-color-fill-quaternary)',
                                            borderRadius: 8,
                                            border: '1px solid var(--ant-color-border)',
                                        }}
                                    >
                                        <Col>
                                            <GlobalOutlined
                                                style={{
                                                    color: totalSoldOut ? '#ff4d4f' : '#52c41a',
                                                }}
                                            />
                                        </Col>
                                        <Col flex="auto">
                                            <Text strong>{gLang('tlgift.totalLimit')}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {gLang('tlgift.totalRemaining', {
                                                    remaining: String(
                                                        product.total_remaining ??
                                                            product.total_limit - product.sales
                                                    ),
                                                    total: String(product.total_limit),
                                                })}
                                            </Text>
                                        </Col>
                                        <Col>
                                            {totalSoldOut ? (
                                                <Tag color="error">{gLang('tlgift.soldOut')}</Tag>
                                            ) : (
                                                <Tag color="success">
                                                    {gLang('tlgift.remainingShort', {
                                                        remaining: String(
                                                            product.total_remaining ?? 0
                                                        ),
                                                    })}
                                                </Tag>
                                            )}
                                        </Col>
                                    </Row>
                                )}
                                {product.user_limit > 0 && (
                                    <Row
                                        align="middle"
                                        gutter={8}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: 'var(--ant-color-fill-quaternary)',
                                            borderRadius: 8,
                                            border: '1px solid var(--ant-color-border)',
                                        }}
                                    >
                                        <Col>
                                            <UserOutlined
                                                style={{
                                                    color: userSoldOut ? '#ff4d4f' : '#1890ff',
                                                }}
                                            />
                                        </Col>
                                        <Col flex="auto">
                                            <Text strong>{gLang('tlgift.userLimit')}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {gLang('tlgift.userRemaining', {
                                                    remaining: String(
                                                        product.user_remaining ?? product.user_limit
                                                    ),
                                                    total: String(product.user_limit),
                                                })}
                                            </Text>
                                        </Col>
                                        <Col>
                                            {userSoldOut ? (
                                                <Tag color="error">{gLang('tlgift.usedUp')}</Tag>
                                            ) : (
                                                <Tag color="processing">
                                                    {gLang('tlgift.remainingShort', {
                                                        remaining: String(
                                                            product.user_remaining ?? 0
                                                        ),
                                                    })}
                                                </Tag>
                                            )}
                                        </Col>
                                    </Row>
                                )}
                                {product.person_limit > 0 && (
                                    <Row
                                        align="middle"
                                        gutter={8}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: 'var(--ant-color-fill-quaternary)',
                                            borderRadius: 8,
                                            border: '1px solid var(--ant-color-border)',
                                        }}
                                    >
                                        <Col>
                                            <UserOutlined
                                                style={{
                                                    color: personSoldOut ? '#ff4d4f' : '#fa8c16',
                                                }}
                                            />
                                        </Col>
                                        <Col flex="auto">
                                            <Text strong>{gLang('tlgift.personLimit')}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {ecid?.trim()
                                                    ? personLoading
                                                        ? gLang('tlgift.querying')
                                                        : personRemaining !== null
                                                          ? gLang('tlgift.personRemaining', {
                                                                remaining: String(personRemaining),
                                                                total: String(product.person_limit),
                                                            })
                                                          : gLang('tlgift.personRemainingQuery')
                                                    : gLang('tlgift.personEcidRequired')}
                                            </Text>
                                        </Col>
                                        <Col>
                                            {personLoading ? (
                                                <Tag>{gLang('tlgift.querying')}</Tag>
                                            ) : personRemaining !== null ? (
                                                personSoldOut ? (
                                                    <Tag color="error">
                                                        {gLang('tlgift.usedUp')}
                                                    </Tag>
                                                ) : (
                                                    <Tag color="warning">
                                                        {gLang('tlgift.remainingShort', {
                                                            remaining: String(personRemaining),
                                                        })}
                                                    </Tag>
                                                )
                                            ) : null}
                                        </Col>
                                    </Row>
                                )}
                            </Space>

                            <Divider style={{ margin: '8px 0' }}>
                                {gLang('tlgift.fillInfo')}
                            </Divider>

                            <Form.Item
                                name="ecid"
                                label={gLang('tlgift.ecidLabel')}
                                rules={[{ required: true, message: gLang('tlgift.ecidRequired') }]}
                            >
                                <Input placeholder={gLang('tlgift.ecidPlaceholder')} size="large" />
                            </Form.Item>

                            <Card
                                size="small"
                                style={{
                                    backgroundColor: 'var(--ant-color-fill-quaternary)',
                                    border: '1px solid var(--ant-color-border)',
                                }}
                            >
                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <Text strong>{gLang('tlgift.quantity')}</Text>
                                    <Form.Item
                                        name="quantity"
                                        rules={[{ required: true }, { type: 'number', min: 1 }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <InputNumber
                                            min={1}
                                            max={effectiveMaxQty || undefined}
                                            disabled={!!limitDisabled}
                                            style={{ width: '100%', height: 40, borderRadius: 6 }}
                                            addonBefore={
                                                <Button
                                                    type="text"
                                                    icon={<MinusOutlined />}
                                                    onClick={() =>
                                                        setQuantity(
                                                            Math.max(1, (Number(quantity) || 1) - 1)
                                                        )
                                                    }
                                                    disabled={
                                                        !!(
                                                            (Number(quantity) || 1) <= 1 ||
                                                            limitDisabled
                                                        )
                                                    }
                                                />
                                            }
                                            addonAfter={
                                                <Button
                                                    type="text"
                                                    icon={<PlusOutlined />}
                                                    onClick={() =>
                                                        setQuantity((Number(quantity) || 1) + 1)
                                                    }
                                                    disabled={
                                                        !!(
                                                            limitDisabled ||
                                                            (effectiveMaxQty > 0 &&
                                                                (Number(quantity) || 1) >=
                                                                    effectiveMaxQty)
                                                        )
                                                    }
                                                />
                                            }
                                        />
                                    </Form.Item>
                                </Space>
                            </Card>

                            <Divider style={{ margin: '8px 0' }}>
                                {gLang('tlgift.paymentInfo')}
                            </Divider>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Text type="secondary">{gLang('tlgift.balance')}</Text>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <Text strong>{balance}</Text>
                                </Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Text type="secondary">{gLang('tlgift.costThis')}</Text>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <Text type="danger" strong>
                                        {totalCost} {gLang('tlgift.primogemsUnit')}
                                    </Text>
                                </Col>
                            </Row>

                            <Form.Item style={{ marginBottom: 0 }}>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        size="large"
                                        loading={loading}
                                        disabled={!!submitDisabled}
                                        icon={<ShoppingCartOutlined />}
                                        style={{
                                            width: '100%',
                                            height: 48,
                                            borderRadius: 8,
                                            opacity: submitDisabled ? 0.7 : 1,
                                        }}
                                    >
                                        {totalSoldOut
                                            ? gLang('tlgift.totalSoldOut')
                                            : userSoldOut
                                              ? gLang('tlgift.userSoldOut')
                                              : personSoldOut
                                                ? gLang('tlgift.personSoldOut')
                                                : insufficientBalance
                                                  ? gLang('tlgift.insufficientBalance')
                                                  : loading
                                                    ? gLang('tlgift.submitting')
                                                    : gLang('tlgift.confirmConsume')}
                                    </Button>
                                    {onAddToCart && (
                                        <Button
                                            size="large"
                                            style={{ width: '100%', height: 40, borderRadius: 8 }}
                                            onClick={() => {
                                                if (product) {
                                                    const q = Number(quantity) || 1;
                                                    onAddToCart(product.id, q);
                                                    messageApi.success(gLang('tlgift.addedToCart'));
                                                }
                                            }}
                                        >
                                            {gLang('tlgift.addToCartWithQty')}
                                        </Button>
                                    )}
                                </Space>
                            </Form.Item>
                        </Space>
                    </Form>
                )}
            </Modal>
        </>
    );
}

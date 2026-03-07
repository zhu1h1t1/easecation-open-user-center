import {
    Modal,
    Grid,
    Typography,
    Form,
    InputNumber,
    Divider,
    Button,
    message,
    Row,
    Col,
    Space,
    Card,
} from 'antd';
import React, { useState, useEffect } from 'react';
import { fetchData } from '@common/axiosConfig';
import defaultImage from '../default-product.png';
import type { Rule } from 'antd/es/form';
import type { Product } from '@ecuc/shared/types/item.types';
import { gLang } from '@common/language';
import { MediaUser, MediaStatus } from '@ecuc/shared/types/media.types';
import PurchaseLimitInfo from './PurchaseLimitInfo';
import { parseProductJSON } from '../shopUtils';
import { MinusOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';

const { useBreakpoint } = Grid;
const { Paragraph, Text, Title } = Typography;

// 数量控制按钮样式
const quantityControlStyles = `
    .quantity-control-btn {
        background-color: var(--ant-color-fill-quaternary) !important;
        border-color: var(--ant-color-border) !important;
        color: var(--ant-color-text) !important;
    }
    
    .quantity-control-btn:hover:not(:disabled) {
        background-color: var(--ant-color-fill-secondary) !important;
        border-color: var(--ant-color-primary) !important;
        color: var(--ant-color-primary) !important;
        transform: scale(1.05);
    }
    
    .quantity-control-btn:active:not(:disabled) {
        transform: scale(0.95);
    }
    
    .quantity-control-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

// 注入样式
if (typeof document !== 'undefined') {
    const styleId = 'quantity-control-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = quantityControlStyles;
        document.head.appendChild(style);
    }
}

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallback?: string;
}

const SafeImage = ({ src, alt, fallback = defaultImage, ...props }: SafeImageProps) => {
    const [imgSrc, setImgSrc] = useState<string | undefined>(src);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.target as HTMLImageElement;
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setImgLoaded(true);
    };

    // 如果图片尺寸过小（小于100x100），则不显示
    const shouldShowImage = imgDimensions.width >= 100 && imgDimensions.height >= 100;

    return imgLoaded && shouldShowImage ? (
        <img
            {...props}
            src={imgSrc || fallback}
            alt={alt}
            onError={() => {
                setImgSrc(fallback);
            }}
            onLoad={handleImageLoad}
        />
    ) : (
        <img
            {...props}
            src={imgSrc || fallback}
            alt={alt}
            onError={() => {
                setImgSrc(fallback);
            }}
            onLoad={handleImageLoad}
            style={{ display: imgLoaded && !shouldShowImage ? 'none' : 'block', ...props.style }}
        />
    );
};

interface ProductModalProps {
    media: MediaUser | null;
    product: Product | null;
    onClose: () => void;
    defaultImage: string;
    balance: number;
    onSuccess?: () => void;
}

export default function ProductModal({
    media,
    product,
    onClose,
    balance,
    onSuccess,
}: ProductModalProps) {
    const screens = useBreakpoint();
    const [form] = Form.useForm();
    const [totalAmount, setTotalAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [messageApi, messageContextHolder] = message.useMessage();
    const [mergedProduct, setMergedProduct] = useState<Product | null>(product);

    const effectiveProduct = mergedProduct ?? product;

    // 权限检查：只有权限为2或3的用户才能购买
    const hasPurchasePermission =
        media?.status === MediaStatus.ActiveCreator ||
        media?.status === MediaStatus.ExcellentCreator ||
        (media?.status === MediaStatus.PendingReview && media?.EBalance !== 0);
    const permissionDisabled = !hasPurchasePermission;

    const getPurchaseLimits = () => {
        if (!effectiveProduct) return { maxQuantity: 0, remainingText: '' };

        // 全局限购（总个人限购 global_limit）
        const remainingGlobal =
            effectiveProduct.global_limit && effectiveProduct.global_limit > 0
                ? effectiveProduct.global_limit - effectiveProduct.limit_sales
                : Infinity;

        // 每月总限购（total_limit）
        const remainingTotal =
            effectiveProduct.total_limit && effectiveProduct.total_limit > 0
                ? effectiveProduct.total_limit - effectiveProduct.sales_monthly
                : Infinity;

        // 每月个人限购（monthly_limit）
        const remainingMonthly =
            effectiveProduct.monthly_limit && effectiveProduct.monthly_limit > 0
                ? effectiveProduct.monthly_limit - effectiveProduct.current_month_sales
                : Infinity;

        // 永久总限购（permanent_limit）
        const remainingPermanent =
            effectiveProduct.permanent_limit && effectiveProduct.permanent_limit > 0
                ? effectiveProduct.permanent_limit - effectiveProduct.sales
                : Infinity;
        // 取四者最小值
        const maxQuantity = Math.min(
            remainingGlobal,
            remainingTotal,
            remainingMonthly,
            remainingPermanent
        );

        const limits = [];
        if (effectiveProduct.global_limit && effectiveProduct.global_limit > 0) {
            limits.push(`${gLang('shop.globalRemaining')}: ${remainingGlobal}`);
        }
        if (effectiveProduct.total_limit && effectiveProduct.total_limit > 0) {
            limits.push(`${gLang('shop.totalRemaining')}: ${remainingTotal}`);
        }
        if (effectiveProduct.monthly_limit && effectiveProduct.monthly_limit > 0) {
            limits.push(`${gLang('shop.monthlyRemaining')}: ${remainingMonthly}`);
        }
        if (effectiveProduct.permanent_limit && effectiveProduct.permanent_limit > 0) {
            limits.push(`${gLang('shop.permanentRemaining')}: ${remainingPermanent}`);
        }

        return {
            maxQuantity: maxQuantity > 0 ? maxQuantity : 0,
            remainingText: limits.length > 0 ? limits.join(' | ') : '',
            hasLimits: limits.length > 0,
        };
    };

    const { maxQuantity } = getPurchaseLimits();
    const isUnlimited = !Number.isFinite(maxQuantity);
    const isSoldOut = maxQuantity <= 0;
    const insufficientBalance = Number(balance ?? 0) < (totalAmount || 0);

    // 数量变化处理
    const handleQuantityChange = (value: number | null) => {
        if (!value || value < 1) return;
        const clampedValue = Math.min(value, maxQuantity);
        form.setFieldsValue({ quantity: clampedValue });
        const price = Number(effectiveProduct?.price) || 0;
        setTotalAmount(clampedValue * price);
    };

    // 验证规则
    const quantityRules: Rule[] = [
        { required: true, message: gLang('shop.pleaseSelectPurchaseQuantity') },
        { type: 'number', min: 1, message: gLang('shop.quantityCannotBeLessThan1') },
        {
            validator: (_rule, value) => {
                if (!isUnlimited && value > maxQuantity) {
                    return Promise.reject(
                        isSoldOut
                            ? gLang('shop.itemSoldOut')
                            : `${gLang('shop.maxPurchaseQuantity')}: ${maxQuantity}`
                    );
                }
                return Promise.resolve();
            },
        },
    ];

    useEffect(() => {
        if (product) {
            const price = Number((effectiveProduct ?? product).price) || 0;
            setTotalAmount(price);
            // 售罄时不显示数量
            form.setFieldsValue({
                quantity: isSoldOut ? undefined : 1,
            });
        }
    }, [product, effectiveProduct, form, isSoldOut]);

    // 弹窗打开后，拉取包含个人限购合并后的商品数据（按ID查询）
    useEffect(() => {
        setMergedProduct(product);
        if (!product) return;
        const resolvedItemId = Number((product as any)?.id ?? (product as any)?.ID);
        if (!Number.isFinite(resolvedItemId) || resolvedItemId <= 0) return;
        fetchData({
            url: `/item/searchById?id=${resolvedItemId}`,
            method: 'GET',
            data: {},
            setData: values => {
                const item = (values?.data ?? null) as Product | null;
                if (item) setMergedProduct(item);
            },
        });
    }, [product]);

    const handlePurchase = async (values: { quantity: number }) => {
        if (values.quantity > maxQuantity) {
            messageApi.error(gLang('shop.purchaseQuantityExceedsAvailableStock'));
            return;
        }

        setLoading(true);
        try {
            const resolvedItemId = Number((product as any)?.id ?? (product as any)?.ID);
            if (!Number.isFinite(resolvedItemId) || resolvedItemId <= 0) {
                messageApi.error(gLang('shop.networkRequestException'));
                setLoading(false);
                return;
            }
            await fetchData({
                url: `/item/purchase`,
                method: 'POST',
                data: {
                    itemId: resolvedItemId,
                    quantity: values.quantity,
                },
                setData: value => {
                    if (value) {
                        messageApi.success(gLang('shop.purchaseSuccess'));
                    }
                    onClose();
                    if (onSuccess) onSuccess();
                },
            });
        } catch {
            messageApi.error(gLang('shop.networkRequestException'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {messageContextHolder}
            <Modal
                title={gLang('shop.confirmPurchase')}
                open={!!product}
                onCancel={onClose}
                footer={null}
                width={screens.md ? 800 : '90%'}
                destroyOnHidden={true}
                style={{ top: 20 }}
            >
                {effectiveProduct && (
                    <Form
                        form={form}
                        onFinish={handlePurchase}
                        initialValues={{ quantity: 1 }}
                        onValuesChange={({ quantity }) => {
                            if (quantity !== undefined) {
                                const price = Number(effectiveProduct?.price) || 0;
                                setTotalAmount((quantity || 1) * price);
                            }
                        }}
                    >
                        <Space direction="vertical" size={24} style={{ width: '100%' }}>
                            {/* 只在图片尺寸足够大时显示 */}
                            <Row style={{ marginBottom: 16 }}>
                                <Col span={24} style={{ textAlign: 'center' }}>
                                    <SafeImage
                                        src={(function () {
                                            const p = effectiveProduct as any;
                                            try {
                                                const { category, itemId } = parseProductJSON(p);
                                                return `/merchandise/${category}.${itemId}.png`;
                                            } catch {
                                                return defaultImage;
                                            }
                                        })()}
                                        alt={effectiveProduct.title}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: screens.md ? 360 : 240,
                                            height: 'auto',
                                            borderRadius: 6,
                                            objectFit: 'contain',
                                        }}
                                    />
                                </Col>
                            </Row>
                            <Row>
                                <Col span={24}>
                                    <Title level={1}>{effectiveProduct.title}</Title>
                                    <Paragraph
                                        ellipsis={{ rows: 4, expandable: true }}
                                        style={{ color: '#666' }}
                                    >
                                        {effectiveProduct.detail}
                                    </Paragraph>
                                </Col>
                            </Row>

                            <Divider style={{ margin: '0 0 8px' }}>
                                {gLang('shop.orderInformation')}
                            </Divider>

                            {/* 使用解耦后的限购信息组件 */}
                            <PurchaseLimitInfo product={effectiveProduct} />

                            {/* 优化的数量选择区域 */}
                            <Card
                                size="small"
                                style={{
                                    backgroundColor: 'var(--ant-color-fill-quaternary)',
                                    border: '1px solid var(--ant-color-border)',
                                }}
                            >
                                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                    {/* 数量选择标题 */}
                                    <Row>
                                        <Col span={24}>
                                            <Text strong style={{ fontSize: 16 }}>
                                                {gLang('shop.purchaseQuantity')}
                                            </Text>
                                        </Col>
                                    </Row>

                                    {/* 数量输入器 */}
                                    <Row>
                                        <Col span={24}>
                                            <Form.Item
                                                name="quantity"
                                                rules={quantityRules}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <InputNumber
                                                    min={1}
                                                    max={isUnlimited ? undefined : maxQuantity}
                                                    disabled={isSoldOut || permissionDisabled}
                                                    style={{
                                                        width: '100%',
                                                        height: 40,
                                                        borderRadius: 6,
                                                    }}
                                                    step={1}
                                                    precision={0}
                                                    onChange={handleQuantityChange}
                                                    placeholder={
                                                        isSoldOut
                                                            ? gLang('shop.soldOut')
                                                            : undefined
                                                    }
                                                    controls={false}
                                                    addonBefore={
                                                        <Button
                                                            type="text"
                                                            icon={<MinusOutlined />}
                                                            onClick={() => {
                                                                const current =
                                                                    form.getFieldValue(
                                                                        'quantity'
                                                                    ) || 1;
                                                                if (current > 1) {
                                                                    handleQuantityChange(
                                                                        current - 1
                                                                    );
                                                                }
                                                            }}
                                                            disabled={
                                                                isSoldOut || permissionDisabled
                                                            }
                                                            style={{
                                                                border: 'none',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px 0 0 6px',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                            className="quantity-control-btn"
                                                        />
                                                    }
                                                    addonAfter={
                                                        <Button
                                                            type="text"
                                                            icon={<PlusOutlined />}
                                                            onClick={() => {
                                                                const current =
                                                                    form.getFieldValue(
                                                                        'quantity'
                                                                    ) || 1;
                                                                if (
                                                                    isUnlimited ||
                                                                    current < maxQuantity
                                                                ) {
                                                                    handleQuantityChange(
                                                                        current + 1
                                                                    );
                                                                }
                                                            }}
                                                            disabled={
                                                                isSoldOut || permissionDisabled
                                                            }
                                                            style={{
                                                                border: 'none',
                                                                padding: '4px 8px',
                                                                borderRadius: '0 6px 6px 0',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                            className="quantity-control-btn"
                                                        />
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* 数量范围提示 */}
                                    {!isSoldOut && !isUnlimited && (
                                        <Row style={{ marginTop: 0 }}>
                                            <Col span={24}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {gLang('shop.maxPurchaseQuantity')}:{' '}
                                                    {maxQuantity}
                                                </Text>
                                            </Col>
                                        </Row>
                                    )}
                                </Space>
                            </Card>

                            <Divider style={{ margin: '0 0 8px' }}>
                                {gLang('shop.paymentInformation')}
                            </Divider>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Text strong>{gLang('shop.remainingLovePoints')}</Text>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <Text style={{ color: '#10b981', fontWeight: 500 }}>
                                        {Number(balance ?? 0).toFixed(2)}
                                    </Text>
                                </Col>
                            </Row>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Text strong>{gLang('shop.itemPrice')}</Text>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <Text>{(Number(effectiveProduct.price) || 0).toFixed(2)}</Text>
                                </Col>
                            </Row>

                            <Divider dashed style={{ margin: '12px 0' }} />

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Text strong type="danger" style={{ fontSize: 16 }}>
                                        {gLang('shop.totalLoveCost')}
                                    </Text>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <Text strong type="danger" style={{ fontSize: 16 }}>
                                        {totalAmount.toFixed(2)}
                                    </Text>
                                </Col>
                            </Row>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={loading}
                                    disabled={
                                        isSoldOut ||
                                        loading ||
                                        permissionDisabled ||
                                        insufficientBalance
                                    }
                                    icon={<ShoppingCartOutlined />}
                                    style={{
                                        width: '100%',
                                        height: 48,
                                        opacity:
                                            permissionDisabled || insufficientBalance ? 0.6 : 1,
                                        borderRadius: 8,
                                    }}
                                >
                                    {isSoldOut
                                        ? gLang('shop.soldOut')
                                        : permissionDisabled
                                          ? gLang('shop.insufficientPermissionButton')
                                          : insufficientBalance
                                            ? gLang('shop.insufficientBalanceButton')
                                            : loading
                                              ? gLang('shop.submitting')
                                              : gLang('shop.immediatelyPurchase')}
                                </Button>
                            </Form.Item>
                        </Space>
                    </Form>
                )}
            </Modal>
        </>
    );
}

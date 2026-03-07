import { useEffect, useState, useMemo } from 'react';
import { Alert, Button, Grid, message, Modal, Space, Tag, Typography, Empty, Result } from 'antd';
import ProductModal from './components/ProductModal';
import PurchaseLogsModal from './components/PurchaseLogsModal';
import { CATEGORY_NAME_MAP } from '@ecuc/shared/constants/shop.constants';
import type { Product } from '@ecuc/shared/types/item.types';
import { fetchData } from '@common/axiosConfig';
// search handled inside ProductToolbar
import { MediaUser, MediaStatus } from '@ecuc/shared/types/media.types';
import { gLang } from '@common/language';
import { parseProductJSON, getUniqueCategories } from './shopUtils';
import ProductCard from './components/ProductCard';
import ProductGrid from './components/ProductGrid';
import ProductToolbar from './components/ProductToolbar';
import PageTitle from '@common/components/PageTitle/PageTitle';
import BalanceInfoCard from './components/BalanceInfoCard';
import defaultImage from './default-product.png';
import usePageTitle from '@common/hooks/usePageTitle';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

// removed icon imports; toolbar handles icons internally
import { MEDIA_SHOP_MAINTENANCE } from '@ecuc/shared/constants/shop.constants';
import { useAuth } from '@common/contexts/AuthContext';

const { useBreakpoint } = Grid;
const { Paragraph, Title } = Typography;

// 预设颜色数组用于分类标签
const CATEGORY_COLORS = [
    'magenta',
    'red',
    'volcano',
    'orange',
    'gold',
    'lime',
    'green',
    'cyan',
    'blue',
    'geekblue',
    'purple',
];

export default function Shop() {
    usePageTitle(); // 使用页面标题管理Hook

    const [messageApi, contextHolder] = message.useMessage();
    const screens = useBreakpoint();
    const [userInfo, setUserInfo] = useState<MediaUser | null>(null);
    const [rulesVisible, setRulesVisible] = useState(false);
    const [purchaseVisible, setPurchaseVisible] = useState(false);
    const [sortKey, setSortKey] = useState<
        'default' | 'priceAsc' | 'priceDesc' | 'salesAsc' | 'salesDesc' | 'timeAsc'
    >('default');
    const [searchValue, setSearchValue] = useState('');
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [productsLoading, setProductsLoading] = useState(true);

    // 购买记录里显示商品名所需映射（兼容后端返回 id/ID、字符串数字等差异）
    const idToTitle = useMemo(() => {
        const map = new Map<number, string>();
        for (const product of allProducts) {
            const rawId = (product as any).id ?? (product as any).ID;
            const pid = typeof rawId === 'string' ? Number(rawId) : rawId;
            if (typeof pid === 'number' && Number.isFinite(pid)) {
                map.set(pid, product.title);
            }
        }
        return map;
    }, [allProducts]);

    const { getThemeColor, customTheme, isCustomThemeActive } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;
    const isBlackOrangeActive = isCustomThemeActive && customTheme === 'blackOrange';
    const productSurface = getThemeColor({
        light: '#ffffff',
        dark: '#1f1f1f',
        custom: { blackOrange: palette.surfaceAlt },
    });
    const productBorder = getThemeColor({
        light: '#f0f0f0',
        dark: '#303030',
        custom: { blackOrange: palette.border },
    });
    const emptyColor = getThemeColor({
        light: 'rgba(0, 0, 0, 0.45)',
        dark: 'rgba(255, 255, 255, 0.55)',
        custom: { blackOrange: palette.textSecondary },
    });
    const { user } = useAuth();
    const isAdminUser = !!user?.permission?.some(
        p => p === 'authorize.super' || p === 'authorize.normal'
    );

    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        setProductsLoading(true);
        setShouldAnimate(false);
        Promise.all([
            fetchData({
                url: `/media/info`,
                method: 'GET',
                setData: values => {
                    setUserInfo(values.result);
                },
                data: {},
            }),
            fetchData({
                url: `/item/search`,
                method: 'GET',
                setData: values => {
                    setAllProducts(values.data);
                },
                data: {},
            }),
        ])
            .catch(() => {
                messageApi.error(gLang('shop.fetchFail'));
            })
            .finally(() => {
                setProductsLoading(false);
                // Trigger animation after loading completes
                setTimeout(() => setShouldAnimate(true), 50);
            });
    }, [messageApi]);

    const handleInfo = () => {
        fetchData({
            url: `/media/info`,
            method: 'GET',
            setData: values => {
                setUserInfo(values.result);
            },
            data: {},
        });
    };

    const handleSearch = () => {
        setProductsLoading(true);
        fetchData({
            url: `/item/search?keyword=${searchValue}`,
            method: 'GET',
            setData: values => {
                setAllProducts(values.data);
            },
            data: {},
        })
            .catch(() => {
                messageApi.error(gLang('shop.searchFail'));
            })
            .finally(() => {
                setProductsLoading(false);
            });
    };

    // 购买记录搬到独立弹窗组件内部加载

    const getTitleById = (id: number) => {
        const key = Number(id);
        if (Number.isFinite(key)) {
            const title = idToTitle.get(key);
            if (title) return title;
        }
        return `#${id}`;
    };

    // 根据当前分类和搜索条件筛选商品
    const filteredProducts = useMemo(() => {
        if (activeCategory === 'all') {
            return allProducts;
        }
        return allProducts.filter(product => {
            const { category } = parseProductJSON(product);
            return category === activeCategory;
        });
    }, [allProducts, activeCategory]);

    // 排序后的商品
    const sortedProducts = useMemo(() => {
        const list = [...filteredProducts];
        switch (sortKey) {
            case 'timeAsc':
                return list.sort((a, b) => (a as any).id - (b as any).id);
            case 'priceAsc':
                return list.sort((a, b) => a.price - b.price);
            case 'priceDesc':
                return list.sort((a, b) => b.price - a.price);
            case 'salesAsc':
                return list.sort((a, b) => a.sales - b.sales);
            case 'salesDesc':
                return list.sort((a, b) => b.sales - a.sales);
            case 'default':
            default:
                return list;
        }
    }, [filteredProducts, sortKey]);

    // 获取所有商品分类（带颜色）
    const productCategories = useMemo(() => {
        const categories = getUniqueCategories(allProducts);

        return categories.map((category, index) => ({
            name: category,
            color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? 'blue',
        }));
    }, [allProducts]);

    const tabItems = useMemo(
        () => [
            { key: 'all', label: gLang('shop.all') },
            ...productCategories.map(category => {
                const translationKey = `shop.category.${category.name}`;
                const translated = gLang(translationKey);
                const labelText =
                    translated === translationKey
                        ? (CATEGORY_NAME_MAP.get(category.name) ?? category.name)
                        : translated;

                return {
                    key: category.name,
                    label: (
                        <Tag color={category.color} style={{ margin: 0 }}>
                            {labelText}
                        </Tag>
                    ),
                };
            }),
        ],
        [productCategories]
    );

    const getImageUrl = (category: string, itemId: string): string => {
        const combinedKey = `${category}.${itemId}`;
        return `/merchandise/${combinedKey}.png`;
    };

    const getEmptyDescription = () => {
        if (searchValue) {
            return gLang('shop.noMatchFound');
        }
        if (activeCategory === 'all') {
            return gLang('shop.noProduct');
        }
        return gLang('shop.noProductInCategory');
    };

    if (MEDIA_SHOP_MAINTENANCE && !isAdminUser) {
        return (
            <Space direction="vertical" style={{ width: '100%' }}>
                {contextHolder}
                <PageTitle title={gLang('shop.title')} />
                <Result
                    status="warning"
                    title={gLang('shop.maintenance.title')}
                    subTitle={gLang('shop.maintenance.subTitle')}
                />
            </Space>
        );
    }

    if (productsLoading) {
        return (
            <Space direction="vertical" style={{ width: '100%' }}>
                {contextHolder}
                <div style={{ opacity: 0 }}>
                    <PageTitle title={gLang('shop.title')} />
                </div>
            </Space>
        );
    }

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            {contextHolder}
            <div
                style={{
                    opacity: 0,
                    transform: 'translateY(-10px)',
                    animation: shouldAnimate ? 'fadeInUp 0.5s ease-in-out forwards' : undefined,
                }}
            >
                <PageTitle title={gLang('shop.title')} />
            </div>

            <Space
                direction="vertical"
                size="large"
                style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}
            >
                {userInfo && (
                    <div
                        style={{
                            opacity: 0,
                            transform: 'translateY(10px)',
                            animation: shouldAnimate
                                ? 'fadeInUp 0.5s ease-in-out 0.1s forwards'
                                : undefined,
                        }}
                    >
                        <BalanceInfoCard
                            userInfo={userInfo}
                            screens={screens}
                            onViewPurchases={() => setPurchaseVisible(true)}
                        />
                    </div>
                )}
                {!productsLoading && (
                    <div
                        style={{
                            width: '100%',
                            background: isBlackOrangeActive ? productSurface : undefined,
                            borderRadius: isBlackOrangeActive ? 16 : undefined,
                            border: isBlackOrangeActive ? `1px solid ${productBorder}` : undefined,
                            padding: isBlackOrangeActive ? (screens.xs ? 16 : 24) : undefined,
                            boxShadow: isBlackOrangeActive
                                ? '0 18px 44px rgba(255, 140, 26, 0.18)'
                                : undefined,
                            transition: 'all 0.3s ease',
                            opacity: 0,
                            transform: 'translateY(10px)',
                            animation: shouldAnimate
                                ? 'fadeInUp 0.5s ease-in-out 0.12s forwards'
                                : undefined,
                        }}
                    >
                        {isBlackOrangeActive && (
                            <div
                                style={{
                                    height: 3,
                                    borderRadius: 999,
                                    background: palette.accent,
                                    marginBottom: screens.xs ? 12 : 16,
                                }}
                            />
                        )}
                        {userInfo &&
                            userInfo.status !== MediaStatus.ActiveCreator &&
                            userInfo.status !== MediaStatus.ExcellentCreator &&
                            !(
                                userInfo.status === MediaStatus.PendingReview &&
                                userInfo.EBalance !== 0
                            ) && (
                                <Alert
                                    message={gLang('shop.insufficientPermission')}
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: 16, position: 'relative', zIndex: 1 }}
                                />
                            )}

                        <Space
                            direction="vertical"
                            style={{ width: '100%', position: 'relative', zIndex: 1 }}
                            size="middle"
                        >
                            <div
                                style={{
                                    opacity: 0,
                                    transform: 'translateY(10px)',
                                    animation: shouldAnimate
                                        ? 'fadeInUp 0.5s ease-in-out 0.15s forwards'
                                        : undefined,
                                }}
                            >
                                <ProductToolbar
                                    screens={screens}
                                    gLang={gLang}
                                    searchValue={searchValue}
                                    onSearchValueChange={setSearchValue}
                                    onSearch={handleSearch}
                                    sortKey={sortKey}
                                    onSortKeyChange={setSortKey as any}
                                    tabItems={tabItems}
                                    activeCategory={activeCategory}
                                    onActiveCategoryChange={setActiveCategory}
                                    disabled={productsLoading}
                                />
                            </div>

                            {!productsLoading &&
                                (sortedProducts.length > 0 ? (
                                    <ProductGrid
                                        products={sortedProducts}
                                        screens={screens}
                                        renderItem={(product, index) => {
                                            const { category: cat, itemId } =
                                                parseProductJSON(product);
                                            const itemImage =
                                                (product as any).imageUrl ??
                                                getImageUrl(cat, itemId);
                                            return (
                                                <div
                                                    key={(product as any).id}
                                                    style={{
                                                        opacity: 0,
                                                        transform: 'translateY(10px)',
                                                        animation: shouldAnimate
                                                            ? `fadeInUp 0.5s ease-in-out ${0.2 + index * 0.03}s forwards`
                                                            : undefined,
                                                    }}
                                                >
                                                    <ProductCard
                                                        product={product}
                                                        itemImage={itemImage}
                                                        screens={screens}
                                                        onClick={() =>
                                                            setSelectedProduct({
                                                                ...product,
                                                                imageUrl: itemImage,
                                                            } as any)
                                                        }
                                                        gLang={gLang}
                                                        userInfo={userInfo}
                                                        messageApi={messageApi}
                                                    />
                                                </div>
                                            );
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            padding: '48px 0',
                                            opacity: 0,
                                            transform: 'translateY(10px)',
                                            animation: shouldAnimate
                                                ? 'fadeInUp 0.5s ease-in-out 0.2s forwards'
                                                : undefined,
                                        }}
                                    >
                                        <Empty
                                            description={
                                                <span style={{ color: emptyColor }}>
                                                    {getEmptyDescription()}
                                                </span>
                                            }
                                        />
                                    </div>
                                ))}
                        </Space>
                    </div>
                )}
            </Space>
            <ProductModal
                media={userInfo ?? null}
                product={selectedProduct}
                onClose={() => {
                    handleInfo();
                    setSelectedProduct(null);
                }}
                balance={userInfo?.EBalance ?? 0}
                defaultImage={defaultImage}
                onSuccess={handleInfo}
            />
            <Modal
                title={null}
                open={rulesVisible}
                onCancel={() => setRulesVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setRulesVisible(false)}>
                        {gLang('shop.know')}
                    </Button>,
                ]}
                width={640}
                destroyOnHidden
            >
                <Title level={4}>{gLang('shop.settlementRules')}</Title>
                <Paragraph>
                    {gLang('shop.departmentHead')}
                    {gLang('mediaPanel.department.general')}
                </Paragraph>
                <Paragraph>
                    {gLang('shop.operationScore')}
                    {gLang('mediaPanel.operation.all')}
                </Paragraph>
            </Modal>

            <PurchaseLogsModal
                open={purchaseVisible}
                onClose={() => setPurchaseVisible(false)}
                getTitleById={getTitleById}
                messageApi={messageApi}
            />
        </Space>
    );
}

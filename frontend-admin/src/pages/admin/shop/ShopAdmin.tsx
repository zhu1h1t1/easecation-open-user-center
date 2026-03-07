import { useEffect, useMemo, useState } from 'react';
import {
    App,
    Button,
    Col,
    message,
    Modal,
    Row,
    Space,
    Skeleton,
    Typography,
    Grid,
    Tag,
    theme,
} from 'antd';
import { PlusOutlined, ShopOutlined, BarChartOutlined } from '@ant-design/icons';
import { fetchData } from '@common/axiosConfig';
import { gLang } from '@common/language';
import AddProductModal from './components/AddProductModal';
import EditProductModal from './components/EditProductModal';
import ProductGrid from './components/ProductGrid';
import ProductCard from './components/ProductCard';
import ProductToolbar from './components/ProductToolbar';
import { CATEGORY_NAME_MAP } from '@ecuc/shared/constants/shop.constants';
import type { WeeklyStatsResponse } from '@ecuc/shared/types';

const { Title, Paragraph } = Typography;
// 移除本地 Search，统一使用 ProductToolbar 的搜索

interface Product {
    permanent_limit: number | null;
    id: string | number;
    title: string;
    price: number;
    detail: string;
    imgLink?: string;
    json: string;
    total_limit: number | null;
    monthly_limit: number | null;
    global_limit: number | null;
    current_month_sales: number;
    sales: number;
    is_hidden?: number;
}

type ProductJson = {
    category: string;
    idItem: string;
    data: number;
};

interface UpdateFormValues {
    title: string;
    price: number;
    detail: string;
    imgLink?: string;
    data: number;
    total_limit: number | null;
    monthly_limit: number | null;
    global_limit: number | null;
    permanent_limit: number | null;
    is_hidden?: number;
}

interface AddFormValues {
    title: string;
    category: string;
    idItem: string;
    data: number;
    price: number;
    detail: string;
    imgLink?: string;
    total_limit: number | null;
    monthly_limit: number | null;
    global_limit: number | null;
    permanent_limit: number | null;
    is_hidden?: number;
}

export type { AddFormValues };

// 固定的分类颜色列表，定义在组件外避免每次渲染都重新创建
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

export default function ProductManagementPage() {
    const { modal } = App.useApp();
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const { token } = theme.useToken();
    const [sortKey, setSortKey] = useState<
        'default' | 'priceAsc' | 'priceDesc' | 'salesAsc' | 'salesDesc' | 'timeAsc'
    >('default');
    const [searchValue, setSearchValue] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editFormValues, setEditFormValues] = useState<Partial<UpdateFormValues>>({});
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);

    const [downloadLoading, setDownloadLoading] = useState(false);
    const [messageApi, messageContextHolder] = message.useMessage();
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [statsVisible, setStatsVisible] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsResponse | null>(null);

    const handleDownloadAllImages = async () => {
        setDownloadLoading(true);
        try {
            await fetchData({
                url: '/utils/image/fetch-to-public',
                method: 'POST',
                data: {
                    scope: 'onlyEmpty',
                    overwrite: false,
                },
                setData: response => {
                    const successCount = response.success ?? 0;
                    const failCount = response.failed ?? 0;
                    const skipped = response.skipped ?? 0;
                    const msg = `${gLang('shopAdmin.download.operationSuccess')} (${gLang('common.success')}: ${successCount}, ${gLang('common.failed')}: ${failCount}, ${gLang('common.skipped')}: ${skipped})`;

                    if (successCount > 0) {
                        messageApi.success(
                            <div>
                                <div>{msg}</div>
                                {failCount > 0 && (
                                    <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
                                        {gLang('shopAdmin.download.failedCount', {
                                            count: failCount,
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    } else {
                        messageApi.warning(gLang('shopAdmin.download.noImagesDownloaded'));
                    }
                },
            });
        } catch {
            messageApi.error(gLang('shopAdmin.download.networkError'));
        } finally {
            setDownloadLoading(false);
        }
    };

    const openWeeklyStats = async () => {
        setStatsVisible(true);
        setStatsLoading(true);
        try {
            await fetchData({
                url: '/item/manager/stats/weekly',
                method: 'GET',
                data: {},
                setData: (res: any) => {
                    setWeeklyStats(res.data as WeeklyStatsResponse);
                },
            });
        } catch {
            messageApi.error(gLang('common.internal_server_error'));
        } finally {
            setStatsLoading(false);
        }
    };

    const parseProductJson = (jsonString: string): ProductJson => {
        try {
            const parsed = JSON.parse(jsonString);
            return Array.isArray(parsed) ? parsed[0] : parsed;
        } catch {
            return { category: '', idItem: '', data: 0 };
        }
    };

    const loadProducts = async (keyword: string = '') => {
        setLoading(true);
        try {
            await fetchData({
                url: `/item/manager/search?keyword=${keyword}`,
                method: 'GET',
                setData: (values: { data: Product[] }) => setProducts(values.data),
                data: {},
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleSearch = () => {
        loadProducts(searchValue);
    };

    const handleAddSubmit = async (values: AddFormValues) => {
        setConfirmLoading(true);
        try {
            const payload = {
                ...values,
                json: JSON.stringify([
                    {
                        category: values.category,
                        idItem: values.idItem,
                        data: values.data,
                    },
                ]),
                total_limit: values.total_limit ?? null,
                monthly_limit: values.monthly_limit ?? null,
                global_limit: values.global_limit ?? null,
                permanent_limit: values.permanent_limit ?? null,
            };

            await fetchData({
                url: '/item/addItem',
                method: 'POST',
                setData: () => {
                    setIsAddModalVisible(false);
                    loadProducts(searchValue);
                    messageApi.success(gLang('shopAdmin.add.success'));
                },
                data: payload,
            });
        } catch {
            messageApi.error(gLang('shopAdmin.add.failure'));
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleUpdateSubmit = async (values: UpdateFormValues) => {
        if (!editingProduct) return;

        setConfirmLoading(true);
        try {
            const originalJson = parseProductJson(editingProduct.json);
            const { data, ...restValues } = values;
            const payload = {
                ...restValues,
                total_limit: values.total_limit ?? null,
                monthly_limit: values.monthly_limit ?? null,
                global_limit: values.global_limit ?? null,
                permanent_limit: values.permanent_limit ?? null,
                json: JSON.stringify([{ ...originalJson, data: data }]),
            };

            await fetchData({
                url: `/item/update/${editingProduct.id}`,
                method: 'POST',
                setData: () => {
                    messageApi.success(gLang('shopAdmin.update.success'));
                    setEditingProduct(null);
                    loadProducts(searchValue);
                },
                data: payload,
            });
        } catch {
            messageApi.error(gLang('shopAdmin.update.failure'));
        } finally {
            setConfirmLoading(false);
        }
    };

    // 删除逻辑在 modal.confirm 的 onOk 中执行

    const filteredData = useMemo(() => {
        if (activeCategory === 'all') return products;
        return products.filter(p => parseProductJson(p.json).category === activeCategory);
    }, [products, activeCategory]);

    const sortedData = useMemo(() => {
        const list = [...filteredData];
        switch (sortKey) {
            case 'timeAsc':
                return list.sort(
                    (a, b) =>
                        Number((a as any).id ?? (a as any).ID) -
                        Number((b as any).id ?? (b as any).ID)
                );
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
    }, [filteredData, sortKey]);

    const productCategories = useMemo(() => {
        const set = new Set<string>();
        products.forEach(p => {
            const { category } = parseProductJson(p.json);
            if (category) set.add(category);
        });
        return Array.from(set).map((name, index) => ({
            name,
            color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? 'blue',
        }));
    }, [products]);

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

    return (
        <div style={{ width: '100%', height: '100%' }}>
            {messageContextHolder}
            <>
                <Typography>
                    <Title level={3}>{gLang('shopAdmin.title.productManagement')}</Title>
                    <Paragraph type="secondary">{gLang('shopAdmin.intro')}</Paragraph>
                </Typography>
                <Row gutter={[16, 16]} style={{ marginBottom: screens.xs ? 8 : 16 }}>
                    <Col xs={24} md={12}>
                        <Space wrap size={screens.xs ? 8 : 12}>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setIsAddModalVisible(true)}
                                disabled={downloadLoading}
                            >
                                {gLang('shopAdmin.button.add')}
                            </Button>
                            <Button
                                type="default"
                                icon={<BarChartOutlined />}
                                onClick={openWeeklyStats}
                                disabled={downloadLoading}
                            >
                                {gLang('shopAdmin.button.viewWeeklyStats')}
                            </Button>
                            {import.meta.env.DEV && (
                                <Button
                                    type="default"
                                    icon={<ShopOutlined />}
                                    onClick={() => {
                                        modal.confirm({
                                            title: gLang('shopAdmin.tools.downloadImages.title'),
                                            content: gLang('shopAdmin.tools.downloadImages.desc'),
                                            okText: gLang('common.confirm'),
                                            cancelText: gLang('common.cancel'),
                                            onOk: () => handleDownloadAllImages(),
                                        });
                                    }}
                                    disabled={downloadLoading}
                                >
                                    {gLang('shopAdmin.tools.downloadImages.title')}
                                </Button>
                            )}
                        </Space>
                    </Col>
                    <Col xs={24} md={12} />
                </Row>

                {loading ? (
                    <Skeleton active paragraph={{ rows: 8 }} />
                ) : (
                    <>
                        <ProductToolbar
                            screens={screens}
                            gLang={gLang}
                            searchValue={searchValue}
                            onSearchValueChange={setSearchValue}
                            onSearch={handleSearch}
                            sortKey={sortKey}
                            onSortKeyChange={key => setSortKey(key)}
                            // 使用与前台一致的排序项
                            tabItems={tabItems}
                            activeCategory={activeCategory}
                            onActiveCategoryChange={setActiveCategory}
                            disabled={downloadLoading}
                        />
                        <ProductGrid
                            products={sortedData as any}
                            screens={screens}
                            renderItem={(product: any) => {
                                const json = parseProductJson(product.json);
                                const itemImage = `/merchandise/${json.category}.${json.idItem}.png`;
                                const isHidden = Number((product as any).is_hidden ?? 0) === 1;
                                const card = (
                                    <ProductCard
                                        key={(product as any).id}
                                        product={product as any}
                                        itemImage={itemImage}
                                        screens={screens}
                                        itemIdText={`${json.category}.${json.idItem}:${Math.floor(json.data ?? 0)}`}
                                        onClick={() => {
                                            const normalizedId = String(
                                                (product as any).id ?? (product as any).ID
                                            );
                                            const normalized = {
                                                ...product,
                                                id: normalizedId,
                                            } as Product;
                                            setEditingProduct(normalized);
                                            setEditFormValues({
                                                ...normalized,
                                                data: Math.floor(json.data ?? 0),
                                                total_limit: normalized.total_limit,
                                                monthly_limit: normalized.monthly_limit,
                                                global_limit: normalized.global_limit,
                                                permanent_limit: normalized.permanent_limit,
                                                is_hidden: normalized.is_hidden ?? 0,
                                            });
                                        }}
                                        gLang={gLang}
                                        userInfo={{ status: '3' }}
                                        messageApi={messageApi}
                                    />
                                );
                                return isHidden ? (
                                    <div style={{ position: 'relative' }}>
                                        {card}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                bottom: 0,
                                                left: 0,
                                                background: token.colorBgMask,
                                                borderRadius: 8,
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    </div>
                                ) : (
                                    card
                                );
                            }}
                        />
                    </>
                )}

                {/* 添加商品 Modal */}
                <AddProductModal
                    open={isAddModalVisible}
                    onCancel={() => setIsAddModalVisible(false)}
                    onOk={handleAddSubmit}
                    confirmLoading={confirmLoading}
                />

                {/* 编辑商品 Modal */}
                <EditProductModal
                    open={!!editingProduct}
                    onCancel={() => {
                        setEditingProduct(null);
                        setEditFormValues({});
                    }}
                    onOk={handleUpdateSubmit}
                    confirmLoading={confirmLoading}
                    product={editingProduct}
                    initialFormValues={editFormValues}
                    onDelete={() => {
                        if (!editingProduct) return;
                        const currentId = (editingProduct as any).id ?? (editingProduct as any).ID;
                        modal.confirm({
                            title: gLang('shopAdmin.delete.title'),
                            content: gLang('shopAdmin.delete.content'),
                            okText: gLang('common.confirm'),
                            cancelText: gLang('common.cancel'),
                            onOk: async () => {
                                setConfirmLoading(true);
                                try {
                                    await fetchData({
                                        url: `/item/delete?id=${currentId}`,
                                        method: 'GET',
                                        setData: () => {
                                            loadProducts(searchValue);
                                            messageApi.success(gLang('shopAdmin.delete.success'));
                                        },
                                        data: {},
                                    });
                                } catch {
                                    messageApi.error(gLang('shopAdmin.delete.failure'));
                                } finally {
                                    setConfirmLoading(false);
                                    setEditingProduct(null);
                                }
                            },
                        });
                    }}
                />

                {/* 删除确认改为使用 modal.confirm */}

                <Modal
                    title={gLang('shopAdmin.stats.weekly.title')}
                    open={statsVisible}
                    onCancel={() => setStatsVisible(false)}
                    footer={null}
                >
                    {statsLoading ? (
                        <Skeleton active paragraph={{ rows: 4 }} />
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <div
                                style={{
                                    marginBottom: 16,
                                    padding: '8px 12px',
                                    backgroundColor: token.colorBgContainer,
                                    borderRadius: 6,
                                    fontSize: '12px',
                                    color: token.colorTextSecondary,
                                }}
                            >
                                {gLang('shopAdmin.stats.weekly.excludeECStaff')}
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td
                                            style={{
                                                padding: '8px 8px',
                                                color: 'var(--ant-color-text-secondary)',
                                            }}
                                        >
                                            {gLang('shopAdmin.stats.weekly.totalPurchases')}
                                        </td>
                                        <td style={{ padding: '8px 8px' }}>
                                            {weeklyStats?.totalPurchases ?? 0}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td
                                            style={{
                                                padding: '8px 8px',
                                                color: 'var(--ant-color-text-secondary)',
                                            }}
                                        >
                                            {gLang('shopAdmin.stats.weekly.totalSpent')}
                                        </td>
                                        <td style={{ padding: '8px 8px' }}>
                                            {weeklyStats?.totalEBalanceSpent ?? 0}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td
                                            style={{
                                                padding: '8px 8px',
                                                color: 'var(--ant-color-text-secondary)',
                                            }}
                                        >
                                            {gLang('shopAdmin.stats.weekly.topItem')}
                                        </td>
                                        <td style={{ padding: '8px 8px' }}>
                                            {weeklyStats?.topItem
                                                ? (() => {
                                                      const top = weeklyStats?.topItem;
                                                      if (!top) return null;
                                                      const found = products.find(
                                                          p =>
                                                              Number(
                                                                  (p as any).id ?? (p as any).ID
                                                              ) === top.itemId
                                                      );
                                                      const title = found?.title || top.title || '';
                                                      return `${title} x${top.quantity}`;
                                                  })()
                                                : gLang('shopAdmin.stats.weekly.none')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </Modal>

                {/* 工具弹窗已移除，改为二次确认直接执行 */}
            </>
        </div>
    );
}

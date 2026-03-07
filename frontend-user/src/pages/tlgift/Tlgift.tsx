/**
 * 原石商城（玩家端）：照搬创作者商城布局 - 余额卡片 + 搜索/排序/分类 Tab + 商品网格 + 消费弹窗，另有「我的记录」Tab；购物车支持导出/导入配置（复制粘贴）。
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Space,
    Tabs,
    Card,
    Table,
    Empty,
    Grid,
    message,
    Select,
    Drawer,
    List,
    InputNumber,
    Button,
    Modal,
    Input,
    Badge,
    Tag,
} from 'antd';
import {
    ShoppingCartOutlined,
    ExportOutlined,
    ImportOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import axiosInstance from '@common/axiosConfig';
import PageTitle from '@common/components/PageTitle/PageTitle';
import usePageTitle from '@common/hooks/usePageTitle';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';
import TlgiftBalanceCard from './components/TlgiftBalanceCard';
import TlgiftProductCard, { type TlgiftItem } from './components/TlgiftProductCard';
import TlgiftConsumeModal from './components/TlgiftConsumeModal';
import ProductToolbar from '../shop/components/ProductToolbar';
import type { SortKey } from '../shop/components/ProductToolbar';
import defaultImage from '../shop/default-product.png';
import { gLang } from '@common/language';
import { CATEGORY_NAME_MAP } from '@ecuc/shared/constants/shop.constants';

const { useBreakpoint } = Grid;

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

/** Infer category from item json (first merchandise category); used for tab filter. */
function getCategoryFromItem(item: TlgiftItem): string {
    if (!item.json || !item.json.trim()) return 'general';
    try {
        const arr = JSON.parse(item.json) as Array<{ category?: string }>;
        const cat = arr?.[0]?.category;
        return typeof cat === 'string' ? cat : 'general';
    } catch {
        return 'general';
    }
}

/** Unique categories in first-appearance order (same as shop getUniqueCategories). */
function getUniqueCategoriesFromItems(items: TlgiftItem[]): string[] {
    const seen = new Set<string>();
    const list: string[] = [];
    items.forEach(item => {
        const cat = getCategoryFromItem(item);
        if (cat && !seen.has(cat)) {
            seen.add(cat);
            list.push(cat);
        }
    });
    return list;
}

/** Cart entry for export/import: stable format { items: [{ id, quantity }] } */
export interface CartEntry {
    itemId: string;
    quantity: number;
}
export const CART_EXPORT_VERSION = 1;
export interface CartExportData {
    version: number;
    items: CartEntry[];
}

const TLGIFT_CART_STORAGE_KEY = 'tlgift_cart';

function loadCartFromStorage(): CartEntry[] {
    try {
        const raw = localStorage.getItem(TLGIFT_CART_STORAGE_KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.items)) {
            return data.items.filter((e: CartEntry) => e?.itemId && (e.quantity ?? 0) >= 1);
        }
        if (Array.isArray(data)) {
            return data
                .filter(
                    (x: { itemId?: string; id?: string; quantity?: number; qty?: number }) =>
                        x && (x.itemId != null || x.id != null) && (x.quantity ?? x.qty ?? 0) >= 1
                )
                .map((x: { itemId?: string; id?: string; quantity?: number; qty?: number }) => ({
                    itemId: String(x.itemId ?? x.id),
                    quantity: Number(x.quantity ?? x.qty ?? 1),
                }));
        }
    } catch {
        // do nothing
    }
    return [];
}

interface TlgiftMe {
    openid: string;
    primogems: number;
}
interface TlgiftLog {
    id: number;
    openid: string;
    type: string;
    amount: number;
    product_id: string | null;
    ecid: string | null;
    operator: string;
    quantity: number | null;
    created_at: string;
}

export default function Tlgift() {
    usePageTitle();
    const screens = useBreakpoint();
    const [me, setMe] = useState<TlgiftMe | null>(null);
    const [logs, setLogs] = useState<TlgiftLog[]>([]);
    const [items, setItems] = useState<TlgiftItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<TlgiftItem | null>(null);
    const [activeTab, setActiveTab] = useState('consume');
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [aliasOptions, setAliasOptions] = useState<string[]>([]);
    const [logsTarget, setLogsTarget] = useState<string>('__me__');
    const [cart, setCart] = useState<CartEntry[]>(loadCartFromStorage);
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [cartEcid, setCartEcid] = useState('');
    const [cartPersonRemaining, setCartPersonRemaining] = useState<Record<string, number | null>>(
        {}
    );
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [settleModalOpen, setSettleModalOpen] = useState(false);
    const [settleLoading, setSettleLoading] = useState(false);
    const [messageApi, messageContextHolder] = message.useMessage();

    const [searchValue, setSearchValue] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('default');
    const [activeCategory, setActiveCategory] = useState<string>('all');

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

    const loadMe = async () => {
        try {
            const res = await axiosInstance.get('/tlgift/me');
            if (res.data?.EPF_code === 200 && res.data?.data) setMe(res.data.data);
        } catch (e) {
            console.error(e);
        }
    };
    const loadLogs = async () => {
        const target = logsTarget === '__me__' ? me?.openid : logsTarget;
        if (!target) return;
        setLogsLoading(true);
        try {
            const res = await axiosInstance.get('/tlgift/logs', { params: { openid: target } });
            if (res.data?.EPF_code === 200 && res.data?.data) setLogs(res.data.data);
            else setLogs([]);
        } catch (e) {
            console.error(e);
            setLogs([]);
        } finally {
            setLogsLoading(false);
        }
    };
    const loadItems = async () => {
        setItemsLoading(true);
        try {
            const res = await axiosInstance.get('/tlgift/items');
            if (res.data?.EPF_code === 200 && res.data?.data) setItems(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setItemsLoading(false);
        }
    };

    useEffect(() => {
        loadMe();
        loadItems();
    }, []);
    useEffect(() => {
        if (activeTab === 'logs') {
            axiosInstance
                .get('/tlgift/alias-options')
                .then(res => {
                    if (res.data?.EPF_code === 200 && Array.isArray(res.data?.data))
                        setAliasOptions(res.data.data);
                })
                .catch(() => setAliasOptions([]));
        }
    }, [activeTab]);
    useEffect(() => {
        if (activeTab !== 'logs') return;
        if (logsTarget === '__me__' && me?.openid) loadLogs();
        else if (logsTarget !== '__me__' && logsTarget) loadLogs();
        else setLogs([]);
    }, [activeTab, logsTarget, me?.openid]);

    useEffect(() => {
        if (!itemsLoading) setTimeout(() => setShouldAnimate(true), 50);
    }, [itemsLoading]);

    const productCategories = useMemo(() => {
        const categories = getUniqueCategoriesFromItems(items);
        return categories.map((name, index) => ({
            name,
            color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? 'blue',
        }));
    }, [items]);

    const tlgiftTabItems = useMemo(
        () => [
            { key: 'all', label: gLang('tlgift.allProducts') },
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

    const filteredItems = useMemo(() => {
        let list = items;
        if (activeCategory !== 'all') {
            list = list.filter(item => getCategoryFromItem(item) === activeCategory);
        }
        if (searchValue.trim()) {
            const q = searchValue.trim().toLowerCase();
            list = list.filter(item => item.title?.toLowerCase().includes(q));
        }
        return list;
    }, [items, activeCategory, searchValue]);

    const sortedItems = useMemo(() => {
        const list = [...filteredItems];
        switch (sortKey) {
            case 'timeAsc':
                return list.sort((a, b) =>
                    String(a.id).localeCompare(String(b.id), undefined, { numeric: true })
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
    }, [filteredItems, sortKey]);

    useEffect(() => {
        try {
            if (cart.length > 0) {
                localStorage.setItem(
                    TLGIFT_CART_STORAGE_KEY,
                    JSON.stringify({ version: CART_EXPORT_VERSION, items: cart })
                );
            } else {
                localStorage.removeItem(TLGIFT_CART_STORAGE_KEY);
            }
        } catch {
            // do nothing
        }
    }, [cart]);

    const ecidTrim = cartEcid.trim();
    useEffect(() => {
        if (!cartDrawerOpen || !ecidTrim || cart.length === 0) {
            setCartPersonRemaining({});
            return;
        }
        const needFetch = cart
            .map(e => items.find(i => i.id === e.itemId))
            .filter((p): p is TlgiftItem => !!p && p.person_limit > 0)
            .map(p => p.id);
        if (needFetch.length === 0) {
            setCartPersonRemaining({});
            return;
        }
        const cancelled = { current: false };
        needFetch.forEach(itemId => {
            axiosInstance
                .get(`/tlgift/items/${itemId}/person-remaining`, { params: { ecid: ecidTrim } })
                .then(res => {
                    if (cancelled.current) return;
                    const v =
                        res.data?.EPF_code === 200 && res.data?.data != null
                            ? Number(res.data.data)
                            : null;
                    setCartPersonRemaining(prev => ({ ...prev, [itemId]: v }));
                })
                .catch(() => {
                    if (!cancelled.current)
                        setCartPersonRemaining(prev => ({ ...prev, [itemId]: null }));
                });
        });
        return () => {
            cancelled.current = true;
        };
    }, [cartDrawerOpen, ecidTrim, cart.length, cart.map(e => e.itemId).join(','), items.length]);

    const getItemImage = (id: string) => `/merchandise/tlgift.${id}.png`;

    const addToCart = useCallback((itemId: string, quantity: number = 1) => {
        setCart(prev => {
            const i = prev.findIndex(e => e.itemId === itemId);
            if (i >= 0) {
                const next = [...prev];
                next[i] = { ...next[i], quantity: next[i].quantity + quantity };
                return next;
            }
            return [...prev, { itemId, quantity }];
        });
    }, []);
    const removeFromCart = useCallback((itemId: string) => {
        setCart(prev => prev.filter(e => e.itemId !== itemId));
    }, []);
    const updateCartQuantity = useCallback(
        (itemId: string, quantity: number) => {
            if (quantity < 1) {
                removeFromCart(itemId);
                return;
            }
            setCart(prev => prev.map(e => (e.itemId === itemId ? { ...e, quantity } : e)));
        },
        [removeFromCart]
    );
    const cartTotalQuantity = cart.reduce((s, e) => s + e.quantity, 0);
    const cartTotalPrimogems = cart.reduce((s, e) => {
        const p = items.find(i => i.id === e.itemId);
        return s + (p ? p.price * e.quantity : 0);
    }, 0);

    /** Whether this cart entry is non-compliant (over limit / sold out) — show red; excess allowed in cart. */
    const isCartEntryInvalid = useCallback(
        (entry: CartEntry): boolean => {
            const product = items.find(i => i.id === entry.itemId);
            if (!product) return false;
            if (product.total_remaining != null && product.total_remaining <= 0) return true;
            if (product.user_remaining != null && product.user_remaining <= 0) return true;
            if (product.person_limit > 0 && ecidTrim) {
                const pr = cartPersonRemaining[product.id];
                if (pr != null && entry.quantity > pr) return true;
            }
            return false;
        },
        [items, ecidTrim, cartPersonRemaining]
    );

    const hasCartInvalidEntry = cart.some(isCartEntryInvalid);

    const runSettlement = useCallback(async () => {
        if (!ecidTrim) {
            messageApi.warning(gLang('tlgift.settleEcidRequired'));
            return;
        }
        if (cart.length === 0) return;
        setSettleLoading(true);
        const toSettle = [...cart];
        try {
            for (const entry of toSettle) {
                const res = await axiosInstance.post('/tlgift/consume', {
                    itemId: entry.itemId,
                    quantity: entry.quantity,
                    ecid: ecidTrim,
                });
                if (res.data?.EPF_code !== 200) {
                    messageApi.error(res.data?.EPF_description || gLang('tlgift.settleFailed'));
                    return;
                }
                setCart(prev => prev.filter(e => e.itemId !== entry.itemId));
            }
            messageApi.success(gLang('tlgift.settleSuccess'));
            setSettleModalOpen(false);
            loadMe();
        } catch (e: any) {
            messageApi.error(e.response?.data?.EPF_description || gLang('tlgift.requestFailed'));
        } finally {
            setSettleLoading(false);
        }
    }, [ecidTrim, cart, messageApi]);

    /** Export cart to copy-paste string (JSON). */
    const exportCartConfig = useCallback((): string => {
        const data: CartExportData = {
            version: CART_EXPORT_VERSION,
            items: cart.map(e => ({ itemId: e.itemId, quantity: e.quantity })),
        };
        return JSON.stringify(data);
    }, [cart]);
    const copyCartConfig = useCallback(() => {
        const text = exportCartConfig();
        if (!text || text === '{"version":1,"items":[]}') {
            messageApi.info(gLang('tlgift.exportEmpty'));
            return;
        }
        navigator.clipboard.writeText(text).then(
            () => messageApi.success(gLang('tlgift.copySuccess')),
            () => messageApi.error(gLang('tlgift.copyFailed'))
        );
    }, [exportCartConfig, messageApi]);

    /** Import cart from pasted string; merge with current cart by itemId. */
    const importCartConfig = useCallback(
        (text: string) => {
            let data: CartExportData;
            try {
                const raw = JSON.parse(text.trim());
                if (raw && Array.isArray(raw.items)) {
                    data = { version: raw.version ?? 1, items: raw.items };
                } else if (
                    Array.isArray(raw) &&
                    raw.every(
                        (x: any) =>
                            x &&
                            (x.itemId != null || x.id != null) &&
                            typeof (x.quantity ?? x.qty) === 'number'
                    )
                ) {
                    data = {
                        version: 1,
                        items: raw.map((x: any) => ({
                            itemId: String(x.itemId ?? x.id),
                            quantity: Number(x.quantity ?? x.qty),
                        })),
                    };
                } else {
                    messageApi.warning(gLang('tlgift.importInvalidFormat'));
                    return;
                }
            } catch {
                messageApi.warning(gLang('tlgift.importInvalidJson'));
                return;
            }
            const valid = data.items.filter(e => e.itemId && e.quantity >= 1);
            if (valid.length === 0) {
                messageApi.warning(gLang('tlgift.importNoValidItems'));
                return;
            }
            setCart(prev => {
                const byId = new Map(prev.map(e => [e.itemId, e.quantity]));
                valid.forEach(e => byId.set(e.itemId, (byId.get(e.itemId) ?? 0) + e.quantity));
                return Array.from(byId.entries()).map(([itemId, quantity]) => ({
                    itemId,
                    quantity,
                }));
            });
            messageApi.success(gLang('tlgift.importSuccess', { count: String(valid.length) }));
            setImportModalOpen(false);
            setImportText('');
        },
        [messageApi]
    );

    const tabConsume = (
        <Space
            direction="vertical"
            size="large"
            style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}
        >
            {messageContextHolder}
            {me !== null && (
                <div
                    style={{
                        opacity: 0,
                        transform: 'translateY(10px)',
                        animation: shouldAnimate
                            ? 'fadeInUp 0.5s ease-in-out 0.1s forwards'
                            : undefined,
                    }}
                >
                    <TlgiftBalanceCard
                        primogems={me?.primogems ?? 0}
                        screens={screens}
                        onViewLogs={() => setActiveTab('logs')}
                    />
                </div>
            )}
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
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 8,
                        }}
                    >
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <ProductToolbar
                                screens={screens}
                                gLang={gLang}
                                searchValue={searchValue}
                                onSearchValueChange={setSearchValue}
                                onSearch={() => {}}
                                searchPlaceholder={gLang('tlgift.searchPlaceholder')}
                                sortKey={sortKey}
                                onSortKeyChange={setSortKey}
                                tabItems={tlgiftTabItems}
                                activeCategory={activeCategory}
                                onActiveCategoryChange={setActiveCategory}
                                disabled={itemsLoading}
                            />
                        </div>
                        <Badge count={cartTotalQuantity} size="small" offset={[-2, 2]}>
                            <Button
                                type="default"
                                icon={<ShoppingCartOutlined />}
                                onClick={() => setCartDrawerOpen(true)}
                            >
                                {gLang('tlgift.cart')}
                            </Button>
                        </Badge>
                    </div>
                    {itemsLoading ? null : sortedItems.length > 0 ? (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: screens.xs
                                    ? 'repeat(auto-fit, minmax(260px, 1fr))'
                                    : 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: screens.xs ? 12 : 16,
                                width: '100%',
                            }}
                        >
                            {sortedItems.map((product, index) => (
                                <div
                                    key={product.id}
                                    style={{
                                        opacity: 0,
                                        transform: 'translateY(10px)',
                                        animation: shouldAnimate
                                            ? `fadeInUp 0.5s ease-in-out ${0.2 + index * 0.03}s forwards`
                                            : undefined,
                                    }}
                                >
                                    <TlgiftProductCard
                                        product={product}
                                        itemImage={getItemImage(product.id)}
                                        fallbackImage={defaultImage}
                                        screens={screens}
                                        onClick={() => setSelectedProduct(product)}
                                        onAddToCart={() => addToCart(product.id, 1)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '48px 0' }}>
                            <Empty
                                description={
                                    <span style={{ color: emptyColor }}>
                                        {items.length === 0
                                            ? gLang('tlgift.noProducts')
                                            : gLang('tlgift.noMatchFound')}
                                    </span>
                                }
                            />
                        </div>
                    )}
                </Space>
            </div>
            <Drawer
                title={gLang('tlgift.cart')}
                open={cartDrawerOpen}
                onClose={() => setCartDrawerOpen(false)}
                width={screens.md ? 400 : '100%'}
                footer={
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 8,
                            }}
                        >
                            <span>
                                {gLang('tlgift.cartSummary', {
                                    kind: String(cart.length),
                                    qty: String(cartTotalQuantity),
                                })}
                            </span>
                            <span>
                                {gLang('tlgift.cartEstimate', {
                                    primogems: String(cartTotalPrimogems),
                                })}
                            </span>
                        </div>
                        {cart.length > 0 && (
                            <Button
                                type="primary"
                                block
                                loading={settleLoading}
                                disabled={
                                    !ecidTrim ||
                                    hasCartInvalidEntry ||
                                    (me?.primogems ?? 0) < cartTotalPrimogems
                                }
                                onClick={() => setSettleModalOpen(true)}
                                style={{ marginBottom: 8 }}
                            >
                                {gLang('tlgift.settle')}
                            </Button>
                        )}
                        <Space wrap>
                            <Button icon={<ExportOutlined />} onClick={copyCartConfig}>
                                {gLang('tlgift.exportConfig')}
                            </Button>
                            <Button
                                icon={<ImportOutlined />}
                                onClick={() => {
                                    setImportText('');
                                    setImportModalOpen(true);
                                }}
                            >
                                {gLang('tlgift.importConfig')}
                            </Button>
                            {cart.length > 0 && (
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                        setCart([]);
                                        messageApi.success(gLang('tlgift.clearSuccess'));
                                    }}
                                >
                                    {gLang('tlgift.clear')}
                                </Button>
                            )}
                        </Space>
                    </Space>
                }
            >
                {cart.length === 0 ? (
                    <Empty
                        description={gLang('tlgift.cartEmpty')}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <>
                        <div style={{ marginBottom: 12 }}>
                            <span style={{ marginRight: 8 }}>{gLang('tlgift.targetEcid')}</span>
                            <Input
                                placeholder={gLang('tlgift.targetEcidPlaceholder')}
                                value={cartEcid}
                                onChange={e => setCartEcid(e.target.value)}
                                style={{ marginTop: 4 }}
                            />
                        </div>
                        <List
                            dataSource={cart}
                            renderItem={entry => {
                                const product = items.find(i => i.id === entry.itemId);
                                const price = product?.price ?? 0;
                                const sub = price * entry.quantity;
                                const invalid = isCartEntryInvalid(entry);
                                return (
                                    <List.Item
                                        style={{
                                            borderLeft: invalid ? '3px solid #ff4d4f' : undefined,
                                            backgroundColor: invalid
                                                ? 'rgba(255, 77, 79, 0.08)'
                                                : undefined,
                                            marginLeft: -8,
                                            marginRight: -8,
                                            paddingLeft: invalid ? 5 : 8,
                                        }}
                                        actions={[
                                            <InputNumber
                                                key="qty"
                                                min={1}
                                                value={entry.quantity}
                                                onChange={v =>
                                                    updateCartQuantity(entry.itemId, Number(v) || 1)
                                                }
                                                size="small"
                                                style={{ width: 72 }}
                                            />,
                                            <Button
                                                key="del"
                                                type="text"
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeFromCart(entry.itemId)}
                                            />,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <span
                                                    style={{
                                                        color: invalid ? '#ff4d4f' : undefined,
                                                    }}
                                                >
                                                    {product?.title ?? entry.itemId}
                                                </span>
                                            }
                                            description={
                                                <span
                                                    style={{
                                                        color: invalid ? '#ff4d4f' : undefined,
                                                    }}
                                                >
                                                    {gLang('tlgift.perItemPrice', {
                                                        price: String(price),
                                                        qty: String(entry.quantity),
                                                        sub: String(sub),
                                                    })}
                                                    {invalid && gLang('tlgift.overLimitOrSoldOut')}
                                                </span>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                    </>
                )}
            </Drawer>
            <Modal
                title={gLang('tlgift.confirmSettle')}
                open={settleModalOpen}
                onCancel={() => !settleLoading && setSettleModalOpen(false)}
                onOk={() => runSettlement()}
                okText={gLang('tlgift.confirmSettle')}
                cancelButtonProps={{ disabled: settleLoading }}
                okButtonProps={{ loading: settleLoading }}
                destroyOnClose
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <p>
                        {gLang('tlgift.confirmSettleEcid')} <strong>{ecidTrim || '-'}</strong>
                    </p>
                    <p>
                        {gLang('tlgift.confirmSettleSummary', {
                            kind: String(cart.length),
                            qty: String(cartTotalQuantity),
                            primogems: String(cartTotalPrimogems),
                        })}
                    </p>
                    <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                        {gLang('tlgift.confirmSettleHint')}
                    </p>
                </Space>
            </Modal>
            <Modal
                title={gLang('tlgift.importModalTitle')}
                open={importModalOpen}
                onCancel={() => {
                    setImportModalOpen(false);
                    setImportText('');
                }}
                onOk={() => importCartConfig(importText)}
                okText={gLang('tlgift.importBtn')}
                destroyOnClose
            >
                <Input.TextArea
                    rows={6}
                    placeholder={gLang('tlgift.importModalPlaceholder')}
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                />
            </Modal>
            <TlgiftConsumeModal
                product={selectedProduct}
                balance={me?.primogems ?? 0}
                defaultImage={defaultImage}
                onClose={() => setSelectedProduct(null)}
                onSuccess={() => {
                    loadMe();
                }}
                onAddToCart={addToCart}
            />
        </Space>
    );

    const tabLogs = (
        <Card title={gLang('tlgift.logsTitle')}>
            <Space style={{ marginBottom: 16 }}>
                <Select
                    value={logsTarget}
                    onChange={setLogsTarget}
                    options={[
                        { value: '__me__', label: gLang('tlgift.myLogs') },
                        ...aliasOptions.map(a => ({ value: a, label: a })),
                    ]}
                    style={{ minWidth: 160 }}
                    placeholder={gLang('tlgift.selectTarget')}
                />
            </Space>
            <Table
                loading={logsLoading}
                dataSource={logs}
                rowKey="id"
                size="small"
                columns={[
                    {
                        title: gLang('tlgift.tableTime'),
                        dataIndex: 'created_at',
                        key: 'created_at',
                        render: (t: string) => t?.slice(0, 19),
                    },
                    {
                        title: gLang('tlgift.tableType'),
                        dataIndex: 'type',
                        key: 'type',
                        render: (t: string) =>
                            t === 'consume'
                                ? gLang('tlgift.logTypeConsume')
                                : gLang('tlgift.logTypeAdjust'),
                    },
                    {
                        title: gLang('tlgift.tableAmount'),
                        dataIndex: 'amount',
                        key: 'amount',
                        render: (a: number) => (a > 0 ? `+${a}` : a),
                    },
                    {
                        title: gLang('tlgift.tableEcid'),
                        dataIndex: 'ecid',
                        key: 'ecid',
                        render: (v: string | null) => v ?? '-',
                    },
                    {
                        title: gLang('tlgift.tableProduct'),
                        key: 'product',
                        render: (_: unknown, r: TlgiftLog) => {
                            if (r.type !== 'consume' || !r.product_id) return '-';
                            const title =
                                items.find(i => String(i.id) === String(r.product_id))?.title ??
                                r.product_id;
                            const qty = r.quantity != null ? r.quantity : '-';
                            return `${title} × ${qty}`;
                        },
                    },
                ]}
                pagination={false}
            />
            {logsTarget === '__me__' && me !== null && !me?.openid && (
                <span style={{ color: emptyColor }}>{gLang('tlgift.loginRequiredForLogs')}</span>
            )}
        </Card>
    );

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <div
                style={{
                    opacity: 0,
                    transform: 'translateY(-10px)',
                    animation: shouldAnimate ? 'fadeInUp 0.5s ease-in-out forwards' : undefined,
                }}
            >
                <PageTitle title={gLang('tlgift.title')} />
            </div>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    { key: 'consume', label: gLang('tlgift.tabConsume'), children: tabConsume },
                    { key: 'logs', label: gLang('tlgift.tabLogs'), children: tabLogs },
                ]}
            />
        </Space>
    );
}

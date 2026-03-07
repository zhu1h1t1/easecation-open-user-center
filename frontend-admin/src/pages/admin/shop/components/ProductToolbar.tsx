import React from 'react';
import { Space, Tabs, Select } from 'antd';
import Search from 'antd/es/input/Search';
import type { TabsProps } from 'antd';
import { AppstoreOutlined, DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';

export type SortKey = 'default' | 'priceAsc' | 'priceDesc' | 'salesAsc' | 'salesDesc' | 'timeAsc';

type ProductToolbarProps = {
    readonly screens: any;
    readonly gLang: (key: string, params?: { [key: string]: string | number }) => string;

    readonly searchValue: string;
    readonly onSearchValueChange: (value: string) => void;
    readonly onSearch: () => void;

    readonly sortKey: SortKey;
    readonly onSortKeyChange: (key: SortKey) => void;
    /** 可选：限制展示的排序项，默认展示全部 */
    readonly sortOptions?: SortKey[];

    readonly tabItems: TabsProps['items'];
    readonly activeCategory: string;
    readonly onActiveCategoryChange: (key: string) => void;

    readonly disabled?: boolean;
};

export default function ProductToolbar({
    screens,
    gLang,
    searchValue,
    onSearchValueChange,
    onSearch,
    sortKey,
    onSortKeyChange,
    sortOptions,
    tabItems,
    activeCategory,
    onActiveCategoryChange,
    disabled,
}: ProductToolbarProps) {
    const allOptions: { key: SortKey; label: React.ReactNode }[] = [
        {
            key: 'default',
            label: (
                <Space size={4}>
                    <AppstoreOutlined />
                    {gLang('shop.sort.default')}
                </Space>
            ),
        },
        {
            key: 'timeAsc',
            label: (
                <Space size={4}>
                    <AppstoreOutlined />
                    {gLang('shop.sort.timeAsc')}
                </Space>
            ),
        },
        {
            key: 'priceAsc',
            label: (
                <Space size={4}>
                    <DollarOutlined />
                    {gLang('shop.sort.priceAsc')}
                </Space>
            ),
        },
        {
            key: 'priceDesc',
            label: (
                <Space size={4}>
                    <DollarOutlined />
                    {gLang('shop.sort.priceDesc')}
                </Space>
            ),
        },
        {
            key: 'salesAsc',
            label: (
                <Space size={4}>
                    <ShoppingCartOutlined />
                    {gLang('shop.sort.salesAsc')}
                </Space>
            ),
        },
        {
            key: 'salesDesc',
            label: (
                <Space size={4}>
                    <ShoppingCartOutlined />
                    {gLang('shop.sort.salesDesc')}
                </Space>
            ),
        },
    ];
    const displayOptions =
        sortOptions && sortOptions.length > 0
            ? allOptions.filter(opt => sortOptions.includes(opt.key))
            : allOptions;

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: screens.xs ? 8 : 16,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Search
                    placeholder={gLang('shop.searchPlaceholder')}
                    value={searchValue}
                    onChange={e => onSearchValueChange(e.target.value)}
                    onPressEnter={onSearch}
                    enterButton
                    onSearch={onSearch}
                    style={{
                        minWidth: screens.xs ? 180 : 240,
                        flex: 1,
                        maxWidth: screens.xs ? '100%' : 'none',
                    }}
                    disabled={disabled}
                />
                <Select
                    value={sortKey}
                    onChange={v => onSortKeyChange(v as SortKey)}
                    options={displayOptions.map(o => ({ label: o.label, value: o.key }))}
                    size={'middle'}
                    style={{ width: 120, flexShrink: 0 }}
                    disabled={disabled}
                />
            </div>
            <div style={{ overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
                <Tabs
                    activeKey={activeCategory}
                    onChange={onActiveCategoryChange}
                    items={tabItems}
                    size={screens.xs ? 'small' : 'middle'}
                />
            </div>
        </Space>
    );
}

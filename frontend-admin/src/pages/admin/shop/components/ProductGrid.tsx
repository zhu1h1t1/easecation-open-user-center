import React from 'react';
import type { Product } from '@ecuc/shared/types/item.types';

type ProductGridProps = {
    readonly products: Product[];
    readonly screens: any;
    readonly renderItem: (product: Product, index: number) => React.ReactNode;
};

export default function ProductGrid({ products, screens, renderItem }: ProductGridProps) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: screens.xs
                    ? 'repeat(auto-fit, minmax(260px, 1fr))'
                    : 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: screens.xs ? 12 : 16,
                width: '100%',
                maxWidth: '100%',
                overflow: 'visible',
                padding: screens.xs ? '0 4px' : 0,
            }}
        >
            {products.map((product, index) => renderItem(product, index))}
        </div>
    );
}

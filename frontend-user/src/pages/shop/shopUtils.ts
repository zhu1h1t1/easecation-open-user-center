import type { Product } from '@ecuc/shared/types/item.types';

export function parseProductJSON(product: Product) {
    if (!product.json) return { category: '', itemId: '' };
    let parsedData: any;
    try {
        parsedData = JSON.parse(product.json);
    } catch {
        return { category: '', itemId: '' };
    }
    if (Array.isArray(parsedData) && parsedData.length > 0) {
        const firstItem = parsedData[0];
        return {
            category: firstItem.category || '',
            itemId: firstItem.idItem || '',
        };
    } else if (typeof parsedData === 'object' && parsedData !== null) {
        return {
            category: parsedData.category || '',
            itemId: parsedData.idItem || '',
        };
    }
    return { category: '', itemId: '' };
}

export function getUniqueCategories(products: Product[]) {
    const categories = new Set<string>();
    products.forEach(product => {
        const { category } = parseProductJSON(product);
        if (category) categories.add(category);
    });
    return Array.from(categories);
}

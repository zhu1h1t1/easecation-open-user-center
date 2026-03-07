import type { AddFormValues } from '../ShopAdmin';
import ProductFormModal from './ProductFormModal';

interface AddProductModalProps {
    readonly open: boolean;
    readonly onCancel: () => void;
    readonly onOk: (values: AddFormValues) => void;
    readonly confirmLoading: boolean;
}

export default function AddProductModal({
    open,
    onCancel,
    onOk,
    confirmLoading,
}: AddProductModalProps) {
    return (
        <ProductFormModal
            open={open}
            onCancel={onCancel}
            onSubmit={onOk as any}
            confirmLoading={confirmLoading}
            mode={'add'}
            initialValues={{}}
        />
    );
}

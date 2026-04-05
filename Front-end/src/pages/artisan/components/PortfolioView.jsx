import React, { useState, useEffect, useCallback } from 'react';
import productService from '../../../services/productService';
import { appToast } from '../../../lib/appToast';
import './PortfolioView.css';

const PortfolioView = ({ user }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const artisanId = user?.id || user?.artisanId || user?.artisanUuid;

    const fetchProducts = useCallback(async () => {
        const result = await productService.getProducts();
        if (result.success && Array.isArray(result.data)) {
            const list = artisanId
                ? result.data.filter((p) => p.artisanId === artisanId)
                : result.data;
            setProducts(list);
        } else {
            setProducts([]);
        }
        setLoading(false);
    }, [artisanId]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);
    const [form, setForm] = useState({
        productName: '',
        productPrice: '',
        productDescription: '',
        size: '',
        material: '',
        quantity: 0,
        image: null, // File (single image)
    });

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const productName = (form.productName || '').trim();
        const productPrice = Number(form.productPrice);
        const quantity = Math.floor(Number(form.quantity));

        if (!productName) {
            appToast.warning('Thiếu thông tin', 'Vui lòng nhập tên sản phẩm');
            return;
        }
        if (isNaN(productPrice) || productPrice < 0) {
            appToast.warning('Thiếu thông tin', 'Giá sản phẩm không hợp lệ (≥ 0)');
            return;
        }
        if (isNaN(quantity) || quantity < 0) {
            appToast.warning('Thiếu thông tin', 'Số lượng không hợp lệ (số nguyên ≥ 0)');
            return;
        }

        const payload = {
            productName,
            productPrice,
            productDescription: (form.productDescription || '').trim() || undefined,
            size: (form.size || '').trim() || undefined,
            material: (form.material || '').trim() || undefined,
            quantity,
            image: form.image instanceof File ? form.image : undefined,
        };

        setSubmitting(true);
        try {
            const result = await productService.createProduct(payload);
            if (result.success) {
                appToast.success('Tạo thành công', `Đã thêm ${productName} vào hệ thống`);
                setForm({
                    productName: '',
                    productPrice: '',
                    productDescription: '',
                    size: '',
                    material: '',
                    quantity: 0,
                    image: null,
                });
                setShowForm(false);
                fetchProducts();
            } else {
                const msg = result.error != null ? String(result.error) : 'Vui lòng thử lại';
                appToast.error('Có lỗi xảy ra', msg);
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ??
                err.response?.data?.error ??
                err.message ??
                'Vui lòng thử lại';
            appToast.error('Có lỗi xảy ra', typeof msg === 'string' ? msg : 'Vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditForm = (product) => {
        setShowForm(false);
        setEditingProduct({
            productId: product.productId,
            productName: product.productName ?? '',
            productPrice: product.productPrice ?? '',
            productDescription: product.productDescription ?? '',
            size: product.size ?? '',
            material: product.material ?? '',
            quantity: product.quantity ?? 0,
            productImages: (product.images || product.productImages || []).map((img) => ({
                id: img.id ?? img.imageId,
                image_url: img.image_url ?? img.imageUrl ?? img.image,
                publicId: img.publicId ?? '',
            })),
            deletedImageIds: [],
            newImageItems: [], // { file: File, preview: string } | { file: null, preview: string } (URL)
        });
    };

    const closeEditForm = () => {
        editingProduct?.newImageItems?.forEach((item) => {
            if (item.file && item.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
        });
        setEditingProduct(null);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingProduct || !artisanId) return;

        const productName = (editingProduct.productName || '').trim();
        const productPrice = Number(editingProduct.productPrice);
        const quantity = Math.floor(Number(editingProduct.quantity));

        if (!productName) {
            appToast.warning('Thiếu thông tin', 'Vui lòng nhập tên sản phẩm');
            return;
        }
        if (isNaN(productPrice) || productPrice < 0) {
            appToast.warning('Thiếu thông tin', 'Giá sản phẩm không hợp lệ (≥ 0)');
            return;
        }
        if (isNaN(quantity) || quantity < 0) {
            appToast.warning('Thiếu thông tin', 'Số lượng không hợp lệ (số nguyên ≥ 0)');
            return;
        }

        const productId = editingProduct.productId;
        const productPayload = {
            productName,
            productDescription: (editingProduct.productDescription || '').trim() || undefined,
            productPrice,
            quantity,
            material: (editingProduct.material || '').trim() || undefined,
            size: (editingProduct.size || '').trim() || undefined,
        };

        const deleteImageIds = editingProduct.deletedImageIds || [];
        const newImageItems = editingProduct.newImageItems || [];
        const newImageStrings = (await Promise.all(
            newImageItems.map((item) => {
                if (item.file instanceof File) {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result || '');
                        reader.onerror = () => reject(reader.error);
                        reader.readAsDataURL(item.file);
                    });
                }
                return Promise.resolve(item.preview && item.preview.startsWith('http') ? item.preview : '');
            })
        )).filter(Boolean);
        const hasImageChanges = deleteImageIds.length > 0 || newImageStrings.length > 0;

        setSubmitting(true);
        try {
            const resultProduct = await productService.updateProduct(productId, productPayload);
            if (!resultProduct.success) {
                const msg = resultProduct.error != null ? String(resultProduct.error) : 'Vui lòng thử lại';
                appToast.error('Có lỗi xảy ra', msg);
                return;
            }
            if (hasImageChanges) {
                const resultImages = await productService.updateProductImages(productId, {
                    deleteImageIds,
                    newImages: newImageStrings,
                });
                if (!resultImages.success) {
                    const msg = resultImages.error != null ? String(resultImages.error) : 'Vui lòng thử lại';
                    appToast.error('Có lỗi xảy ra', msg);
                    return;
                }
            }
            appToast.success('Đã cập nhật', 'Thông tin đã được lưu');
            closeEditForm();
            fetchProducts();
        } catch (err) {
            const msg =
                err.response?.data?.message ??
                err.response?.data?.error ??
                err.message ??
                'Vui lòng thử lại';
            appToast.error('Có lỗi xảy ra', typeof msg === 'string' ? msg : 'Vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    };

    const updateEditField = (field, value) => {
        setEditingProduct((prev) => (prev ? { ...prev, [field]: value } : null));
    };

    const markImageForDeletion = (imageId) => {
        if (!editingProduct || !imageId) return;
        setEditingProduct((prev) =>
            prev
                ? {
                      ...prev,
                      deletedImageIds: [...(prev.deletedImageIds || []), imageId],
                  }
                : null
        );
    };

    const unmarkImageForDeletion = (imageId) => {
        if (!editingProduct) return;
        setEditingProduct((prev) =>
            prev
                ? {
                      ...prev,
                      deletedImageIds: (prev.deletedImageIds || []).filter((id) => id !== imageId),
                  }
                : null
        );
    };

    const addNewImageUrl = (url) => {
        const trimmed = (url || '').trim();
        if (!trimmed || !editingProduct) return;
        setEditingProduct((prev) =>
            prev
                ? { ...prev, newImageItems: [...(prev.newImageItems || []), { file: null, preview: trimmed }] }
                : null
        );
    };

    const addNewImageFile = (file) => {
        if (!file || !file.type.startsWith('image/') || !editingProduct) return;
        const preview = URL.createObjectURL(file);
        setEditingProduct((prev) =>
            prev ? { ...prev, newImageItems: [...(prev.newImageItems || []), { file, preview }] } : null
        );
    };

    const removeNewImage = (index) => {
        if (!editingProduct) return;
        setEditingProduct((prev) => {
            const list = [...(prev.newImageItems || [])];
            const removed = list[index];
            if (removed?.preview?.startsWith('blob:')) URL.revokeObjectURL(removed.preview);
            list.splice(index, 1);
            return { ...prev, newImageItems: list };
        });
    };

    const closeDeleteModal = () => {
        setProductToDelete(null);
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete?.productId) return;
        const name = productToDelete.productName || 'Sản phẩm';
        setDeleteLoading(true);
        try {
            const result = await productService.deleteProduct(productToDelete.productId);
            if (result.success) {
                setProducts((prev) => prev.filter((p) => p.productId !== productToDelete.productId));
                appToast.success('Đã xóa', `${name} đã được xóa`);
                closeDeleteModal();
            } else {
                const msg = result.error != null ? String(result.error) : 'Vui lòng thử lại';
                appToast.error('Có lỗi xảy ra', msg);
            }
        } catch (err) {
            const msg = err?.message ?? 'Vui lòng thử lại';
            appToast.error('Có lỗi xảy ra', msg);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="portfolio-view">
            <header className="portfolio-header">
                <div className="header-left">
                    <h1 className="portfolio-title">Portfolio / Sản phẩm</h1>
                    <p className="portfolio-subtitle">Quản lý và thêm sản phẩm của bạn.</p>
                </div>
                <div className="header-right">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                            setShowForm(!showForm);
                            setEditingProduct(null);
                        }}
                    >
                        {showForm ? 'Đóng form' : '+ Thêm sản phẩm'}
                    </button>
                </div>
            </header>

            {editingProduct && (
                <div className="edit-modal-overlay" onClick={closeEditForm}>
                    <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="edit-modal-close"
                            onClick={closeEditForm}
                            aria-label="Đóng"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <div className="edit-modal-body">
                            <div className="edit-modal-image edit-modal-images-section">
                                <span className="edit-modal-images-label">Ảnh sản phẩm</span>
                                <div className="edit-modal-images-list">
                                    {editingProduct.productImages
                                        ?.filter((img) => !(editingProduct.deletedImageIds || []).includes(img.id))
                                        .map((img) => (
                                            <div key={img.id} className="edit-modal-image-item">
                                                <img
                                                    src={img.image_url || img.imageUrl}
                                                    alt=""
                                                />
                                                <button
                                                    type="button"
                                                    className="edit-modal-image-remove"
                                                    onClick={() => markImageForDeletion(img.id)}
                                                    title="Gỡ ảnh (sẽ xóa khi lưu)"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    {(editingProduct.newImageItems || []).map((item, idx) => (
                                        <div key={`new-${idx}`} className="edit-modal-image-item edit-modal-image-item-new">
                                            <img src={item.preview} alt="" />
                                            {!item.file && (
                                                <span className="edit-modal-image-url-hint" title="Ảnh từ URL không gửi lên server (chỉ ảnh chọn từ máy mới được upload)">
                                                    URL
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                className="edit-modal-image-remove"
                                                onClick={() => removeNewImage(idx)}
                                                title="Bỏ ảnh"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {(editingProduct.deletedImageIds || []).length > 0 && (
                                    <div className="edit-modal-deleted-hint">
                                        {editingProduct.deletedImageIds.length} ảnh sẽ bị xóa khi lưu.
                                    </div>
                                )}
                                <div className="edit-modal-add-images">
                                    <label className="form-label">Thêm ảnh mới</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-input"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) addNewImageFile(f);
                                            e.target.value = '';
                                        }}
                                    />
                                    <input
                                        type="url"
                                        className="form-input edit-modal-url-input"
                                        placeholder="Hoặc dán URL ảnh"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addNewImageUrl(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        onBlur={(e) => {
                                            if (e.target.value.trim()) {
                                                addNewImageUrl(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </div>
                                {(!editingProduct.productImages?.length || editingProduct.productImages.every((img) => (editingProduct.deletedImageIds || []).includes(img.id))) &&
                                (!editingProduct.newImageItems || editingProduct.newImageItems.length === 0) ? (
                                    <div className="edit-modal-image-placeholder">Chưa có ảnh — chọn file hoặc dán URL để thêm (chỉ ảnh chọn từ máy mới được upload)</div>
                                ) : null}
                            </div>
                            <div className="edit-modal-form">
                                <form onSubmit={handleEditSubmit}>
                                    <h3 className="portfolio-form-title">Chỉnh sửa sản phẩm</h3>
                                    <div className="form-group">
                                        <label className="form-label">Tên sản phẩm <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            value={editingProduct.productName}
                                            onChange={(e) => updateEditField('productName', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Giá (VNĐ) <span className="required">*</span></label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                className="form-input"
                                                value={editingProduct.productPrice === '' ? '' : editingProduct.productPrice}
                                                onChange={(e) => updateEditField('productPrice', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Số lượng <span className="required">*</span></label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="form-input"
                                                value={editingProduct.quantity === '' ? '' : editingProduct.quantity}
                                                onChange={(e) => updateEditField('quantity', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Mô tả</label>
                                        <textarea
                                            className="form-textarea"
                                            rows={4}
                                            value={editingProduct.productDescription}
                                            onChange={(e) => updateEditField('productDescription', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Kích thước</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="VD: 50cm"
                                                value={editingProduct.size}
                                                onChange={(e) => updateEditField('size', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Chất liệu</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="VD: Gỗ olive"
                                                value={editingProduct.material}
                                                onChange={(e) => updateEditField('material', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="btn-outline" onClick={closeEditForm}>
                                            Hủy
                                        </button>
                                        <button type="submit" className="btn-primary" disabled={submitting}>
                                            {submitting ? 'Đang cập nhật...' : 'Cập nhật sản phẩm'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <form className="portfolio-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Tên sản phẩm <span className="required">*</span></label>
                        <input
                            type="text"
                            className="form-input"
                            required
                            value={form.productName}
                            onChange={(e) => updateField('productName', e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Giá (VNĐ) <span className="required">*</span></label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                className="form-input"
                                value={form.productPrice === '' ? '' : form.productPrice}
                                onChange={(e) => updateField('productPrice', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Số lượng <span className="required">*</span></label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                className="form-input"
                                value={form.quantity === '' ? '' : form.quantity}
                                onChange={(e) => updateField('quantity', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mô tả</label>
                        <textarea
                            className="form-textarea"
                            rows={4}
                            value={form.productDescription}
                            onChange={(e) => updateField('productDescription', e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Kích thước</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="VD: 50cm"
                                value={form.size}
                                onChange={(e) => updateField('size', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Chất liệu</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="VD: Gỗ olive"
                                value={form.material}
                                onChange={(e) => updateField('material', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Ảnh sản phẩm (upload lên Cloudinary)</label>
                        <input
                            type="file"
                            className="form-input"
                            accept="image/*"
                            onChange={(e) => updateField('image', e.target.files?.[0] ?? null)}
                        />
                        {form.image && (
                            <span className="form-hint">{form.image.name}</span>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>
                            Hủy
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? 'Đang gửi...' : 'Thêm sản phẩm'}
                        </button>
                    </div>
                </form>
            )}

            <section className="portfolio-products">
                <h2 className="portfolio-products-title">Danh sách sản phẩm ({products.length})</h2>
                {loading ? (
                    <p className="portfolio-loading">Đang tải...</p>
                ) : products.length === 0 ? (
                    <p className="portfolio-empty">Chưa có sản phẩm nào.</p>
                ) : (
                    <div className="portfolio-products-grid">
                        {products.map((p) => (
                            <div key={p.productId} className="portfolio-product-card">
                                <div className="portfolio-product-image">
                                    {p.images && p.images.length > 0 ? (
                                        <img
                                            src={p.images[0].imageUrl}
                                            alt={p.productName}
                                        />
                                    ) : (
                                        <div className="portfolio-product-placeholder">Không có ảnh</div>
                                    )}
                                </div>
                                <div className="portfolio-product-info">
                                    <h3 className="portfolio-product-name">{p.productName}</h3>
                                    <p className="portfolio-product-price">
                                        {typeof p.productPrice === 'number'
                                            ? p.productPrice.toLocaleString('vi-VN')
                                            : p.productPrice}{' '}
                                        VNĐ
                                    </p>
                                    {p.productDescription && (
                                        <p className="portfolio-product-desc">{p.productDescription}</p>
                                    )}
                                    <div className="portfolio-product-meta">
                                        {p.material && <span>Chất liệu: {p.material}</span>}
                                        {p.size && <span>Kích thước: {p.size}</span>}
                                        <span>Số lượng: {p.quantity ?? 0}</span>
                                        <span className={`portfolio-product-status status-${(p.status || '').toLowerCase()}`}>
                                            {p.status || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="portfolio-product-actions">
                                        <button
                                            type="button"
                                            className="btn-edit"
                                            onClick={() => openEditForm(p)}
                                            title="Chỉnh sửa"
                                        >
                                            Chỉnh sửa
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-delete"
                                            onClick={() => setProductToDelete(p)}
                                            title="Xóa sản phẩm"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {productToDelete && (
                <div className="delete-confirm-overlay" onClick={closeDeleteModal} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
                    <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 id="delete-confirm-title" className="delete-confirm-title">Xác nhận xóa</h3>
                        <p className="delete-confirm-text">
                            Bạn có chắc chắn muốn xóa sản phẩm <strong>{productToDelete.productName}</strong>? Hành động này không thể hoàn tác.
                        </p>
                        <div className="delete-confirm-actions">
                            <button
                                type="button"
                                className="btn-outline"
                                onClick={closeDeleteModal}
                                disabled={deleteLoading}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn-danger"
                                onClick={handleDeleteProduct}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Đang xóa...' : 'Xóa sản phẩm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioView;

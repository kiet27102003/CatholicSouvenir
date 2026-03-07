import React, { useState, useEffect, useCallback } from 'react';
import productService from '../../../services/productService';
import './PortfolioView.css';

const PortfolioView = ({ user }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

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
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        const productName = (form.productName || '').trim();
        const productPrice = Number(form.productPrice);
        const quantity = Math.floor(Number(form.quantity));

        if (!productName) {
            setMessage({ type: 'error', text: 'Vui lòng nhập tên sản phẩm.' });
            return;
        }
        if (isNaN(productPrice) || productPrice < 0) {
            setMessage({ type: 'error', text: 'Giá sản phẩm không hợp lệ (≥ 0).' });
            return;
        }
        if (isNaN(quantity) || quantity < 0) {
            setMessage({ type: 'error', text: 'Số lượng không hợp lệ (số nguyên ≥ 0).' });
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
                setMessage({ type: 'success', text: 'Thêm sản phẩm thành công.' });
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
                setMessage({ type: 'error', text: result.error ?? 'Không thể thêm sản phẩm.' });
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ??
                err.response?.data?.error ??
                err.message ??
                'Không thể thêm sản phẩm. Vui lòng thử lại.';
            setMessage({ type: 'error', text: msg });
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
        });
        setMessage({ type: '', text: '' });
    };

    const closeEditForm = () => {
        setEditingProduct(null);
        setMessage({ type: '', text: '' });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingProduct || !artisanId) return;
        setMessage({ type: '', text: '' });

        const productName = (editingProduct.productName || '').trim();
        const productPrice = Number(editingProduct.productPrice);
        const quantity = Math.floor(Number(editingProduct.quantity));

        if (!productName) {
            setMessage({ type: 'error', text: 'Vui lòng nhập tên sản phẩm.' });
            return;
        }
        if (isNaN(productPrice) || productPrice < 0) {
            setMessage({ type: 'error', text: 'Giá sản phẩm không hợp lệ (≥ 0).' });
            return;
        }
        if (isNaN(quantity) || quantity < 0) {
            setMessage({ type: 'error', text: 'Số lượng không hợp lệ (số nguyên ≥ 0).' });
            return;
        }

        const payload = {
            artisanId,
            productName,
            productPrice,
            productDescription: (editingProduct.productDescription || '').trim() || undefined,
            size: (editingProduct.size || '').trim() || undefined,
            material: (editingProduct.material || '').trim() || undefined,
            quantity,
            productImages: editingProduct.productImages || [],
        };

        setSubmitting(true);
        try {
            const result = await productService.updateProduct(editingProduct.productId, payload);
            if (result.success) {
                setMessage({ type: 'success', text: 'Cập nhật sản phẩm thành công.' });
                closeEditForm();
                fetchProducts();
            } else {
                setMessage({ type: 'error', text: result.error ?? 'Không thể cập nhật sản phẩm.' });
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ??
                err.response?.data?.error ??
                err.message ??
                'Không thể cập nhật sản phẩm. Vui lòng thử lại.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const updateEditField = (field, value) => {
        setEditingProduct((prev) => (prev ? { ...prev, [field]: value } : null));
        setMessage({ type: '', text: '' });
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
                            setMessage({ type: '', text: '' });
                        }}
                    >
                        {showForm ? 'Đóng form' : '+ Thêm sản phẩm'}
                    </button>
                </div>
            </header>

            {message.text && (
                <div className={`portfolio-message ${message.type}`}>
                    {message.text}
                </div>
            )}

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
                            <div className="edit-modal-image">
                                {editingProduct.productImages && editingProduct.productImages.length > 0 ? (
                                    <img
                                        src={editingProduct.productImages[0].image_url || editingProduct.productImages[0].imageUrl}
                                        alt={editingProduct.productName}
                                    />
                                ) : (
                                    <div className="edit-modal-image-placeholder">Không có ảnh</div>
                                )}
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
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default PortfolioView;

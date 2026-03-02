import React, { useState } from 'react';
import productService from '../../../services/productService';
import './PortfolioView.css';

const PortfolioView = ({ user }) => {
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [form, setForm] = useState({
        artisanId: user?.artisanId || user?.artisanUuid || '',
        productName: '',
        productPrice: '',
        productDescription: '',
        size: '',
        material: '',
        quantity: '',
        status: true,
        imageUrls: [''],
    });

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setMessage({ type: '', text: '' });
    };

    const addImageUrl = () => {
        setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
    };

    const removeImageUrl = (index) => {
        setForm((prev) => ({
            ...prev,
            imageUrls: prev.imageUrls.filter((_, i) => i !== index),
        }));
    };

    const setImageUrlAt = (index, value) => {
        setForm((prev) => ({
            ...prev,
            imageUrls: prev.imageUrls.map((url, i) => (i === index ? value : url)),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        const artisanId = (form.artisanId || '').trim();
        const productName = (form.productName || '').trim();
        const productPrice = Number(form.productPrice);
        const quantity = Number(form.quantity);

        if (!productName) {
            setMessage({ type: 'error', text: 'Vui lòng nhập tên sản phẩm.' });
            return;
        }
        if (isNaN(productPrice) || productPrice < 0) {
            setMessage({ type: 'error', text: 'Giá sản phẩm không hợp lệ.' });
            return;
        }
        if (isNaN(quantity) || quantity < 0) {
            setMessage({ type: 'error', text: 'Số lượng không hợp lệ.' });
            return;
        }

        const productImages = form.imageUrls
            .map((url) => (url || '').trim())
            .filter(Boolean)
            .map((image_url) => ({ image_url }));

        const payload = {
            artisanId: artisanId || undefined,
            productName,
            productPrice,
            productDescription: (form.productDescription || '').trim() || undefined,
            size: (form.size || '').trim() || undefined,
            material: (form.material || '').trim() || undefined,
            quantity,
            status: Boolean(form.status),
        };
        if (productImages.length > 0) {
            payload.productImages = productImages;
        }

        setSubmitting(true);
        try {
            await productService.createProduct(payload);
            setMessage({ type: 'success', text: 'Thêm sản phẩm thành công.' });
            setForm((prev) => ({
                ...prev,
                productName: '',
                productPrice: '',
                productDescription: '',
                size: '',
                material: '',
                quantity: '',
                status: true,
                imageUrls: [''],
            }));
            setShowForm(false);
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

            {showForm && (
                <form className="portfolio-form" onSubmit={handleSubmit}>
                    {!(user?.artisanId || user?.artisanUuid) && (
                        <div className="form-group">
                            <label className="form-label">Artisan ID (UUID)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
                                value={form.artisanId}
                                onChange={(e) => updateField('artisanId', e.target.value)}
                            />
                            <span className="form-hint">Nếu backend lấy artisan từ token có thể để trống.</span>
                        </div>
                    )}

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
                            <label className="form-label">Giá (VNĐ hoặc đơn vị)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-input"
                                value={form.productPrice}
                                onChange={(e) => updateField('productPrice', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Số lượng</label>
                            <input
                                type="number"
                                min="0"
                                className="form-input"
                                value={form.quantity}
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
                                placeholder="VD: 15x20 cm"
                                value={form.size}
                                onChange={(e) => updateField('size', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Chất liệu</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="VD: Gỗ, đồng"
                                value={form.material}
                                onChange={(e) => updateField('material', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group form-group-checkbox">
                        <label className="form-label-inline">
                            <input
                                type="checkbox"
                                checked={form.status}
                                onChange={(e) => updateField('status', e.target.checked)}
                            />
                            <span>Sản phẩm đang bán (status)</span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="form-label">URL ảnh sản phẩm</label>
                        {form.imageUrls.map((url, index) => (
                            <div key={index} className="image-url-row">
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="https://..."
                                    value={url}
                                    onChange={(e) => setImageUrlAt(index, e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn-remove-url"
                                    onClick={() => removeImageUrl(index)}
                                    disabled={form.imageUrls.length <= 1}
                                    title="Xóa dòng"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button type="button" className="btn-secondary btn-add-url" onClick={addImageUrl}>
                            + Thêm URL ảnh
                        </button>
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
        </div>
    );
};

export default PortfolioView;

import React, { useState, useEffect, useCallback } from 'react';
import productService from '../../../services/productService';
import api from '../../../cofig/api';
import { appToast } from '../../../lib/appToast';
import { FiSparkles } from 'react-icons/fi';
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

    const [categories, setCategories] = useState([]);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [categoryLoadError, setCategoryLoadError] = useState('');

    const [form, setForm] = useState({
        productName: '',
        productPrice: '',
        productDescription: '',
        size: '',
        categoryId: '',
        quantity: 0,
        tags: [''],
        images: [],
    });
    const [formErrors, setFormErrors] = useState({});
    const [aiDescriptionLoading, setAiDescriptionLoading] = useState(false);
    const [editingAiDescriptionLoading, setEditingAiDescriptionLoading] = useState(false);
    const createDescriptionCount = (form.productDescription || '').length;
    const editDescriptionCount = (editingProduct?.productDescription || '').length;

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const clearCreateImages = useCallback((images) => {
        (images || []).forEach((item) => {
            if (item?.preview && item.preview.startsWith('blob:')) {
                URL.revokeObjectURL(item.preview);
            }
        });
    }, []);

    const parseCategoryLabel = useCallback((categoryId) => {
        const found = categories.find((item) => item.id === categoryId);
        return found?.name || '';
    }, [categories]);

    const generateDescription = useCallback(async ({ isEdit = false } = {}) => {
        const target = isEdit ? editingProduct : form;
        const setLoading = isEdit ? setEditingAiDescriptionLoading : setAiDescriptionLoading;
        if (!target?.productName?.trim()) {
            appToast.warning('Thiếu thông tin', 'Vui lòng nhập tên sản phẩm trước khi tạo mô tả.');
            return;
        }

        setLoading(true);
        try {
            const tagsValue = Array.isArray(target.tags)
                ? target.tags.map((tag) => (tag || '').trim()).filter(Boolean).join(', ')
                : '';
            const result = await productService.generateProductDescription({
                productName: target.productName,
                category: parseCategoryLabel(target.categoryId),
                tags: tagsValue,
                existingDescription: target.productDescription,
            });

            if (result.success) {
                const description = result.data?.description || '';
                if (isEdit) {
                    updateEditField('productDescription', description);
                } else {
                    updateField('productDescription', description);
                }
                appToast.success('Đã tạo mô tả', result.data?.message || 'Mô tả sản phẩm đã được tạo.');
            } else {
                appToast.error('Không tạo được mô tả', result.error || 'Vui lòng thử lại');
            }
        } catch (err) {
            appToast.error('Không tạo được mô tả', err?.message || 'Vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    }, [editingProduct, form, parseCategoryLabel]);

    const resetCreateForm = useCallback(() => {
        setForm((prev) => {
            clearCreateImages(prev.images);
            return {
                productName: '',
                productPrice: '',
                productDescription: '',
                size: '',
                categoryId: '',
                quantity: 0,
                tags: [''],
                images: [],
            };
        });
        setFormErrors({});
    }, [clearCreateImages]);

    const closeCreateForm = useCallback(() => {
        resetCreateForm();
        setShowForm(false);
    }, [resetCreateForm]);

    const fetchCategories = useCallback(async () => {
        setCategoryLoading(true);
        setCategoryLoadError('');
        try {
            const response = await api.get('/categories');
            const res = response?.data;
            const rawList = Array.isArray(res)
                ? res
                : Array.isArray(res?.data)
                    ? res.data
                    : Array.isArray(res?.data?.content)
                        ? res.data.content
                        : Array.isArray(res?.content)
                            ? res.content
                            : [];

            const normalized = rawList
                .map((item) => ({
                    id: item?.id || item?.categoryId || item?.uuid || '',
                    name: item?.name || item?.categoryName || item?.title || '',
                    isActive: item?.isActive !== false,
                    sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : 0,
                }))
                .filter((item) => item.id && item.name && item.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder);

            setCategories(normalized);
        } catch {
            setCategories([]);
            setCategoryLoadError('Không tải được danh mục');
        } finally {
            setCategoryLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const productName = (form.productName || '').trim();
        const productPrice = Number(form.productPrice);
        const quantityRaw = Number(form.quantity);
        const quantity = Math.floor(quantityRaw);
        const nextErrors = {};

        if (!productName) {
            nextErrors.productName = 'Tên sản phẩm không được để trống';
        }
        if (Number.isNaN(productPrice) || productPrice < 0) {
            nextErrors.productPrice = 'Giá phải là số và >= 0';
        }
        if (Number.isNaN(quantityRaw) || quantityRaw < 0 || !Number.isInteger(quantityRaw)) {
            nextErrors.quantity = 'Số lượng phải là số nguyên >= 0';
        }

        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const normalizedTags = (form.tags || [])
            .map((tag) => (tag || '').trim())
            .filter(Boolean);
        const imageFiles = (form.images || [])
            .map((item) => item?.file)
            .filter((f) => f instanceof File);

        const payload = {
            productName,
            productPrice,
            quantity,
            productDescription: (form.productDescription || '').trim() || undefined,
            size: (form.size || '').trim() || undefined,
            categoryId: (form.categoryId || '').trim() || undefined,
            tags: normalizedTags.length > 0 ? normalizedTags : undefined,
            images: imageFiles.length > 0 ? imageFiles : undefined,
        };

        setSubmitting(true);
        try {
            const result = await productService.createProduct(payload);
            if (result.success) {
                appToast.success('Tạo sản phẩm thành công');
                resetCreateForm();
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
            categoryId: product.categoryId ?? product.category?.id ?? '',
            tags: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags : [''],
            quantity: product.quantity ?? 0,
            productImages: (product.images || product.productImages || []).map((img) => ({
                id: img.id ?? img.imageId,
                image_url: img.image_url ?? img.imageUrl ?? img.image,
                publicId: img.publicId ?? '',
            })),
            deletedImageIds: [],
            newImageItems: [],
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
        const quantityRaw = Number(editingProduct.quantity);
        const quantity = Math.floor(quantityRaw);

        if (!productName) {
            appToast.warning('Thiếu thông tin', 'Tên sản phẩm không được để trống');
            return;
        }
        if (Number.isNaN(productPrice) || productPrice < 0) {
            appToast.warning('Thiếu thông tin', 'Giá phải là số và >= 0');
            return;
        }
        if (Number.isNaN(quantityRaw) || quantityRaw < 0 || !Number.isInteger(quantityRaw)) {
            appToast.warning('Thiếu thông tin', 'Số lượng phải là số nguyên >= 0');
            return;
        }

        const productId = editingProduct.productId;
        const normalizedTags = (editingProduct.tags || []).map((tag) => (tag || '').trim()).filter(Boolean);
        const productPayload = {
            productName,
            productDescription: (editingProduct.productDescription || '').trim() || undefined,
            productPrice,
            quantity,
            size: (editingProduct.size || '').trim() || undefined,
            categoryId: (editingProduct.categoryId || '').trim() || undefined,
            tags: normalizedTags.length > 0 ? normalizedTags : undefined,
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

        setSubmitting(true);
        try {
            const resultProduct = await productService.updateProduct(productId, {
                ...productPayload,
                deleteImageIds,
                newImages: newImageStrings,
            });
            if (!resultProduct.success) {
                const msg = resultProduct.error != null ? String(resultProduct.error) : 'Vui lòng thử lại';
                appToast.error('Có lỗi xảy ra', msg);
                return;
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

    const addEditTagField = () => {
        setEditingProduct((prev) => (prev ? { ...prev, tags: [...(prev.tags || []), ''] } : null));
    };

    const updateEditTagField = (index, value) => {
        setEditingProduct((prev) => {
            if (!prev) return null;
            const tags = [...(prev.tags || [])];
            tags[index] = value;
            return { ...prev, tags };
        });
    };

    const removeEditTagField = (index) => {
        setEditingProduct((prev) => {
            if (!prev) return null;
            const tags = [...(prev.tags || [])];
            tags.splice(index, 1);
            return { ...prev, tags: tags.length > 0 ? tags : [''] };
        });
    };

    const addTagField = () => {
        setForm((prev) => ({ ...prev, tags: [...(prev.tags || []), ''] }));
    };

    const updateTagField = (index, value) => {
        setForm((prev) => {
            const tags = [...(prev.tags || [])];
            tags[index] = value;
            return { ...prev, tags };
        });
    };

    const removeTagField = (index) => {
        setForm((prev) => {
            const tags = [...(prev.tags || [])];
            tags.splice(index, 1);
            return { ...prev, tags: tags.length > 0 ? tags : [''] };
        });
    };

    const addCreateImages = (fileList) => {
        const files = Array.from(fileList || []).filter((file) => file?.type?.startsWith('image/'));
        if (files.length === 0) return;
        const newItems = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
        setForm((prev) => ({ ...prev, images: [...(prev.images || []), ...newItems] }));
    };

    const removeCreateImage = (index) => {
        setForm((prev) => {
            const images = [...(prev.images || [])];
            const removed = images[index];
            if (removed?.preview?.startsWith('blob:')) {
                URL.revokeObjectURL(removed.preview);
            }
            images.splice(index, 1);
            return { ...prev, images };
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
                    <h1 className="portfolio-title">Quản lí sản phẩm</h1>
                    <p className="portfolio-subtitle">Quản lý và thêm sản phẩm của bạn.</p>
                </div>
                <div className="header-right">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                            setEditingProduct(null);
                            setShowForm(true);
                        }}
                    >
                        + Thêm sản phẩm
                    </button>
                </div>
            </header>

            {editingProduct && (
                <div className="edit-modal-overlay" onClick={closeEditForm} role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
                    <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="edit-modal-close"
                            onClick={closeEditForm}
                            aria-label="Đóng"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="edit-modal-body">
                            <aside className="edit-modal-preview-panel">
                                <div className="create-preview-card">
                                    <div className="create-preview-cover">
                                        {(() => {
                                            const visibleImages = editingProduct.productImages
                                                ?.filter((img) => !(editingProduct.deletedImageIds || []).includes(img.id)) || [];
                                            const cover = visibleImages[0]?.image_url || visibleImages[0]?.imageUrl || visibleImages[0]?.image || editingProduct.newImageItems?.[0]?.preview;
                                            return cover ? (
                                                <img src={cover} alt={editingProduct.productName || 'Ảnh sản phẩm'} />
                                            ) : (
                                                <div className="create-preview-empty">
                                                    <span>Chưa có ảnh</span>
                                                    <small>Chọn ảnh để nhìn thấy preview ở đây</small>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="create-preview-content">
                                        <div className="create-preview-line create-preview-line--name">
                                            {editingProduct.productName || 'Tên sản phẩm sẽ hiển thị ở đây'}
                                        </div>
                                        <div className="create-preview-line create-preview-line--price">
                                            {editingProduct.productPrice ? Number(editingProduct.productPrice).toLocaleString('vi-VN') : '0'} VNĐ
                                        </div>
                                        <div className="create-preview-meta">
                                            <span>{editingProduct.size?.trim() || 'Kích thước'}</span>
                                            <span>{editingProduct.quantity !== '' ? editingProduct.quantity : 0} tồn kho</span>
                                        </div>
                                        <div className="create-preview-tags">
                                            {(editingProduct.tags || [])
                                                .map((tag) => (tag || '').trim())
                                                .filter(Boolean)
                                                .slice(0, 4)
                                                .map((tag) => (
                                                    <span key={tag}>{tag}</span>
                                                ))}
                                            {!(editingProduct.tags || []).some((tag) => (tag || '').trim()) && <span>Tag mẫu</span>}
                                        </div>
                                    </div>
                                </div>

                            </aside>

                            <div className="edit-modal-form-panel">
                                <form onSubmit={handleEditSubmit} className="create-modal-form edit-modal-form">
                                    <div className="create-form-section">
                                        <div className="form-group form-group--full">
                                            <label className="form-label">Tên sản phẩm <span className="required">*</span></label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                required
                                                value={editingProduct.productName}
                                                onChange={(e) => updateEditField('productName', e.target.value)}
                                            />
                                        </div>
                                        <div className="create-grid-2">
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
                                            <div className="form-group form-group--full">
                                                <div className="create-section-head">
                                                    <label className="form-label">Mô tả</label>
                                                    <button
                                                        type="button"
                                                        className="btn-chip"
                                                        onClick={() => generateDescription({ isEdit: true })}
                                                        disabled={editingAiDescriptionLoading}
                                                    >
                                                        <FiSparkles />
                                                        {editingAiDescriptionLoading ? 'Đang tạo...' : 'Generate AI Description'}
                                                    </button>
                                                </div>
                                                <textarea
                                                    className="form-textarea"
                                                    rows={4}
                                                    value={editingProduct.productDescription}
                                                    onChange={(e) => updateEditField('productDescription', e.target.value)}
                                                />
                                                <div className="description-count">{editDescriptionCount} ký tự</div>
                                            </div>
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
                                                <label className="form-label">Danh mục</label>
                                                <select
                                                    className="form-input"
                                                    value={editingProduct.categoryId || ''}
                                                    onChange={(e) => updateEditField('categoryId', e.target.value)}
                                                    disabled={categoryLoading}
                                                >
                                                    <option value="">-- Chọn danh mục --</option>
                                                    {categories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group form-group--full">
                                                <div className="create-section-head">
                                                    <label className="form-label">Tags</label>
                                                    <button type="button" className="btn-chip" onClick={addEditTagField}>
                                                        + Thêm tag
                                                    </button>
                                                </div>
                                                <div className="create-tags-list">
                                                    {(editingProduct.tags || []).map((tag, index) => (
                                                        <div key={`edit-tag-${index}`} className="create-tag-row">
                                                            <input
                                                                type="text"
                                                                className="form-input tag-input"
                                                                value={tag}
                                                                onChange={(e) => updateEditTagField(index, e.target.value)}
                                                                placeholder={`Tag ${index + 1}`}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn-outline tag-remove-btn"
                                                                onClick={() => removeEditTagField(index)}
                                                            >
                                                                -
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
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
                <div className="create-modal-overlay" onClick={closeCreateForm} role="dialog" aria-modal="true" aria-labelledby="create-product-title">
                    <div className="create-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="create-modal-close"
                            onClick={closeCreateForm}
                            aria-label="Đóng"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="create-modal-body">
                            <aside className="create-modal-preview-panel">
                                <div className="create-preview-card">
                                    <div className="create-preview-cover">
                                        {(form.images || []).length > 0 ? (
                                            <img src={form.images[0].preview} alt="Ảnh xem trước" />
                                        ) : (
                                            <div className="create-preview-empty">
                                                <span>Chưa có ảnh</span>
                                                <small>Chọn ảnh để nhìn thấy preview ở đây</small>
                                            </div>
                                        )}
                                    </div>
                                    <div className="create-preview-content">
                                        <div className="create-preview-line create-preview-line--name">
                                            {form.productName || 'Tên sản phẩm sẽ hiển thị ở đây'}
                                        </div>
                                        <div className="create-preview-line create-preview-line--price">
                                            {form.productPrice ? Number(form.productPrice).toLocaleString('vi-VN') : '0'} VNĐ
                                        </div>
                                        <div className="create-preview-meta">
                                            <span>{form.size?.trim() || 'Kích thước'}</span>
                                            <span>{form.quantity !== '' ? form.quantity : 0} tồn kho</span>
                                        </div>
                                        <div className="create-preview-tags">
                                            {(form.tags || [])
                                                .map((tag) => (tag || '').trim())
                                                .filter(Boolean)
                                                .slice(0, 4)
                                                .map((tag) => (
                                                    <span key={tag}>{tag}</span>
                                                ))}
                                            {!(form.tags || []).some((tag) => (tag || '').trim()) && <span>Tag mẫu</span>}
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            <div className="create-modal-form-panel">
                                <form onSubmit={handleSubmit} className="create-modal-form">
                                    <div className="create-form-section">
                                        <div className="form-group">
                                            <label className="form-label">Tên sản phẩm <span className="required">*</span></label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="VD: Bộ ly gốm thủ công"
                                                value={form.productName}
                                                onChange={(e) => updateField('productName', e.target.value)}
                                            />
                                            {formErrors.productName && <span className="form-hint form-hint--error">{formErrors.productName}</span>}
                                        </div>

                                        <div className="create-grid-2">
                                            <div className="form-group">
                                                <label className="form-label">Giá (VNĐ) <span className="required">*</span></label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    className="form-input"
                                                    placeholder="0"
                                                    value={form.productPrice === '' ? '' : form.productPrice}
                                                    onChange={(e) => updateField('productPrice', e.target.value)}
                                                />
                                                {formErrors.productPrice && <span className="form-hint form-hint--error">{formErrors.productPrice}</span>}
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Số lượng <span className="required">*</span></label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    className="form-input"
                                                    placeholder="0"
                                                    value={form.quantity === '' ? '' : form.quantity}
                                                    onChange={(e) => updateField('quantity', e.target.value)}
                                                />
                                                {formErrors.quantity && <span className="form-hint form-hint--error">{formErrors.quantity}</span>}
                                            </div>

                                            <div className="form-group form-group--full">
                                                <div className="create-section-head">
                                                    <label className="form-label">Mô tả</label>
                                                    <button
                                                        type="button"
                                                        className="btn-chip"
                                                        onClick={() => generateDescription()}
                                                        disabled={aiDescriptionLoading}
                                                    >
                                                        <FiSparkles />
                                                        {aiDescriptionLoading ? 'Đang tạo...' : 'Generate AI Description'}
                                                    </button>
                                                </div>
                                                <textarea
                                                    className="form-textarea"
                                                    rows={4}
                                                    value={form.productDescription}
                                                    onChange={(e) => updateField('productDescription', e.target.value)}
                                                />
                                                <div className="description-count">{createDescriptionCount} ký tự</div>
                                            </div>

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
                                                <label className="form-label">Danh mục</label>
                                                <select
                                                    className="form-input"
                                                    value={form.categoryId}
                                                    onChange={(e) => updateField('categoryId', e.target.value)}
                                                    disabled={categoryLoading}
                                                >
                                                    <option value="">-- Chọn danh mục --</option>
                                                    {categories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {categoryLoading && <span className="form-hint">Đang tải...</span>}
                                                {categoryLoadError && <span className="form-hint form-hint--error">{categoryLoadError}</span>}
                                            </div>

                                            <div className="form-group form-group--full">
                                                <div className="create-section-head">
                                                    <label className="form-label">Tags</label>
                                                    <button type="button" className="btn-chip" onClick={addTagField}>
                                                        + Thêm tag
                                                    </button>
                                                </div>
                                                <div className="create-tags-list">
                                                    {(form.tags || []).map((tag, index) => (
                                                        <div key={`tag-${index}`} className="create-tag-row">
                                                            <input
                                                                type="text"
                                                                className="form-input tag-input"
                                                                placeholder={`Tag ${index + 1}`}
                                                                value={tag}
                                                                onChange={(e) => updateTagField(index, e.target.value)}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn-icon tag-remove-btn"
                                                                onClick={() => removeTagField(index)}
                                                                aria-label={`Xóa tag ${index + 1}`}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <div className="create-section-head">
                                                <label className="form-label">Ảnh sản phẩm</label>
                                                <span className="form-hint">Tối đa nhiều ảnh, ảnh đầu sẽ là ảnh đại diện</span>
                                            </div>
                                            <label className="create-upload-zone">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={(e) => {
                                                        addCreateImages(e.target.files);
                                                        e.target.value = '';
                                                    }}
                                                />
                                                <strong>Chọn ảnh hoặc kéo thả theo cách bạn thích</strong>
                                                <span>PNG, JPG, WEBP. Hỗ trợ xem trước ngay.</span>
                                            </label>
                                            {(form.images || []).length > 0 && (
                                                <div className="create-image-grid">
                                                    {form.images.map((img, idx) => (
                                                        <div key={`create-image-${idx}`} className="create-image-item">
                                                            <img src={img.preview} alt={`Ảnh ${idx + 1}`} />
                                                            <button
                                                                type="button"
                                                                className="edit-modal-image-remove"
                                                                onClick={() => removeCreateImage(idx)}
                                                                title="Xóa ảnh"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="create-modal-actions">
                                        <button type="button" className="btn-outline" onClick={closeCreateForm}>
                                            Hủy
                                        </button>
                                        <button type="submit" className="btn-primary" disabled={submitting}>
                                            {submitting ? 'Đang gửi...' : 'Thêm sản phẩm'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
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
                                            src={p.images[0].image_url || p.images[0].imageUrl || p.images[0].image}
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

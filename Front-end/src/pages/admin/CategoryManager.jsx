import React, { useEffect, useMemo, useState } from 'react';
import {
    FiArrowRight,
    FiEdit2,
    FiFolder,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiTrash2,
} from 'react-icons/fi';
import { appToast } from '../../lib/appToast';
import categoryService from '../../services/categoryService';
import './admin-common.css';
import './CategoryManager.css';

const EMPTY_TEXT = '—';

const safeText = (value) => {
    if (value == null) return EMPTY_TEXT;
    const text = String(value).trim();
    return text === '' ? EMPTY_TEXT : text;
};

const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const normalizeCategory = (item = {}) => ({
    categoryId: item?.categoryId ?? item?.id ?? '',
    categoryName: item?.categoryName ?? item?.name ?? '',
    description: item?.description ?? '',
    iconUrl: item?.iconUrl ?? '',
    isActive: typeof item?.isActive === 'boolean' ? item.isActive : true,
    sortOrder: safeNumber(item?.sortOrder, 0),
    templateCount: safeNumber(item?.templateCount, 0),
    createdAt: item?.createdAt ?? null,
    updatedAt: item?.updatedAt ?? null,
});

const initialForm = {
    categoryName: '',
    description: '',
    iconUrl: '',
    sortOrder: 0,
    isActive: true,
};

const CategoryFormModal = ({ open, mode, loadingDetail, submitting, initialData, onClose, onSubmit }) => {
    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && initialData) {
            setForm({
                categoryName: initialData.categoryName ?? '',
                description: initialData.description ?? '',
                iconUrl: initialData.iconUrl ?? '',
                sortOrder: safeNumber(initialData.sortOrder, 0),
                isActive: typeof initialData.isActive === 'boolean' ? initialData.isActive : true,
            });
        } else {
            setForm(initialForm);
        }
    }, [open, mode, initialData]);

    if (!open) return null;

    const handleChange = (field) => (event) => {
        const value = field === 'isActive' ? event.target.checked : event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!form.categoryName.trim()) {
            appToast.warning('Thiếu thông tin', 'Tên danh mục không được để trống.');
            return;
        }

        onSubmit({
            categoryName: form.categoryName.trim(),
            description: form.description?.trim() || '',
            iconUrl: form.iconUrl?.trim() || '',
            sortOrder: Math.max(0, Number(form.sortOrder) || 0),
            isActive: !!form.isActive,
        });
    };

    return (
        <div className="detail-overlay" role="presentation" onClick={onClose}>
            <div className="detail-modal category-form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="detail-modal-header">
                    <h3>{mode === 'create' ? 'Thêm danh mục' : 'Chỉnh sửa danh mục'}</h3>
                    <button type="button" className="detail-close" onClick={onClose} disabled={submitting} aria-label="Đóng">
                        &times;
                    </button>
                </div>

                <form className="detail-modal-body category-form-body" onSubmit={handleSubmit}>
                    {mode === 'edit' && loadingDetail ? (
                        <div className="category-inline-loading category-form-loading">
                            <FiRefreshCw className="spin" /> Đang tải thông tin danh mục...
                        </div>
                    ) : (
                        <>
                            <div className="detail-row form-card form-card-full">
                                <label className="detail-label" htmlFor="categoryName">
                                    Tên danh mục <span className="required">*</span>
                                </label>
                                <input
                                    id="categoryName"
                                    className="detail-edit-input"
                                    type="text"
                                    value={form.categoryName}
                                    onChange={handleChange('categoryName')}
                                    placeholder="Nhập tên danh mục"
                                    maxLength={255}
                                    required
                                />
                            </div>

                            <div className="detail-row form-card form-card-full">
                                <label className="detail-label" htmlFor="sortOrder">
                                    Thứ tự
                                </label>
                                <input
                                    id="sortOrder"
                                    className="detail-edit-input"
                                    type="number"
                                    min={0}
                                    value={form.sortOrder}
                                    onChange={handleChange('sortOrder')}
                                />
                            </div>

                            <div className="detail-row form-card form-card-full">
                                <label className="detail-label" htmlFor="description">
                                    Mô tả
                                </label>
                                <textarea
                                    id="description"
                                    className="detail-edit-input"
                                    rows={5}
                                    value={form.description}
                                    onChange={handleChange('description')}
                                    placeholder="Mô tả danh mục"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="detail-row form-card form-card-full">
                                <label className="detail-label" htmlFor="iconUrl">
                                    Icon URL
                                </label>
                                <input
                                    id="iconUrl"
                                    className="detail-edit-input"
                                    type="text"
                                    value={form.iconUrl}
                                    onChange={handleChange('iconUrl')}
                                    placeholder="https://..."
                                />
                                <div className="icon-preview-wrap">
                                    <span>Xem trước:</span>
                                    {form.iconUrl ? (
                                        <img
                                            className="icon-preview"
                                            src={form.iconUrl}
                                            alt="Icon preview"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <span className="icon-emoji">📁</span>
                                    )}
                                </div>
                            </div>

                            <div className="detail-row form-card form-card-full form-card-toggle">
                                <label className="detail-label">Đang hoạt động</label>
                                <button
                                    type="button"
                                    className={`toggle-switch ${form.isActive ? 'is-on' : 'is-off'}`}
                                    onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                                    aria-pressed={form.isActive}
                                    aria-label="Bật tắt trạng thái hoạt động"
                                >
                                    <span className="toggle-switch-track">
                                        <span className="toggle-switch-thumb" />
                                    </span>
                                    <span className="toggle-switch-text">{form.isActive ? 'Bật' : 'Tắt'}</span>
                                </button>
                            </div>
                        </>
                    )}

                    <div className="detail-modal-footer category-form-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting || (mode === 'edit' && loadingDetail)}>
                            {submitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmModal = ({ category, loading, onCancel, onConfirm }) => {
    if (!category) return null;

    return (
        <div className="detail-overlay" role="presentation" onClick={onCancel}>
            <div className="detail-modal delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="detail-modal-header">
                    <h3>Xác nhận xóa</h3>
                    <button type="button" className="detail-close" onClick={onCancel} disabled={loading} aria-label="Đóng">
                        &times;
                    </button>
                </div>
                <div className="detail-modal-body">
                    <p className="confirm-text">
                        Bạn có chắc muốn xóa danh mục <strong>{safeText(category?.categoryName)}</strong>?
                        <br />
                        Hành động này không thể hoàn tác.
                    </p>
                </div>
                <div className="detail-modal-footer">
                    <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
                        Hủy
                    </button>
                    <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Đang xóa...' : 'Xóa danh mục'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [formModal, setFormModal] = useState({ open: false, mode: 'create' });
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await categoryService.getCategories();
            if (!res.success) {
                appToast.error('Không tải được', res.error || 'Không tải được danh mục');
                setCategories([]);
                return;
            }
            setCategories((res.data || []).map(normalizeCategory));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const filteredCategories = useMemo(() => {
        const keyword = searchInput.trim().toLowerCase();
        return [...categories]
            .filter((item) => {
                if (!keyword) return true;
                return [item.categoryName, item.description, item.categoryId].some((field) =>
                    String(field || '').toLowerCase().includes(keyword)
                );
            })
            .filter((item) => {
                if (statusFilter === 'active') return item.isActive;
                if (statusFilter === 'inactive') return !item.isActive;
                return true;
            })
            .sort((a, b) => {
                if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
                return safeText(a.categoryName).localeCompare(safeText(b.categoryName), 'vi');
            });
    }, [categories, searchInput, statusFilter]);

    const activeCount = useMemo(() => categories.filter((item) => item.isActive).length, [categories]);
    const inactiveCount = categories.length - activeCount;
    const totalTemplates = useMemo(() => categories.reduce((sum, item) => sum + safeNumber(item.templateCount, 0), 0), [categories]);

    const openDetail = async (item) => {
        const id = item?.categoryId;
        if (!id) return;
        setDetailOpen(true);
        setDetailLoading(true);
        try {
            const res = await categoryService.getCategoryById(id);
            if (!res.success) {
                appToast.error('Không tải được', res.error || 'Không tải được chi tiết danh mục');
                setDetailOpen(false);
                return;
            }
            setSelectedCategory(normalizeCategory(res.data));
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        if (detailLoading) return;
        setDetailOpen(false);
        setSelectedCategory(null);
    };

    const openCreate = () => {
        setSelectedCategory(null);
        setFormModal({ open: true, mode: 'create' });
    };

    const openEdit = async (item) => {
        const id = item?.categoryId;
        if (!id) return;
        setFormModal({ open: true, mode: 'edit' });
        setDetailLoading(true);
        try {
            const res = await categoryService.getCategoryById(id);
            if (!res.success) {
                appToast.error('Không tải được', res.error || 'Không tải được chi tiết danh mục');
                setFormModal({ open: false, mode: 'edit' });
                return;
            }
            setSelectedCategory(normalizeCategory(res.data));
        } finally {
            setDetailLoading(false);
        }
    };

    const closeForm = () => {
        if (formSubmitting) return;
        setFormModal({ open: false, mode: 'create' });
        setSelectedCategory(null);
    };

    const handleSubmit = async (payload) => {
        setFormSubmitting(true);
        try {
            const isEdit = formModal.mode === 'edit' && selectedCategory?.categoryId;
            const res = isEdit
                ? await categoryService.updateCategory(selectedCategory.categoryId, payload)
                : await categoryService.createCategory(payload);

            if (!res.success) {
                appToast.error('Có lỗi xảy ra', res.error || 'Vui lòng thử lại');
                return;
            }

            appToast.success('Thành công', isEdit ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục');
            closeForm();
            await fetchCategories();
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const id = deleteTarget?.categoryId;
        if (!id) return;

        setDeleteLoading(true);
        try {
            const res = await categoryService.deleteCategory(id);
            if (!res.success) {
                appToast.error('Không thể xóa', res.error || 'Không thể xóa danh mục');
                return;
            }
            appToast.success('Thành công', 'Đã xóa danh mục');
            setDeleteTarget(null);
            await fetchCategories();
        } finally {
            setDeleteLoading(false);
        }
    };

    const detailCategory = detailOpen ? selectedCategory : null;

    return (
        <>
            <div className="admin-page category-manager-page">
                <div className="category-hero admin-card">
                    <div>
                        <p className="eyebrow">Danh mục</p>
                        <h1 className="admin-page-title">Quản lý danh mục</h1>
                        <p className="admin-page-subtitle">
                            Xem nhanh số liệu, tìm kiếm linh hoạt và quản trị danh mục bằng giao diện gọn, rõ ràng hơn.
                        </p>
                    </div>
                    <div className="hero-actions">
                        <button type="button" className="btn btn-outline" onClick={fetchCategories} disabled={loading}>
                            <FiRefreshCw className={loading ? 'spin' : ''} />
                            Làm mới
                        </button>
                        <button type="button" className="btn btn-primary" onClick={openCreate}>
                            <FiPlus /> Thêm danh mục
                        </button>
                    </div>
                </div>

                <div className="stats-row">
                    <div className="admin-card stat-card">
                        <p>Tổng danh mục</p>
                        <h3>{categories.length}</h3>
                    </div>
                    <div className="admin-card stat-card">
                        <p>Đang hoạt động</p>
                        <h3>{activeCount}</h3>
                    </div>
                    <div className="admin-card stat-card">
                        <p>Đã tắt</p>
                        <h3>{inactiveCount}</h3>
                    </div>
                    <div className="admin-card stat-card">
                        <p>Tổng mẫu liên quan</p>
                        <h3>{totalTemplates}</h3>
                    </div>
                </div>

                <div className="controls-bar admin-card">
                    <div className="search-box category-search-box">
                        <FiSearch className="control-icon" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Tìm theo tên, mô tả hoặc mã danh mục..."
                        />
                    </div>

                    <div className="filter-box">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="inactive">Đã tắt</option>
                        </select>
                    </div>
                </div>

                <div className="admin-card table-card category-table-card">
                    <div className="table-header-row">
                        <div>
                            <h2>Danh sách danh mục</h2>
                            <p>Hiển thị kết quả phù hợp với bộ lọc hiện tại.</p>
                        </div>
                        <span className="table-count-pill">{filteredCategories.length} mục</span>
                    </div>

                    <div className="table-responsive">
                        <table className="admin-table category-table">
                            <thead>
                                <tr>
                                    <th>DANH MỤC</th>
                                    <th>MÔ TẢ</th>
                                    <th>THỨ TỰ</th>
                                    <th>MẪU</th>
                                    <th>TRẠNG THÁI</th>
                                    <th className="text-center">HÀNH ĐỘNG</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            <div className="admin-empty-state">
                                                <FiRefreshCw className="spin" style={{ fontSize: '2rem' }} />
                                                <p>Đang tải...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            <div className="admin-empty-state">
                                                <FiFolder style={{ fontSize: '2rem' }} />
                                                <p>Không tìm thấy danh mục phù hợp</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCategories.map((item) => (
                                        <tr key={item.categoryId}>
                                            <td>
                                                <div className="category-cell">
                                                    {item.iconUrl ? (
                                                        <img
                                                            className="category-icon"
                                                            src={item.iconUrl}
                                                            alt={safeText(item.categoryName)}
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="category-icon category-icon-fallback">📁</span>
                                                    )}
                                                    <div className="category-main-info">
                                                        <span className="category-name">{safeText(item.categoryName)}</span>
                                                        <span className="category-id" title={item.categoryId || EMPTY_TEXT}>
                                                            {safeText(item.categoryId)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td title={safeText(item.description)}>{safeText(item.description)}</td>
                                            <td>
                                                <span className="sort-pill">{item.sortOrder ?? 0}</span>
                                            </td>
                                            <td>
                                                <span className="template-pill">{item.templateCount ?? 0}</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${item.isActive ? 'badge-success' : 'badge-muted'}`}>
                                                    {item.isActive ? 'Hoạt động' : 'Đã tắt'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="action-buttons">
                                                    <button type="button" className="btn-action view" onClick={() => openDetail(item)} title="Xem chi tiết">
                                                        <FiArrowRight />
                                                    </button>
                                                    <button type="button" className="btn-action edit" onClick={() => openEdit(item)} title="Sửa">
                                                        <FiEdit2 />
                                                    </button>
                                                    <button type="button" className="btn-action delete" onClick={() => setDeleteTarget(item)} title="Xóa">
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {detailCategory && (
                <div className="detail-overlay" role="presentation" onClick={closeDetail}>
                    <aside className="detail-panel category-detail-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-panel-header">
                            <div>
                                <p className="eyebrow">Chi tiết danh mục</p>
                                <h3>{detailLoading ? 'Đang tải...' : safeText(detailCategory.categoryName)}</h3>
                            </div>
                            <button type="button" className="detail-close" onClick={closeDetail} aria-label="Đóng">
                                &times;
                            </button>
                        </div>

                        <div className="detail-panel-body">
                            {detailLoading ? (
                                <div className="category-inline-loading">
                                    <FiRefreshCw className="spin" /> Đang tải dữ liệu...
                                </div>
                            ) : (
                                <>
                                    <div className="detail-summary-card">
                                        <div className="summary-icon">{detailCategory.iconUrl ? '🖼️' : '📁'}</div>
                                        <div>
                                            <h4>{safeText(detailCategory.categoryName)}</h4>
                                            <p>{safeText(detailCategory.description)}</p>
                                        </div>
                                    </div>

                                    <div className="detail-info-grid">
                                        <div>
                                            <span>Mã danh mục</span>
                                            <strong>{safeText(detailCategory.categoryId)}</strong>
                                        </div>
                                        <div>
                                            <span>Thứ tự</span>
                                            <strong>{detailCategory.sortOrder ?? 0}</strong>
                                        </div>
                                        <div>
                                            <span>Trạng thái</span>
                                            <strong>{detailCategory.isActive ? 'Hoạt động' : 'Đã tắt'}</strong>
                                        </div>
                                        <div>
                                            <span>Số mẫu</span>
                                            <strong>{detailCategory.templateCount ?? 0}</strong>
                                        </div>
                                        <div>
                                            <span>Ngày tạo</span>
                                            <strong>{safeText(detailCategory.createdAt)}</strong>
                                        </div>
                                        <div>
                                            <span>Cập nhật gần nhất</span>
                                            <strong>{safeText(detailCategory.updatedAt)}</strong>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </aside>
                </div>
            )}

            <CategoryFormModal
                open={formModal.open}
                mode={formModal.mode}
                loadingDetail={detailLoading}
                submitting={formSubmitting}
                initialData={selectedCategory}
                onClose={closeForm}
                onSubmit={handleSubmit}
            />

            <DeleteConfirmModal
                category={deleteTarget}
                loading={deleteLoading}
                onCancel={() => !deleteLoading && setDeleteTarget(null)}
                onConfirm={handleDelete}
            />
        </>
    );
};

export default CategoryManager;

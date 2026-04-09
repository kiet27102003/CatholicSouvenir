import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FiChevronDown,
    FiChevronRight,
    FiEdit2,
    FiFolder,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiTrash2,
} from 'react-icons/fi';
import AdminTopbar from './AdminTopbar';
import { appToast } from '../../lib/appToast';
import categoryService from '../../services/categoryService';
import './admin-common.css';
import './CategoryManager.css';

const EMPTY_TEXT = '—';

const getSafeText = (value) => {
    if (value == null) return EMPTY_TEXT;
    const text = String(value).trim();
    return text === '' ? EMPTY_TEXT : text;
};

const truncate = (value, max = 40) => {
    const text = getSafeText(value);
    if (text === EMPTY_TEXT) return EMPTY_TEXT;
    return text.length > max ? `${text.slice(0, max)}...` : text;
};

const truncateId = (id) => {
    const text = getSafeText(id);
    if (text === EMPTY_TEXT || text.length <= 12) return text;
    return `${text.slice(0, 6)}...${text.slice(-4)}`;
};

const inferCategoryId = (item) => item?.categoryId ?? item?.id ?? item?.categoryID ?? null;

const inferParentId = (item) =>
    item?.parentCategoryId ?? item?.parentId ?? item?.parent?.categoryId ?? item?.parent?.id ?? null;

const normalizeCategory = (item = {}) => {
    const categoryId = inferCategoryId(item);
    return {
        ...item,
        categoryId,
        parentCategoryId: inferParentId(item),
        categoryName: item?.categoryName ?? item?.name ?? '',
        description: item?.description ?? '',
        iconUrl: item?.iconUrl ?? item?.icon ?? '',
        sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : 0,
        isActive: typeof item?.isActive === 'boolean' ? item.isActive : true,
    };
};

const initialForm = {
    categoryName: '',
    description: '',
    iconUrl: '',
    sortOrder: 0,
    isActive: true,
};

const CategoryFormModal = ({ open, mode, categoryId, loadingDetail, submitting, initialData, onClose, onSubmit }) => {
    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && initialData) {
            setForm({
                categoryName: initialData.categoryName ?? '',
                description: initialData.description ?? '',
                iconUrl: initialData.iconUrl ?? '',
                sortOrder: Number.isFinite(Number(initialData.sortOrder)) ? Number(initialData.sortOrder) : 0,
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
                    <h3>{mode === 'create' ? 'Thêm danh mục' : 'Cập nhật danh mục'}</h3>
                    <button type="button" className="detail-close" onClick={onClose} disabled={submitting} aria-label="Đóng">
                        &times;
                    </button>
                </div>

                <form className="detail-modal-body" onSubmit={handleSubmit}>
                    {mode === 'edit' && loadingDetail ? (
                        <div className="category-inline-loading">
                            <FiRefreshCw className="spin" /> Đang tải dữ liệu danh mục...
                        </div>
                    ) : (
                        <>
                            <div className="detail-row">
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

                            <div className="detail-row">
                                <label className="detail-label" htmlFor="description">Mô tả</label>
                                <textarea
                                    id="description"
                                    className="detail-edit-input"
                                    rows={4}
                                    value={form.description}
                                    onChange={handleChange('description')}
                                    placeholder="Mô tả danh mục"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="detail-row">
                                <label className="detail-label" htmlFor="iconUrl">Icon URL</label>
                                <input
                                    id="iconUrl"
                                    className="detail-edit-input"
                                    type="text"
                                    value={form.iconUrl}
                                    onChange={handleChange('iconUrl')}
                                    placeholder="https://..."
                                />
                                <div className="icon-preview-wrap">
                                    <span>Preview:</span>
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

                            <div className="detail-row">
                                <label className="detail-label" htmlFor="sortOrder">Thứ tự</label>
                                <input
                                    id="sortOrder"
                                    className="detail-edit-input"
                                    type="number"
                                    min={0}
                                    value={form.sortOrder}
                                    onChange={handleChange('sortOrder')}
                                />
                            </div>

                            <label className="category-toggle-row" htmlFor="isActive">
                                <input
                                    id="isActive"
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={handleChange('isActive')}
                                />
                                <span>Đang hoạt động</span>
                            </label>
                        </>
                    )}

                    <div className="detail-modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting || (mode === 'edit' && loadingDetail) || (mode === 'edit' && !categoryId)}
                        >
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
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                        Bạn có chắc muốn xóa danh mục <strong>{getSafeText(category?.categoryName)}</strong>?
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
    const [rootCategories, setRootCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const [expanded, setExpanded] = useState({});
    const [childrenMap, setChildrenMap] = useState({});
    const [childrenLoadingMap, setChildrenLoadingMap] = useState({});

    const [formModal, setFormModal] = useState({ open: false, mode: 'create', categoryId: null });
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim());
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchBaseData = useCallback(async () => {
        setLoading(true);
        try {
            const [allRes, rootRes] = await Promise.all([
                categoryService.getCategories(),
                categoryService.getRootCategories(),
            ]);

            if (!allRes.success) {
                appToast.error('Không tải được', allRes.error || 'Không tải được danh mục');
                setCategories([]);
            } else {
                setCategories((allRes.data || []).map(normalizeCategory));
            }

            if (!rootRes.success) {
                appToast.error('Không tải được', rootRes.error || 'Không tải được danh mục gốc');
                setRootCategories([]);
            } else {
                setRootCategories((rootRes.data || []).map(normalizeCategory));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBaseData();
    }, [fetchBaseData]);

    const rootIdSet = useMemo(() => {
        const ids = new Set();
        rootCategories.forEach((item) => {
            if (item?.categoryId) ids.add(String(item.categoryId));
        });
        return ids;
    }, [rootCategories]);

    const isRootCategory = useCallback(
        (item) => {
            if (!item) return false;
            const id = item.categoryId ? String(item.categoryId) : null;
            if (id && rootIdSet.has(id)) return true;
            return !item.parentCategoryId;
        },
        [rootIdSet]
    );

    const activeCount = useMemo(
        () => categories.filter((item) => item?.isActive === true).length,
        [categories]
    );

    const filteredRows = useMemo(() => {
        let rows = [...categories];

        if (statusFilter !== 'all') {
            const wantActive = statusFilter === 'active';
            rows = rows.filter((item) => !!item?.isActive === wantActive);
        }

        if (typeFilter !== 'all') {
            rows = rows.filter((item) => {
                const root = isRootCategory(item);
                return typeFilter === 'root' ? root : !root;
            });
        }

        rows.sort((a, b) => {
            const aRoot = isRootCategory(a);
            const bRoot = isRootCategory(b);
            if (aRoot !== bRoot) return aRoot ? -1 : 1;
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            return getSafeText(a.categoryName).localeCompare(getSafeText(b.categoryName), 'vi');
        });

        return rows;
    }, [categories, statusFilter, typeFilter, isRootCategory]);

    const displayedRows = useMemo(() => {
        if (!searchTerm) {
            return filteredRows;
        }

        const foundByName = filteredRows.filter((item) =>
            String(item.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        return foundByName;
    }, [filteredRows, searchTerm]);

    useEffect(() => {
        if (!searchTerm) return;

        let cancelled = false;
        const search = async () => {
            const res = await categoryService.searchCategoriesByName(searchTerm);
            if (cancelled) return;

            if (!res.success) {
                appToast.error('Không tìm được', res.error || 'Không tìm được danh mục');
                return;
            }

            const remoteData = (res.data || []).map(normalizeCategory);
            setCategories((prev) => {
                const map = new Map(prev.map((item) => [String(item.categoryId), item]));
                remoteData.forEach((item) => {
                    if (item?.categoryId) map.set(String(item.categoryId), item);
                });
                return Array.from(map.values());
            });
        };

        search();

        return () => {
            cancelled = true;
        };
    }, [searchTerm]);

    const fetchSubcategories = useCallback(async (parentId) => {
        if (!parentId) return;
        setChildrenLoadingMap((prev) => ({ ...prev, [parentId]: true }));
        try {
            const res = await categoryService.getSubcategories(parentId);
            if (!res.success) {
                appToast.error('Không tải được', res.error || 'Không tải được danh mục con');
                setChildrenMap((prev) => ({ ...prev, [parentId]: [] }));
                return;
            }
            const rows = (res.data || []).map(normalizeCategory);
            setChildrenMap((prev) => ({ ...prev, [parentId]: rows }));
        } finally {
            setChildrenLoadingMap((prev) => ({ ...prev, [parentId]: false }));
        }
    }, []);

    const toggleExpand = async (item) => {
        const id = item?.categoryId;
        if (!id) return;
        const idText = String(id);

        if (expanded[idText]) {
            setExpanded((prev) => ({ ...prev, [idText]: false }));
            return;
        }

        setExpanded((prev) => ({ ...prev, [idText]: true }));

        if (!childrenMap[idText]) {
            await fetchSubcategories(idText);
        }
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormModal({ open: true, mode: 'create', categoryId: null });
    };

    const openEditModal = async (item) => {
        const id = item?.categoryId;
        if (!id) return;

        setFormModal({ open: true, mode: 'edit', categoryId: id });
        setDetailLoading(true);
        try {
            const res = await categoryService.getCategoryById(id);
            if (!res.success) {
                appToast.error('Không tải được', res.error || 'Không tải được chi tiết danh mục');
                setFormModal({ open: false, mode: 'edit', categoryId: null });
                return;
            }
            setEditingCategory(normalizeCategory(res.data));
        } finally {
            setDetailLoading(false);
        }
    };

    const closeFormModal = () => {
        if (formSubmitting) return;
        setFormModal({ open: false, mode: 'create', categoryId: null });
        setEditingCategory(null);
    };

    const handleSubmitCategory = async (payload) => {
        setFormSubmitting(true);
        try {
            const isEdit = formModal.mode === 'edit' && formModal.categoryId;
            const res = isEdit
                ? await categoryService.updateCategory(formModal.categoryId, payload)
                : await categoryService.createCategory(payload);

            if (!res.success) {
                appToast.error('Có lỗi xảy ra', res.error || 'Vui lòng thử lại');
                return;
            }

            appToast.success('Thành công', isEdit ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục');
            closeFormModal();
            await fetchBaseData();
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
            await fetchBaseData();
        } finally {
            setDeleteLoading(false);
        }
    };

    const renderCategoryCell = (item, isChild = false) => {
        const id = item?.categoryId ? String(item.categoryId) : '';
        const isExpandable = !isChild && isRootCategory(item);
        const expandedState = expanded[id];
        const loadingChildren = childrenLoadingMap[id];

        return (
            <div className={`category-cell ${isChild ? 'is-child' : ''}`}>
                {isExpandable ? (
                    <button
                        type="button"
                        className="expand-btn"
                        onClick={() => toggleExpand(item)}
                        title={expandedState ? 'Thu gọn danh mục con' : 'Xem danh mục con'}
                    >
                        {loadingChildren ? <FiRefreshCw className="spin" /> : expandedState ? <FiChevronDown /> : <FiChevronRight />}
                    </button>
                ) : (
                    <span className="expand-btn-placeholder" />
                )}

                {item?.iconUrl ? (
                    <img className="category-icon" src={item.iconUrl} alt={getSafeText(item.categoryName)} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                    <span className="category-icon category-icon-fallback">📁</span>
                )}

                <div className="category-main-info">
                    <span className="category-name">{getSafeText(item?.categoryName)}</span>
                    <span className="category-id" title={id || EMPTY_TEXT}>{truncateId(id)}</span>
                </div>
            </div>
        );
    };

    const rootRows = displayedRows.filter((item) => isRootCategory(item));

    return (
        <>
            <AdminTopbar title="Quản lý danh mục" />
            <div className="admin-page category-manager-page">
                <div className="admin-page-header category-manager-header">
                    <div>
                        <h2>Quản lý danh mục</h2>
                        <p className="admin-page-subtitle">Quản lý danh mục sản phẩm và danh mục con</p>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                        <FiPlus /> Thêm danh mục
                    </button>
                </div>

                <div className="stats-row">
                    <div className="admin-card stat-card">
                        <p>Tổng danh mục</p>
                        <h3>{categories.length}</h3>
                    </div>
                    <div className="admin-card stat-card">
                        <p>Danh mục gốc</p>
                        <h3>{rootCategories.length}</h3>
                    </div>
                    <div className="admin-card stat-card">
                        <p>Đang hoạt động</p>
                        <h3>{activeCount}</h3>
                    </div>
                </div>

                <div className="controls-bar">
                    <div className="search-box">
                        <FiSearch className="control-icon" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Tìm danh mục theo tên..."
                        />
                    </div>

                    <div className="filter-box">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="inactive">Tắt</option>
                        </select>
                    </div>

                    <div className="filter-box">
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="all">Tất cả loại</option>
                            <option value="root">Danh mục gốc</option>
                            <option value="child">Danh mục con</option>
                        </select>
                    </div>

                    <button type="button" className="btn btn-outline btn-sm" onClick={fetchBaseData} disabled={loading}>
                        <FiRefreshCw className={loading ? 'spin' : ''} />
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>

                <div className="admin-card table-card">
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>DANH MỤC</th>
                                    <th>LOẠI</th>
                                    <th>MÔ TẢ</th>
                                    <th>THỨ TỰ</th>
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
                                ) : rootRows.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            <div className="admin-empty-state">
                                                <FiFolder style={{ fontSize: '2rem' }} />
                                                <p>Chưa có danh mục nào</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    rootRows.map((item) => {
                                        const id = String(item.categoryId);
                                        const children = childrenMap[id] || [];
                                        const showChildren = expanded[id] && children.length > 0;

                                        return (
                                            <React.Fragment key={id}>
                                                <tr>
                                                    <td>{renderCategoryCell(item)}</td>
                                                    <td>
                                                        <span className="status-badge badge-root">Gốc</span>
                                                    </td>
                                                    <td title={getSafeText(item.description)}>{truncate(item.description, 40)}</td>
                                                    <td>
                                                        <span className="sort-pill">{item.sortOrder ?? 0}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${item.isActive ? 'badge-success' : 'badge-muted'}`}>
                                                            {item.isActive ? 'Hoạt động' : 'Tắt'}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="action-buttons">
                                                            <button
                                                                type="button"
                                                                className="btn-action view"
                                                                onClick={() => toggleExpand(item)}
                                                                title="Xem danh mục con"
                                                            >
                                                                <FiChevronDown />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-action edit"
                                                                onClick={() => openEditModal(item)}
                                                                title="Sửa"
                                                            >
                                                                <FiEdit2 />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-action delete"
                                                                onClick={() => setDeleteTarget(item)}
                                                                title="Xóa"
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {showChildren &&
                                                    children.map((child) => {
                                                        const childId = String(child.categoryId);
                                                        return (
                                                            <tr key={`${id}-${childId}`} className="subcategory-row">
                                                                <td>{renderCategoryCell(child, true)}</td>
                                                                <td>
                                                                    <span className="status-badge badge-child">Con</span>
                                                                </td>
                                                                <td title={getSafeText(child.description)}>{truncate(child.description, 40)}</td>
                                                                <td>
                                                                    <span className="sort-pill">{child.sortOrder ?? 0}</span>
                                                                </td>
                                                                <td>
                                                                    <span className={`status-badge ${child.isActive ? 'badge-success' : 'badge-muted'}`}>
                                                                        {child.isActive ? 'Hoạt động' : 'Tắt'}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="action-buttons">
                                                                        <button
                                                                            type="button"
                                                                            className="btn-action edit"
                                                                            onClick={() => openEditModal(child)}
                                                                            title="Sửa"
                                                                        >
                                                                            <FiEdit2 />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn-action delete"
                                                                            onClick={() => setDeleteTarget(child)}
                                                                            title="Xóa"
                                                                        >
                                                                            <FiTrash2 />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <CategoryFormModal
                open={formModal.open}
                mode={formModal.mode}
                categoryId={formModal.categoryId}
                loadingDetail={detailLoading}
                submitting={formSubmitting}
                initialData={editingCategory}
                onClose={closeFormModal}
                onSubmit={handleSubmitCategory}
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

import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiRefreshCw, FiPackage, FiCheck, FiX, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import productService from '../../services/productService';
import './admin-common.css';
import './ProductManager.css';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Status change modal (approve/reject)
    const [statusModal, setStatusModal] = useState(null); // { product, action: 'approve' | 'reject' }
    const [rejectionReason, setRejectionReason] = useState('');
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusError, setStatusError] = useState(null);

    // Delete confirmation
    const [deleteModal, setDeleteModal] = useState(null); // product
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await productService.getProducts();
            if (result.success && Array.isArray(result.data)) {
                setProducts(result.data);
            } else {
                setProducts([]);
                if (result.error) setError(result.error);
            }
        } catch (err) {
            setError(err.message || 'Không tải được danh sách sản phẩm.');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = products.filter((p) => {
        const nameMatch = (p.productName || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const artisanMatch = (p.artisanName || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesSearch = nameMatch || artisanMatch;
        const matchesStatus =
            statusFilter === 'All' || (p.status || '').toUpperCase() === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatPrice = (val) => {
        if (val == null) return '—';
        return typeof val === 'number'
            ? val.toLocaleString('vi-VN') + ' VNĐ'
            : String(val) + ' VNĐ';
    };

    const formatDate = (val) => {
        if (val == null || val === '') return '—';
        try {
            return new Date(val).toLocaleString('vi-VN');
        } catch {
            return String(val);
        }
    };

    const getStatusBadgeClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'approved') return 'badge-success';
        if (s === 'rejected') return 'badge-danger';
        return 'badge-warning';
    };

    const statusOptions = ['All', 'PENDING', 'APPROVED', 'REJECTED'];

    const isPending = (p) => (p.status || '').toUpperCase() === 'PENDING';

    const openApproveModal = (p) => {
        setStatusModal({ product: p, action: 'approve' });
        setRejectionReason('');
        setStatusError(null);
    };

    const openRejectModal = (p) => {
        setStatusModal({ product: p, action: 'reject' });
        setRejectionReason('');
        setStatusError(null);
    };

    const closeStatusModal = () => {
        setStatusModal(null);
        setRejectionReason('');
        setStatusError(null);
    };

    const handleStatusSubmit = async () => {
        if (!statusModal?.product?.productId) return;
        if (statusModal.action === 'reject' && !rejectionReason.trim()) {
            setStatusError('Vui lòng nhập lý do từ chối.');
            return;
        }

        setStatusLoading(true);
        setStatusError(null);
        try {
            const payload = statusModal.action === 'approve'
                ? { status: 'APPROVED' }
                : { status: 'REJECTED', rejectionReason: rejectionReason.trim() };
            const result = await productService.updateProductStatus(statusModal.product.productId, payload);
            if (result.success) {
                setProducts((prev) =>
                    prev.map((p) =>
                        p.productId === statusModal.product.productId
                            ? { ...p, status: payload.status }
                            : p
                    )
                );
                closeStatusModal();
            } else {
                setStatusError(result.error ?? 'Cập nhật thất bại.');
            }
        } catch (err) {
            setStatusError(err.message ?? 'Cập nhật thất bại.');
        } finally {
            setStatusLoading(false);
        }
    };

    const openDeleteModal = (p) => {
        setDeleteModal(p);
        setDeleteError(null);
    };

    const closeDeleteModal = () => {
        setDeleteModal(null);
        setDeleteError(null);
    };

    const handleDelete = async () => {
        if (!deleteModal?.productId) return;
        setDeleteLoading(true);
        setDeleteError(null);
        try {
            const result = await productService.deleteProduct(deleteModal.productId);
            if (result.success) {
                setProducts((prev) => prev.filter((p) => p.productId !== deleteModal.productId));
                closeDeleteModal();
            } else {
                setDeleteError(result.error ?? 'Xóa thất bại.');
            }
        } catch (err) {
            setDeleteError(err.message ?? 'Xóa thất bại.');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="admin-page product-manager-page">
            <div className="admin-page-header product-manager-header">
                <div>
                    <h2>Quản lý sản phẩm</h2>
                    <p className="admin-page-subtitle">
                        Xem và quản lý toàn bộ sản phẩm từ các artisan.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn btn-outline btn-icon"
                        onClick={fetchProducts}
                        disabled={loading}
                    >
                        <FiRefreshCw className={loading ? 'spin' : ''} />
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="product-manager-alert error">{error}</div>
            )}

            <div className="controls-bar">
                <div className="search-box">
                    <FiSearch className="control-icon" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên sản phẩm hoặc artisan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <FiFilter className="control-icon" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt === 'All' ? 'Tất cả trạng thái' : opt}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="admin-card table-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th width="60">#</th>
                                <th width="120">Ảnh</th>
                                <th width="200">Sản phẩm</th>
                                <th width="120">Giá</th>
                                <th width="120">Artisan</th>
                                <th width="80">Số lượng</th>
                                <th width="100">Trạng thái</th>
                                <th width="140">Ngày tạo</th>
                                <th width="140" className="text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="empty-state">
                                        <div className="admin-empty-state">
                                            <FiRefreshCw
                                                className="spin"
                                                style={{ fontSize: '2rem' }}
                                            />
                                            <p>Đang tải...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="empty-state">
                                        <div className="admin-empty-state">
                                            <FiPackage
                                                style={{
                                                    fontSize: '2.5rem',
                                                    color: 'var(--admin-border)',
                                                }}
                                            />
                                            <h4>Không có sản phẩm</h4>
                                            <p>
                                                Thử thay đổi từ khóa hoặc bộ lọc.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((p, index) => (
                                    <tr
                                        key={p.productId}
                                        className="animate-fade-in row-delay"
                                    >
                                        <td className="text-muted">{index + 1}</td>
                                        <td>
                                            <div className="product-thumb-cell">
                                                {p.images && p.images.length > 0 ? (
                                                    <img
                                                        src={p.images[0].imageUrl}
                                                        alt={p.productName || ''}
                                                        className="product-thumb"
                                                    />
                                                ) : (
                                                    <div className="product-thumb-placeholder">
                                                        —
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="product-info-cell">
                                                <span className="product-name">{p.productName || '—'}</span>
                                                {p.productDescription && (
                                                    <span className="product-desc">
                                                        {p.productDescription.length > 60
                                                            ? p.productDescription.slice(0, 60) + '...'
                                                            : p.productDescription}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="product-price-cell">
                                            {formatPrice(p.productPrice)}
                                        </td>
                                        <td>
                                            <span className="role-tag">{p.artisanName || '—'}</span>
                                        </td>
                                        <td className="text-muted">{p.quantity ?? 0}</td>
                                        <td>
                                            <span
                                                className={`status-badge ${getStatusBadgeClass(p.status)}`}
                                            >
                                                {p.status || '—'}
                                            </span>
                                        </td>
                                        <td className="text-muted text-small">
                                            {formatDate(p.createdAt)}
                                        </td>
                                        <td className="text-center">
                                            <div className="action-buttons">
                                                {isPending(p) && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="btn-action edit"
                                                            title="Duyệt"
                                                            onClick={() => openApproveModal(p)}
                                                        >
                                                            <FiCheck />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-action delete"
                                                            title="Từ chối"
                                                            onClick={() => openRejectModal(p)}
                                                        >
                                                            <FiX />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn-action trash"
                                                    title="Xóa"
                                                    onClick={() => openDeleteModal(p)}
                                                >
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

                {!loading && filteredProducts.length > 0 && (
                    <div className="table-footer">
                        <span className="showing-text">
                            Hiển thị {filteredProducts.length} / {products.length} sản phẩm
                        </span>
                    </div>
                )}
            </div>

            {/* Modal đổi trạng thái (Duyệt / Từ chối) */}
            {statusModal && (
                <div
                    className="detail-overlay"
                    onClick={closeStatusModal}
                    role="presentation"
                >
                    <div
                        className="detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="detail-modal-header">
                            <h3>
                                {statusModal.action === 'approve' ? 'Duyệt sản phẩm' : 'Từ chối sản phẩm'}
                            </h3>
                            <button type="button" className="detail-close" onClick={closeStatusModal} aria-label="Đóng">
                                &times;
                            </button>
                        </div>
                        <div className="detail-modal-body">
                            {statusError && (
                                <div className="product-manager-alert error" style={{ marginBottom: 12 }}>
                                    {statusError}
                                </div>
                            )}
                            <p style={{ marginBottom: 16 }}>
                                Sản phẩm: <strong>{statusModal.product.productName}</strong>
                            </p>
                            {statusModal.action === 'reject' && (
                                <div className="detail-row">
                                    <label className="detail-label">Lý do từ chối <span className="required">*</span></label>
                                    <textarea
                                        className="detail-edit-input"
                                        rows={4}
                                        placeholder="Nhập lý do từ chối..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        style={{ width: '100%', resize: 'vertical', minHeight: 80 }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="detail-modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={closeStatusModal}
                                disabled={statusLoading}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className={`btn ${statusModal.action === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                                onClick={handleStatusSubmit}
                                disabled={statusLoading || (statusModal.action === 'reject' && !rejectionReason.trim())}
                            >
                                {statusLoading ? 'Đang xử lý...' : statusModal.action === 'approve' ? 'Duyệt' : 'Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal xác nhận xóa */}
            {deleteModal && (
                <div className="detail-overlay" style={{ zIndex: 1100 }} role="presentation">
                    <div
                        className="detail-modal delete-confirm-modal"
                        style={{ maxWidth: 420 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="detail-modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-danger, #dc2626)' }}>
                                <FiAlertTriangle />
                                Xác nhận xóa
                            </h3>
                            <button
                                type="button"
                                className="detail-close"
                                onClick={closeDeleteModal}
                                disabled={deleteLoading}
                                aria-label="Đóng"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="detail-modal-body">
                            {deleteError && (
                                <div className="product-manager-alert error" style={{ marginBottom: 12 }}>
                                    {deleteError}
                                </div>
                            )}
                            <p style={{ margin: 0, lineHeight: 1.6 }}>
                                Bạn có chắc chắn muốn xóa sản phẩm <strong>{deleteModal.productName}</strong>?
                                <br />
                                Hành động này <strong>không thể hoàn tác</strong>.
                            </p>
                        </div>
                        <div className="detail-modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={closeDeleteModal}
                                disabled={deleteLoading}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={deleteLoading}
                            >
                                <FiTrash2 style={{ marginRight: 4 }} />
                                {deleteLoading ? 'Đang xóa...' : 'Xóa sản phẩm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManager;

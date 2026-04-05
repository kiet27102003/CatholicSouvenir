import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiRefreshCw, FiPackage, FiCheck, FiX, FiTrash2, FiAlertTriangle, FiEye } from 'react-icons/fi';
import productService from '../../services/productService';
import { appToast } from '../../lib/appToast';
import AdminTopbar from './AdminTopbar';
import './admin-common.css';
import './ProductManager.css';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Status change modal (approve/reject)
    const [statusModal, setStatusModal] = useState(null); // { product, action: 'approve' | 'reject' }
    const [rejectionReason, setRejectionReason] = useState('');
    const [statusLoading, setStatusLoading] = useState(false);

    // Delete confirmation
    const [deleteModal, setDeleteModal] = useState(null); // product
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Xem chi tiết sản phẩm
    const [detailProduct, setDetailProduct] = useState(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const result = await productService.getProducts();
            if (result.success && Array.isArray(result.data)) {
                setProducts(result.data);
            } else {
                setProducts([]);
                if (result.error) {
                    const msg = typeof result.error === 'string' ? result.error : 'Kiểm tra kết nối mạng';
                    appToast.error('Không tải được', msg);
                }
            }
        } catch (err) {
            const msg = err.message || 'Kiểm tra kết nối mạng';
            appToast.error('Không tải được', msg);
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
    };

    const openRejectModal = (p) => {
        setStatusModal({ product: p, action: 'reject' });
        setRejectionReason('');
    };

    const closeStatusModal = () => {
        setStatusModal(null);
        setRejectionReason('');
    };

    const handleStatusSubmit = async () => {
        if (!statusModal?.product?.productId) return;
        if (statusModal.action === 'reject' && !rejectionReason.trim()) {
            appToast.warning('Thiếu thông tin', 'Vui lòng nhập lý do từ chối.');
            return;
        }

        setStatusLoading(true);
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
                if (statusModal.action === 'approve') {
                    appToast.success('Đã cập nhật', 'Sản phẩm đã được duyệt');
                } else {
                    appToast.success('Đã cập nhật', 'Sản phẩm đã bị từ chối');
                }
                closeStatusModal();
            } else {
                const msg = result.error != null ? String(result.error) : 'Vui lòng thử lại';
                appToast.error('Có lỗi xảy ra', msg);
            }
        } catch (err) {
            const msg = err.message ?? 'Vui lòng thử lại';
            appToast.error('Có lỗi xảy ra', msg);
        } finally {
            setStatusLoading(false);
        }
    };

    const openDeleteModal = (p) => {
        setDeleteModal(p);
    };

    const closeDeleteModal = () => {
        setDeleteModal(null);
    };

    const handleDelete = async () => {
        if (!deleteModal?.productId) return;
        const productName = deleteModal.productName || 'Sản phẩm';
        setDeleteLoading(true);
        try {
            const result = await productService.deleteProduct(deleteModal.productId);
            if (result.success) {
                appToast.success('Đã xóa', `${productName} đã được xóa`);
                setProducts((prev) => prev.filter((p) => p.productId !== deleteModal.productId));
                closeDeleteModal();
            } else {
                const msg = result.error != null ? String(result.error) : 'Vui lòng thử lại';
                appToast.error('Có lỗi xảy ra', msg);
            }
        } catch (err) {
            const msg = err.message ?? 'Vui lòng thử lại';
            appToast.error('Có lỗi xảy ra', msg);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <>
            <AdminTopbar title="Quản lý sản phẩm" />
            <div className="admin-page product-manager-page">
            <div className="admin-page-header product-manager-header">
                <div>
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
                                <th width="120">Artisan</th>
                                <th width="120">Giá</th>
                                <th width="100">Trạng thái</th>
                                <th width="160" className="text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="empty-state">
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
                                    <td colSpan="7" className="empty-state">
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
                                                        src={p.images[0].image_url || p.images[0].imageUrl}
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
                                            </div>
                                        </td>
                                        <td>
                                            <span className="role-tag">{p.artisanName || '—'}</span>
                                        </td>
                                        <td className="product-price-cell">
                                            {formatPrice(p.productPrice)}
                                        </td>
                                        <td>
                                            <span
                                                className={`status-badge ${getStatusBadgeClass(p.status)}`}
                                            >
                                                {p.status || '—'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="action-buttons">
                                                <button
                                                    type="button"
                                                    className="btn-action view"
                                                    title="Xem chi tiết"
                                                    onClick={() => setDetailProduct(p)}
                                                >
                                                    <FiEye />
                                                </button>
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

            {/* Modal xem chi tiết sản phẩm */}
            {detailProduct && (
                <div
                    className="detail-overlay"
                    onClick={() => setDetailProduct(null)}
                    role="presentation"
                >
                    <div
                        className="detail-modal product-detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="detail-modal-header">
                            <h3>Chi tiết sản phẩm</h3>
                            <button type="button" className="detail-close" onClick={() => setDetailProduct(null)} aria-label="Đóng">
                                &times;
                            </button>
                        </div>
                        <div className="detail-modal-body product-detail-body">
                            <div className="product-detail-left">
                                <div className="product-detail-images">
                                    {detailProduct.images && detailProduct.images.length > 0 ? (
                                        detailProduct.images.map((img, i) => (
                                            <img key={img.id || i} src={img.image_url || img.imageUrl} alt={`${detailProduct.productName} ${i + 1}`} className="product-detail-img" />
                                        ))
                                    ) : (
                                        <div className="product-detail-img-placeholder">Chưa có ảnh</div>
                                    )}
                                </div>
                            </div>
                            <div className="product-detail-right">
                                <div className="detail-row">
                                    <span className="detail-label">Mô tả</span>
                                    <span className="detail-value">{detailProduct.productDescription || '—'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Chất liệu</span>
                                    <span className="detail-value">{detailProduct.material || '—'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Kích thước</span>
                                    <span className="detail-value">{detailProduct.size || '—'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Số lượng</span>
                                    <span className="detail-value">{detailProduct.quantity ?? '—'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Ngày tạo</span>
                                    <span className="detail-value">{formatDate(detailProduct.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="detail-modal-footer">
                            <button type="button" className="btn btn-outline" onClick={() => setDetailProduct(null)}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
        </>
    );
};

export default ProductManager;

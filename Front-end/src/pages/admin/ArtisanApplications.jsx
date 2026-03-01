import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiFileText, FiEye } from 'react-icons/fi';
import api from '../../cofig/api';
import './admin-common.css';
import './UserManager.css';
import './ArtisanApplications.css';

const API_URL = '/artisan-applications/pending';

const REVIEW_API = '/artisan-applications';

const ArtisanApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [detailApp, setDetailApp] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectionModal, setRejectionModal] = useState({ open: false, applicationId: null, reason: '', error: null });

    const fetchPending = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(API_URL);
            const payload = res.data;
            const list = payload?.data ?? (Array.isArray(payload) ? payload : []);
            setApplications(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Không tải được danh sách.');
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const submitReview = async (applicationId, approved, rejectionReason = '') => {
        await api.put(`${REVIEW_API}/${applicationId}/review`, {
            approved,
            rejectionReason: rejectionReason || '',
        });
        setError(null);
        setDetailApp(null);
        setRejectionModal({ open: false, applicationId: null, reason: '', error: null });
        fetchPending();
    };

    const handleApprove = async (item) => {
        const id = item.applicationId;
        if (!id) return;
        setActionLoading(id);
        setError(null);
        try {
            await submitReview(id, true, '');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Không thể duyệt đơn.');
        } finally {
            setActionLoading(null);
        }
    };

    const openRejectionModal = (item) => {
        setDetailApp(null);
        setRejectionModal({ open: true, applicationId: item.applicationId, reason: '', error: null });
    };

    const closeRejectionModal = () => {
        setRejectionModal({ open: false, applicationId: null, reason: '', error: null });
    };

    const handleConfirmReject = async () => {
        const { applicationId, reason } = rejectionModal;
        const trimmed = (reason || '').trim();
        if (!trimmed) {
            setRejectionModal((prev) => ({ ...prev, error: 'Vui lòng nhập lý do từ chối.' }));
            return;
        }
        setActionLoading(applicationId);
        setRejectionModal((prev) => ({ ...prev, error: null }));
        try {
            await submitReview(applicationId, false, trimmed);
        } catch (err) {
            setRejectionModal((prev) => ({
                ...prev,
                error: err.response?.data?.message || err.message || 'Không thể từ chối đơn.',
            }));
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadgeClass = (status) => {
        if (!status) return 'badge-secondary';
        const s = String(status).toLowerCase();
        if (s === 'approved' || s === 'active') return 'badge-success';
        if (s === 'rejected' || s === 'denied') return 'badge-danger';
        return 'badge-warning';
    };

    const formatDate = (val) => {
        if (val == null || val === '') return '—';
        try {
            return new Date(val).toLocaleString('vi-VN');
        } catch {
            return String(val);
        }
    };

    const displayItem = (item, index) => {
        const name = item.accountFullName ?? '—';
        const experienceYear = item.experienceYear != null ? `${item.experienceYear} năm` : '—';
        const specialization = item.specialization ?? '—';
        const portfolioUrl = item.portfolioUrl?.trim() || null;

        return (
            <tr key={item.applicationId ?? index}>
                <td className="text-muted">{index + 1}</td>
                <td>
                    <span className="user-name">{name}</span>
                </td>
                <td>{experienceYear}</td>
                <td>{specialization}</td>
                <td>
                    {portfolioUrl ? (
                        <a
                            href={portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="portfolio-link"
                        >
                            Xem portfolio
                        </a>
                    ) : (
                        <span className="text-muted">—</span>
                    )}
                </td>
                <td className="text-right">
                    <div className="action-buttons">
                        <button
                            type="button"
                            className="btn-action more"
                            title="Xem chi tiết"
                            onClick={() => setDetailApp(item)}
                        >
                            <FiEye />
                        </button>
                        <button
                            type="button"
                            className="btn-action edit"
                            title="Duyệt"
                            onClick={() => handleApprove(item)}
                            disabled={actionLoading === item.applicationId}
                        >
                            {actionLoading === item.applicationId ? <FiRefreshCw className="spin" /> : <FiCheck />}
                        </button>
                        <button
                            type="button"
                            className="btn-action delete"
                            title="Từ chối"
                            onClick={() => openRejectionModal(item)}
                            disabled={actionLoading === item.applicationId}
                        >
                            <FiX />
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="admin-page artisan-applications-page">
            <div className="admin-page-header artisan-applications-header">
                <div>
                    <h2>Artisan Application</h2>
                    <p className="admin-page-subtitle">Duyệt đơn đăng ký trở thành thợ thủ công.</p>
                </div>
                <button
                    type="button"
                    className="btn btn-outline btn-icon"
                    onClick={fetchPending}
                    disabled={loading}
                >
                    <FiRefreshCw className={loading ? 'spin' : ''} />
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            {error && (
                <div className="artisan-app-alert error">
                    {error}
                </div>
            )}

            <div className="admin-card table-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th width="50">#</th>
                                <th width="200">Họ tên</th>
                                <th width="120">Số năm kinh nghiệm</th>
                                <th width="140">Chuyên môn</th>
                                <th width="140">Portfolio</th>
                                <th width="160" className="text-right">Thao tác</th>
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
                            ) : applications.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-state">
                                        <div className="admin-empty-state">
                                            <FiFileText style={{ fontSize: '2.5rem', color: 'var(--admin-border)' }} />
                                            <h4>Không có đơn chờ duyệt</h4>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                applications.map((item, index) => displayItem(item, index))
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && applications.length > 0 && (
                    <div className="table-footer">
                        <span className="showing-text">
                            Hiển thị {applications.length} đơn chờ duyệt
                        </span>
                    </div>
                )}
            </div>

            {/* Modal chi tiết đơn */}
            {detailApp && (
                <div className="detail-overlay" onClick={() => setDetailApp(null)}>
                    <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-modal-header">
                            <h3>Chi tiết đơn đăng ký</h3>
                            <button
                                type="button"
                                className="detail-close"
                                onClick={() => setDetailApp(null)}
                                aria-label="Đóng"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="detail-modal-body">
                            <div className="detail-row">
                                <span className="detail-label">Họ tên</span>
                                <span className="detail-value">{detailApp.accountFullName ?? '—'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{detailApp.accountEmail ?? '—'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Tên xưởng / Nghệ nhân</span>
                                <span className="detail-value">{detailApp.artisanName ?? '—'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Chuyên môn</span>
                                <span className="detail-value">{detailApp.specialization ?? '—'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Số năm kinh nghiệm</span>
                                <span className="detail-value">
                                    {detailApp.experienceYear != null ? `${detailApp.experienceYear} năm` : '—'}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Giới thiệu</span>
                                <span className="detail-value">{detailApp.bio ?? '—'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Portfolio URL</span>
                                <span className="detail-value">
                                    {detailApp.portfolioUrl ? (
                                        <a
                                            href={detailApp.portfolioUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="portfolio-link"
                                        >
                                            {detailApp.portfolioUrl}
                                        </a>
                                    ) : (
                                        '—'
                                    )}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Lời nhắn</span>
                                <span className="detail-value">{detailApp.message ?? '—'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Ngày nộp</span>
                                <span className="detail-value">{formatDate(detailApp.submittedDate)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Trạng thái</span>
                                <span className={`status-badge ${getStatusBadgeClass(detailApp.status)}`}>
                                    {detailApp.status ?? '—'}
                                </span>
                            </div>
                            {detailApp.reviewedByName && (
                                <div className="detail-row">
                                    <span className="detail-label">Người duyệt</span>
                                    <span className="detail-value">{detailApp.reviewedByName}</span>
                                </div>
                            )}
                            {detailApp.reviewedDate && (
                                <div className="detail-row">
                                    <span className="detail-label">Ngày duyệt</span>
                                    <span className="detail-value">{formatDate(detailApp.reviewedDate)}</span>
                                </div>
                            )}
                            {detailApp.rejectionReason && (
                                <div className="detail-row">
                                    <span className="detail-label">Lý do từ chối</span>
                                    <span className="detail-value rejection">{detailApp.rejectionReason}</span>
                                </div>
                            )}
                            <div className="detail-row detail-ids">
                                <span className="detail-label">Application ID</span>
                                <span className="detail-value mono">{detailApp.applicationId ?? '—'}</span>
                            </div>
                            <div className="detail-row detail-ids">
                                <span className="detail-label">Account ID</span>
                                <span className="detail-value mono">{detailApp.accountId ?? '—'}</span>
                            </div>
                        </div>
                        <div className="detail-modal-footer">
                            <button type="button" className="btn btn-outline" onClick={() => setDetailApp(null)}>
                                Đóng
                            </button>
                            <button
                                type="button"
                                className="btn-action edit"
                                title="Duyệt"
                                onClick={() => handleApprove(detailApp)}
                                disabled={actionLoading === detailApp.applicationId}
                            >
                                {actionLoading === detailApp.applicationId ? (
                                    <FiRefreshCw className="spin" /> 
                                ) : (
                                    <FiCheck />
                                )}{' '}
                                Duyệt
                            </button>
                            <button
                                type="button"
                                className="btn-action delete"
                                title="Từ chối"
                                onClick={() => openRejectionModal(detailApp)}
                                disabled={actionLoading === detailApp.applicationId}
                            >
                                <FiX /> Từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal nhập lý do từ chối */}
            {rejectionModal.open && (
                <div className="detail-overlay" onClick={closeRejectionModal}>
                    <div className="detail-modal rejection-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-modal-header">
                            <h3>Từ chối đơn đăng ký</h3>
                            <button
                                type="button"
                                className="detail-close"
                                onClick={closeRejectionModal}
                                aria-label="Đóng"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="detail-modal-body">
                            <label className="detail-label" htmlFor="rejection-reason">
                                Lý do từ chối <span className="required">*</span>
                            </label>
                            <textarea
                                id="rejection-reason"
                                className="rejection-textarea"
                                placeholder="Nhập lý do từ chối..."
                                value={rejectionModal.reason}
                                onChange={(e) =>
                                    setRejectionModal((prev) => ({ ...prev, reason: e.target.value, error: null }))
                                }
                                rows={4}
                                disabled={!!actionLoading}
                            />
                            {rejectionModal.error && (
                                <div className="artisan-app-alert error" style={{ marginTop: 12 }}>
                                    {rejectionModal.error}
                                </div>
                            )}
                        </div>
                        <div className="detail-modal-footer">
                            <button type="button" className="btn btn-outline" onClick={closeRejectionModal}>
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn-action delete"
                                onClick={handleConfirmReject}
                                disabled={!!actionLoading}
                            >
                                {actionLoading ? <FiRefreshCw className="spin" /> : <FiX />} Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArtisanApplications;

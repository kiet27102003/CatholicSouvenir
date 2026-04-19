import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import complaintService from '../../services/complaintService';
import './AdminComplaintManagementPage.css';

const PAGE_SIZE = 10;
const COMPLAINT_STATUS_OPTIONS = ['PENDING', 'WAITING_RETURN', 'PROCESSING_REFUND', 'APPROVED', 'REJECTED'];
const REFUND_STATUS_OPTIONS = ['PENDING', 'COMPLETED', 'FAILED'];

const formatDateTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

const AdminComplaintManagementPage = () => {
    const { isAuthenticated, user } = useAuth();
    const role = String(user?.role || '').toUpperCase();
    const canView = role === 'ADMIN';

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [refundItems, setRefundItems] = useState([]);
    const [selected, setSelected] = useState(null);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [refundStatusFilter, setRefundStatusFilter] = useState('');
    const [refundPage, setRefundPage] = useState(0);
    const [refundTotalPages, setRefundTotalPages] = useState(1);
    const [detailMode, setDetailMode] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const loadComplaints = async () => {
        setLoading(true);
        const res = await complaintService.getAdminComplaints({ status: statusFilter || undefined, page, size: PAGE_SIZE });
        if (!res.success) {
            appToast.error('Không tải được danh sách khiếu nại', res.error || 'Vui lòng thử lại sau');
            setItems([]);
            setTotalPages(1);
        } else {
            const data = res.data || {};
            setItems(Array.isArray(data.content) ? data.content : complaintService.toArray(data));
            setTotalPages(Number(data.totalPages || 1));
        }
        setLoading(false);
    };

    const loadRefundTransactions = async () => {
        const res = await complaintService.getAdminRefundTransactions({ status: refundStatusFilter || undefined, page: refundPage, size: PAGE_SIZE });
        if (!res.success) {
            appToast.error('Không tải được danh sách hoàn tiền', res.error || 'Vui lòng thử lại sau');
            setRefundItems([]);
            setRefundTotalPages(1);
            return;
        }
        const data = res.data || {};
        setRefundItems(Array.isArray(data.content) ? data.content : complaintService.toArray(data));
        setRefundTotalPages(Number(data.totalPages || 1));
    };

    useEffect(() => {
        if (!isAuthenticated || !canView) return;
        loadComplaints();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, canView, page, statusFilter]);

    useEffect(() => {
        if (!isAuthenticated || !canView) return;
        loadRefundTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, canView, refundPage, refundStatusFilter]);

    const filteredItems = useMemo(() => items, [items]);

    const openDetail = async (item) => {
        setSelected(item);
        setSelectedDetail(null);
        setDetailMode(true);
        const res = await complaintService.getAdminComplaintDetail(item.complaintId || item.id);
        if (!res.success) {
            appToast.error('Không tải được chi tiết', res.error || 'Vui lòng thử lại sau');
            return;
        }
        setSelectedDetail(res.data || item);
        setRefundAmount(String(res.data?.refundAmount ?? item.refundAmount ?? ''));
        setAdminNote(res.data?.adminNote || '');
        setRejectionReason(res.data?.rejectionReason || '');
    };

    const handleApprove = async () => {
        if (!selected?.complaintId) return;
        setActionLoading(true);
        const res = await complaintService.approveAdminComplaint(selected.complaintId, { refundAmount, adminNote });
        setActionLoading(false);
        if (!res.success) return appToast.error('Phê duyệt thất bại', res.error || 'Vui lòng thử lại sau');
        appToast.success('Đã phê duyệt khiếu nại');
        setDetailMode(false);
        await loadComplaints();
        await loadRefundTransactions();
    };

    const handleReject = async () => {
        if (!selected?.complaintId) return;
        setActionLoading(true);
        const res = await complaintService.rejectAdminComplaint(selected.complaintId, { rejectionReason });
        setActionLoading(false);
        if (!res.success) return appToast.error('Từ chối thất bại', res.error || 'Vui lòng thử lại sau');
        appToast.success('Đã từ chối khiếu nại');
        setDetailMode(false);
        await loadComplaints();
    };

    const handleRetryRefund = async (transactionId) => {
        setActionLoading(true);
        const res = await complaintService.retryAdminRefundTransaction(transactionId);
        setActionLoading(false);
        if (!res.success) return appToast.error('Thử lại thất bại', res.error || 'Vui lòng thử lại sau');
        appToast.success('Đã thử lại giao dịch hoàn tiền');
        await loadRefundTransactions();
    };

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!canView) return <Navigate to="/" replace />;

    return (
        <div className="admin-complaint-page">
            <div className="admin-complaint-header">
                <div>
                    <h1>Quản lý khiếu nại</h1>
                    <p>Duyệt, từ chối và xử lý hoàn tiền cho complaint</p>
                </div>
            </div>

            <div className="admin-complaint-toolbar">
                <select value={statusFilter} onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}>
                    <option value="">Tất cả trạng thái complaint</option>
                    {COMPLAINT_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <select value={refundStatusFilter} onChange={(e) => { setRefundPage(0); setRefundStatusFilter(e.target.value); }}>
                    <option value="">Tất cả trạng thái hoàn tiền</option>
                    {REFUND_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
            </div>

            <section className="admin-complaint-section">
                <h2>Danh sách khiếu nại</h2>
                {loading ? <div className="admin-complaint-empty">Đang tải dữ liệu...</div> : filteredItems.length === 0 ? <div className="admin-complaint-empty">Chưa có khiếu nại nào</div> : (
                    <div className="admin-complaint-list">
                        {filteredItems.map((item) => (
                            <button key={item.complaintId} type="button" className="admin-complaint-card" onClick={() => openDetail(item)}>
                                <strong>#{String(item.complaintId || '').slice(0, 8)}</strong>
                                <span>{item.status || '—'}</span>
                                <p>{item.reason || '—'}</p>
                                <small>{item.customerName || '—'} • {item.artisanName || '—'}</small>
                            </button>
                        ))}
                    </div>
                )}
                <div className="admin-complaint-pagination">
                    <button type="button" disabled={page <= 0} onClick={() => setPage((prev) => prev - 1)}>Trước</button>
                    <span>Trang {page + 1}/{totalPages}</span>
                    <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Sau</button>
                </div>
            </section>

            <section className="admin-complaint-section">
                <h2>Giao dịch hoàn tiền</h2>
                {refundItems.length === 0 ? <div className="admin-complaint-empty">Chưa có giao dịch hoàn tiền nào</div> : (
                    <div className="admin-refund-list">
                        {refundItems.map((item) => (
                            <div key={item.refundTransactionId} className="admin-refund-card">
                                <strong>{item.status || '—'}</strong>
                                <p>Số tiền: {item.amount ?? 0}</p>
                                <p>{item.fromWalletOwnerName || '—'} → {item.toWalletOwnerName || '—'}</p>
                                <small>{formatDateTime(item.createdAt)}</small>
                                {item.status === 'FAILED' && (
                                    <button type="button" onClick={() => handleRetryRefund(item.refundTransactionId)} disabled={actionLoading}>
                                        Thử lại
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <div className="admin-complaint-pagination">
                    <button type="button" disabled={refundPage <= 0} onClick={() => setRefundPage((prev) => prev - 1)}>Trước</button>
                    <span>Trang {refundPage + 1}/{refundTotalPages}</span>
                    <button type="button" disabled={refundPage + 1 >= refundTotalPages} onClick={() => setRefundPage((prev) => prev + 1)}>Sau</button>
                </div>
            </section>

            {detailMode && selected && (
                <div className="admin-complaint-modal-backdrop" onClick={() => setDetailMode(false)} role="presentation">
                    <div className="admin-complaint-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <h2>Chi tiết khiếu nại</h2>
                        <p><strong>Mã:</strong> {selectedDetail?.complaintId || selected.complaintId}</p>
                        <p><strong>Trạng thái:</strong> {selectedDetail?.status || selected.status}</p>
                        <p><strong>Khách hàng:</strong> {selectedDetail?.customerName || '—'}</p>
                        <p><strong>Artisan:</strong> {selectedDetail?.artisanName || '—'}</p>
                        <p><strong>Lý do:</strong> {selectedDetail?.reason || selected.reason}</p>
                        <p><strong>Bằng chứng:</strong> {(selectedDetail?.evidenceImages || []).length}</p>
                        <p><strong>Trả hàng:</strong> {selectedDetail?.requireReturn ? 'Có' : 'Không'}</p>
                        <p><strong>Phản hồi artisan:</strong> {selectedDetail?.artisanResponse || '—'}</p>

                        <div className="admin-complaint-form-grid">
                            <input value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="Số tiền hoàn" />
                            <input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Ghi chú admin" />
                            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Lý do từ chối" />
                        </div>

                        <div className="admin-complaint-modal-actions">
                            <button type="button" onClick={() => setDetailMode(false)}>Đóng</button>
                            <button type="button" onClick={handleApprove} disabled={actionLoading}>Phê duyệt</button>
                            <button type="button" onClick={handleReject} disabled={actionLoading}>Từ chối</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminComplaintManagementPage;

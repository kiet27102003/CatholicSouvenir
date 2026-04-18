import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import complaintService from '../../services/complaintService';
import './ComplaintCenterPage.css';

const PAGE_SIZE = 10;

const formatDateTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

const ComplaintCenterPage = () => {
    const { user, isAuthenticated } = useAuth();
    const role = String(user?.role || '').toUpperCase();
    const canView = role === 'CUSTOMER' || role === 'ARTISAN' || role === 'ADMIN';

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [selected, setSelected] = useState(null);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [detailMode, setDetailMode] = useState(false);
    const [responseText, setResponseText] = useState('');
    const [requireReturn, setRequireReturn] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const loadList = async (nextPage = page) => {
        setLoading(true);
        const res = await complaintService.getMyComplaints({ page: nextPage, size: PAGE_SIZE });
        if (!res.success) {
            appToast.error('Không tải được khiếu nại', res.error || 'Vui lòng thử lại sau');
            setItems([]);
        } else {
            const data = res.data || {};
            setItems(Array.isArray(data.content) ? data.content : complaintService.toArray(data));
            setTotalPages(Number(data.totalPages || 1));
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!isAuthenticated || !canView) return;
        loadList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, canView, page]);

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        return items.filter((item) => {
            const text = `${item.reason || ''} ${item.status || ''}`.toLowerCase();
            return !query || text.includes(query);
        });
    }, [items, search]);

    const openDetail = async (item) => {
        setSelected(item);
        setDetailMode(true);
        setSelectedDetail(null);
        const res = await complaintService.getComplaintDetail(item.complaintId || item.id);
        if (!res.success) {
            appToast.error('Không tải được chi tiết', res.error || 'Vui lòng thử lại sau');
            return;
        }
        setSelectedDetail(res.data || item);
    };

    const handleRespond = async () => {
        if (!selected?.complaintId) return;
        if (responseText.trim().length < 20) {
            appToast.error('Phản hồi quá ngắn', 'Vui lòng nhập ít nhất 20 ký tự');
            return;
        }
        setActionLoading(true);
        const res = await complaintService.respondComplaint(selected.complaintId, { response: responseText, requireReturn });
        setActionLoading(false);
        if (!res.success) {
            appToast.error('Phản hồi thất bại', res.error || 'Vui lòng thử lại sau');
            return;
        }
        appToast.success('Đã gửi phản hồi khiếu nại');
        await loadList(page);
        setDetailMode(false);
    };

    const handleApprove = async () => {
        if (!selected?.complaintId) return;
        setActionLoading(true);
        const res = await complaintService.approveComplaint(selected.complaintId, {
            refundAmount,
            adminNote,
        });
        setActionLoading(false);
        if (!res.success) {
            appToast.error('Phê duyệt thất bại', res.error || 'Vui lòng thử lại sau');
            return;
        }
        appToast.success('Đã phê duyệt khiếu nại');
        await loadList(page);
    };

    const handleReject = async () => {
        if (!selected?.complaintId) return;
        setActionLoading(true);
        const res = await complaintService.rejectComplaint(selected.complaintId, {
            rejectionReason,
        });
        setActionLoading(false);
        if (!res.success) {
            appToast.error('Từ chối thất bại', res.error || 'Vui lòng thử lại sau');
            return;
        }
        appToast.success('Đã từ chối khiếu nại');
        await loadList(page);
    };

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!canView) return <Navigate to="/" replace />;

    return (
        <div className="complaint-center-page">
            <div className="complaint-center-header">
                <div>
                    <h1>Trung tâm khiếu nại</h1>
                    <p>Quản lý complaint, hoàn tiền và trả hàng</p>
                </div>
            </div>

            <div className="complaint-center-toolbar">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo lý do hoặc trạng thái" />
            </div>

            {loading ? (
                <div className="complaint-empty">Đang tải dữ liệu...</div>
            ) : filteredItems.length === 0 ? (
                <div className="complaint-empty">Chưa có khiếu nại nào</div>
            ) : (
                <div className="complaint-list">
                    {filteredItems.map((item) => (
                        <button key={item.complaintId} type="button" className="complaint-card" onClick={() => openDetail(item)}>
                            <strong>#{String(item.complaintId || '').slice(0, 8)}</strong>
                            <span>{item.status || '—'}</span>
                            <p>{item.reason || '—'}</p>
                            <small>{formatDateTime(item.createdAt)}</small>
                        </button>
                    ))}
                </div>
            )}

            {detailMode && selected && (
                <div className="complaint-modal-backdrop" onClick={() => setDetailMode(false)} role="presentation">
                    <div className="complaint-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <h2>Chi tiết khiếu nại</h2>
                        <p><strong>Mã:</strong> {selectedDetail?.complaintId || selected.complaintId}</p>
                        <p><strong>Trạng thái:</strong> {selectedDetail?.status || selected.status}</p>
                        <p><strong>Lý do:</strong> {selectedDetail?.reason || selected.reason}</p>
                        <p><strong>Ảnh bằng chứng:</strong> {(selectedDetail?.evidenceImages || []).length}</p>
                        <p><strong>Khách hàng:</strong> {selectedDetail?.customerName || '—'}</p>
                        <p><strong>Artisan:</strong> {selectedDetail?.artisanName || '—'}</p>

                        <div className="complaint-form-grid">
                            <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Phản hồi artisan hoặc admin note" />
                            <label>
                                <input type="checkbox" checked={requireReturn} onChange={(e) => setRequireReturn(e.target.checked)} />
                                Yêu cầu trả hàng
                            </label>
                            <input value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="Số tiền hoàn" />
                            <input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Ghi chú admin" />
                            <input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Lý do từ chối" />
                        </div>

                        <div className="complaint-modal-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setDetailMode(false)}>Đóng</button>
                            {role === 'ARTISAN' && <button type="button" className="btn btn-primary" onClick={handleRespond} disabled={actionLoading}>Gửi phản hồi</button>}
                            {role === 'ADMIN' && <button type="button" className="btn btn-primary" onClick={handleApprove} disabled={actionLoading}>Phê duyệt</button>}
                            {role === 'ADMIN' && <button type="button" className="btn btn-outline" onClick={handleReject} disabled={actionLoading}>Từ chối</button>}
                        </div>
                    </div>
                </div>
            )}

            <div className="complaint-pagination">
                <button type="button" className="btn btn-outline" disabled={page <= 0} onClick={() => setPage((prev) => prev - 1)}>Trước</button>
                <span>Trang {page + 1}/{totalPages}</span>
                <button type="button" className="btn btn-outline" disabled={page + 1 >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Sau</button>
            </div>
        </div>
    );
};

export default ComplaintCenterPage;

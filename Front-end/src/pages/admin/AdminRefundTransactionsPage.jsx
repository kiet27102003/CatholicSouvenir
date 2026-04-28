import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import complaintService from '../../services/complaintService';
import './AdminRefundTransactionsPage.css';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_REFUNDED'];
const STATUS_LABELS = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý (3–7 ngày)',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  PARTIALLY_REFUNDED: 'Hoàn tiền một phần',
};

const AdminRefundTransactionsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const role = String(user?.role || '').toUpperCase();
  const canView = role === 'ADMIN';
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [retryingId, setRetryingId] = useState('');

  const loadData = async () => {
    setLoading(true);
    const res = await complaintService.getAdminRefundTransactions({ status: statusFilter || undefined, page, size: PAGE_SIZE });
    if (!res.success) {
      appToast.error('Không tải được danh sách hoàn tiền', res.error || 'Vui lòng thử lại');
      setItems([]);
      setTotalPages(1);
    } else {
      const data = res.data || {};
      setItems(Array.isArray(data.content) ? data.content : complaintService.toArray(data));
      setTotalPages(Number(data.totalPages || 1));
    }
    setLoading(false);
  };

  useEffect(() => { if (isAuthenticated && canView) loadData(); }, [isAuthenticated, canView, page, statusFilter]);

  const stats = useMemo(() => ({ total: items.length, failed: items.filter((i) => String(i.status).toUpperCase() === 'FAILED').length }), [items]);

  const handleRetry = async (id) => {
    setRetryingId(id);
    const res = await complaintService.retryAdminRefundTransaction(id);
    setRetryingId('');
    if (!res.success) return appToast.error('Retry thất bại', res.error || 'Vui lòng thử lại');
    appToast.success('Đã gửi yêu cầu retry hoàn tiền');
    await loadData();
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!canView) return <Navigate to="/" replace />;

  return (
    <div className="admin-refund-page">
      <header className="admin-refund-header">
        <h1>Quản lý hoàn tiền VNPay</h1>
        <p>Tổng giao dịch: {stats.total} · Thất bại: {stats.failed}</p>
      </header>

      <section className="admin-refund-toolbar">
        <select value={statusFilter} onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}>
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </section>

      <section className="admin-refund-list">
        {loading ? <div className="admin-refund-empty">Đang tải...</div> : items.length === 0 ? <div className="admin-refund-empty">Chưa có giao dịch nào</div> : items.map((item) => (
          <article key={item.refundTransactionId} className="admin-refund-card">
            <div><strong>{item.refundTransactionId}</strong><p>{STATUS_LABELS[String(item.status).toUpperCase()] || item.status}</p></div>
            <div><span>Số tiền</span><strong>{Number(item.amount || 0).toLocaleString('vi-VN')} đ</strong></div>
            <div><span>VNPay refund ID</span><strong>{item.vnpayRefundId || '—'}</strong></div>
            <div><span>VNPay Txn No</span><strong>{item.vnpayTransactionNo || '—'}</strong></div>
            <div><span>Lý do lỗi</span><strong>{item.failureReason || '—'}</strong></div>
            {String(item.status || '').toUpperCase() === 'FAILED' && (
              <button type="button" onClick={() => handleRetry(item.refundTransactionId)} disabled={retryingId === item.refundTransactionId}>Retry</button>
            )}
          </article>
        ))}
      </section>

      <div className="admin-refund-pagination">
        <button type="button" disabled={page <= 0} onClick={() => setPage((v) => v - 1)}>Trước</button>
        <span>Trang {page + 1}/{totalPages}</span>
        <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((v) => v + 1)}>Sau</button>
      </div>
    </div>
  );
};

export default AdminRefundTransactionsPage;

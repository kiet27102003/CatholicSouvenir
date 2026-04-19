import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCreditCard, FiExternalLink, FiLoader, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { getPayments } from '../../services/paymentService';
import PaymentStatusBadge from '../../components/payment/PaymentStatusBadge';
import './PaymentPage.css';

const formatCurrency = (value) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date);
};

const PaymentPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [payments, setPayments] = useState([]);
    const [query, setQuery] = useState('');

    const loadPayments = async () => {
        setLoading(true);
        setError('');
        const result = await getPayments();
        if (!result.success) {
            setError(result.error || 'Không tải được lịch sử thanh toán.');
            setPayments([]);
        } else {
            setPayments(result.data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const filteredPayments = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        if (!keyword) return payments;
        return payments.filter((item) =>
            [item.paymentId, item.orderGroupId, item.transactionId, item.paymentMethod, item.paymentStatus]
                .filter(Boolean)
                .some((field) => String(field).toLowerCase().includes(keyword))
        );
    }, [payments, query]);

    return (
        <div className="payment-page">
            <section className="profile-block profile-section">
                <div className="profile-section-header">
                    <div className="profile-section-title-wrap">
                        <FiCreditCard size={22} strokeWidth={2} className="profile-section-icon" />
                        <h1 className="profile-section-title">Quản lý thanh toán</h1>
                    </div>
                    <button type="button" className="btn btn-outline" onClick={loadPayments} disabled={loading}>
                        {loading ? <FiLoader className="spin" /> : <FiRefreshCw size={16} />}
                        Làm mới
                    </button>
                </div>
                <div className="profile-section-divider" aria-hidden="true" />
                <p className="payment-page-desc">Theo dõi danh sách giao dịch, trạng thái thanh toán và tra cứu chi tiết từng giao dịch.</p>

                <div className="payment-page-toolbar">
                    <div className="payment-search">
                        <FiSearch size={18} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tìm theo mã payment, order group, transaction..."
                        />
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/orders')}>
                        Xem đơn hàng
                    </button>
                </div>

                {loading ? (
                    <div className="payment-state">Đang tải danh sách thanh toán...</div>
                ) : error ? (
                    <div className="payment-state payment-state-error">
                        <p>{error}</p>
                        <button type="button" className="btn btn-outline" onClick={loadPayments}>Thử lại</button>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="payment-state">Chưa có dữ liệu thanh toán phù hợp.</div>
                ) : (
                    <div className="payment-table-wrap">
                        <table className="payment-table">
                            <thead>
                                <tr>
                                    <th>Mã thanh toán</th>
                                    <th>Đơn nhóm</th>
                                    <th>Phương thức</th>
                                    <th>Số tiền</th>
                                    <th>Trạng thái</th>
                                    <th>Giao dịch</th>
                                    <th>Thời gian</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.paymentId}>
                                        <td>
                                            <div className="payment-cell-main">{payment.paymentId}</div>
                                        </td>
                                        <td>{payment.orderGroupId || '—'}</td>
                                        <td>{payment.paymentMethod || '—'}</td>
                                        <td>{formatCurrency(payment.amount)}</td>
                                        <td><PaymentStatusBadge status={payment.paymentStatus} /></td>
                                        <td>{payment.transactionId || '—'}</td>
                                        <td>
                                            <div className="payment-date-stack">
                                                <span>Tạo: {formatDateTime(payment.createdAt)}</span>
                                                <span>Thanh toán: {formatDateTime(payment.paidAt)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <button type="button" className="payment-link-btn" onClick={() => navigate(`/payments/${payment.paymentId}`)}>
                                                <FiExternalLink size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default PaymentPage;

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCreditCard, FiLoader, FiRefreshCw } from 'react-icons/fi';
import api from '../../cofig/api';
import PaymentStatusBadge from '../../components/payment/PaymentStatusBadge';
import './PaymentDetailPage.css';

const formatCurrency = (value) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const Field = ({ label, value }) => (
    <div className="payment-detail-field">
        <span>{label}</span>
        <strong>{value || '—'}</strong>
    </div>
);

const PaymentDetailPage = () => {
    const { paymentId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [payment, setPayment] = useState(null);

    const loadDetail = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/payments/${paymentId}`);
            const data = response?.data?.data ?? response?.data ?? null;
            setPayment(data);
        } catch (err) {
            setError(err?.response?.data?.message || 'Không tải được chi tiết thanh toán.');
            setPayment(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
    }, [paymentId]);

    return (
        <div className="payment-detail-page">
            <Link to="/payments" className="payment-detail-back">
                <FiArrowLeft size={16} /> Quay lại danh sách
            </Link>

            <section className="profile-block profile-section">
                <div className="profile-section-header">
                    <div className="profile-section-title-wrap">
                        <FiCreditCard size={22} strokeWidth={2} className="profile-section-icon" />
                        <h1 className="profile-section-title">Chi tiết thanh toán</h1>
                    </div>
                    <button type="button" className="btn btn-outline" onClick={loadDetail} disabled={loading}>
                        {loading ? <FiLoader className="spin" /> : <FiRefreshCw size={16} />}
                        Làm mới
                    </button>
                </div>
                <div className="profile-section-divider" aria-hidden="true" />

                {loading ? (
                    <div className="payment-state">Đang tải chi tiết thanh toán...</div>
                ) : error ? (
                    <div className="payment-state payment-state-error">
                        <p>{error}</p>
                        <button type="button" className="btn btn-outline" onClick={loadDetail}>Thử lại</button>
                    </div>
                ) : !payment ? (
                    <div className="payment-state">Không tìm thấy thanh toán.</div>
                ) : (
                    <div className="payment-detail-card">
                        <div className="payment-detail-top">
                            <div>
                                <p className="payment-detail-label">Payment ID</p>
                                <h2>{payment.paymentId}</h2>
                            </div>
                            <PaymentStatusBadge status={payment.paymentStatus} />
                        </div>

                        <div className="payment-detail-grid">
                            <Field label="Order Group" value={payment.orderGroupId} />
                            <Field label="Order ID" value={payment.orderId} />
                            <Field label="Phương thức" value={payment.paymentMethod} />
                            <Field label="Số tiền" value={formatCurrency(payment.amount)} />
                            <Field label="Giao dịch" value={payment.transactionId} />
                            <Field label="Tạo lúc" value={formatDateTime(payment.createdAt)} />
                            <Field label="Thanh toán lúc" value={formatDateTime(payment.paidAt)} />
                            <Field label="Lý do thất bại" value={payment.failureReason} />
                        </div>

                        {payment.paymentUrl && (
                            <div className="payment-detail-url">
                                <span>Payment URL</span>
                                <a href={payment.paymentUrl} target="_blank" rel="noreferrer">Mở liên kết thanh toán</a>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default PaymentDetailPage;

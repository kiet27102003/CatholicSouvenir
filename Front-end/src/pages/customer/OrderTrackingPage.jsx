import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../../services/orderService';
import paymentService from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import PaymentStatusBadge from '../../components/payment/PaymentStatusBadge';
import { appToast } from '../../lib/appToast';
import './OrderTrackingPage.css';

const formatVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date);
};

const STATUS_STEPS = [
    { key: 'PENDING', label: 'Chờ xử lý' },
    { key: 'PROCESSING', label: 'Đang xử lý' },
    { key: 'SHIPPED', label: 'Đang giao' },
    { key: 'DELIVERED', label: 'Đã giao' },
];

const getStatusStepIndex = (status) => {
    const s = (status || '').toUpperCase();
    const i = STATUS_STEPS.findIndex((step) => step.key === s);
    return i >= 0 ? i : 0;
};

const getStatusLabel = (status) => {
    const s = (status || '').toUpperCase();
    const step = STATUS_STEPS.find((st) => st.key === s);
    return step ? step.label : status || '—';
};

const OrderTrackingPage = () => {
    const { id: orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refundingId, setRefundingId] = useState('');

    const normalizedRole = String(user?.role || user?.roleName || user?.userRole || '').toUpperCase();
    const isAdmin = normalizedRole.includes('ADMIN');

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!orderId) {
            setLoading(false);
            appToast.warning('Thiếu thông tin', 'Thiếu mã đơn hàng');
            return;
        }
        let cancelled = false;
        setLoading(true);
        getOrderById(orderId)
            .then(async (res) => {
                if (cancelled) return;
                if (res.success && res.data) {
                    setOrder(res.data);
                    const payRes = await paymentService.getPaymentsByOrder(orderId);
                    if (!cancelled) {
                        setPayments(payRes.success ? (payRes.data || []) : []);
                    }
                } else {
                    setOrder(null);
                    const msg = res.error != null ? String(res.error) : 'Vui lòng thử lại';
                    appToast.error('Không tải được', msg);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setOrder(null);
                    appToast.error('Không tải được', 'Kiểm tra kết nối mạng');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [orderId]);

    if (loading) {
        return (
            <div className="order-tracking-page">
                <div className="tracking-loading">
                    <div className="spinner"></div>
                    <p>Đang tải chi tiết đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-tracking-page">
                <div className="tracking-error">
                    <h2>Không tìm thấy đơn hàng</h2>
                    <p>Không thể hiển thị thông tin theo dõi đơn hàng.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/orders')}>
                        Về danh sách đơn hàng
                    </button>
                </div>
            </div>
        );
    }

    const currentStepIndex = getStatusStepIndex(order.status);
    const progressPercentage = STATUS_STEPS.length > 1
        ? (currentStepIndex / (STATUS_STEPS.length - 1)) * 100
        : 0;
    const details = order.orderDetails || [];
    const productsSubtotal = details.reduce((sum, d) => sum + (d.subTotal || 0), 0);

    const handleRefund = async (paymentId) => {
        if (!paymentId || refundingId) return;
        setRefundingId(paymentId);
        const reason = `Admin refund cho đơn ${orderId}`;
        const refundRes = await paymentService.refundPayment(paymentId, reason);
        setRefundingId('');

        if (!refundRes.success) {
            appToast.error('Hoàn tiền thất bại', refundRes.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Hoàn tiền thành công');
        const payRes = await paymentService.getPaymentsByOrder(orderId);
        if (payRes.success) {
            setPayments(payRes.data || []);
        }
    };

    return (
        <div className="order-tracking-page">
            <button type="button" className="back-link mb-xl" onClick={() => navigate('/orders')}>
                &larr; Về lịch sử đơn hàng
            </button>

            <div className="tracking-header">
                <div className="tracking-header-left">
                    <h1>Đơn hàng <span className="order-id-value">{order.orderId}</span></h1>
                    <p className="order-date">
                        Đặt ngày {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                    </p>
                </div>
                <div className="tracking-header-right">
                    <div className="order-status-tag">
                        <span className="order-status-tag-label">TRẠNG THÁI</span>
                        <span className="order-status-tag-value">{getStatusLabel(order.status)}</span>
                    </div>
                </div>
            </div>

            <div className="tracking-content-grid">
                <div className="tracking-left-column">
                    {/* Tiến trình đơn hàng */}
                    <div className="tracking-timeline-section">
                        <h2>Tiến trình đơn hàng</h2>
                        <div className="timeline-visual-container">
                            <div className="timeline-track-bg"></div>
                            <div
                                className="timeline-track-fill"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                            <div className="timeline-nodes">
                                {STATUS_STEPS.map((step, index) => (
                                    <div
                                        key={step.key}
                                        className={`timeline-node ${index <= currentStepIndex ? 'completed' : ''}`}
                                    >
                                        <div className="node-circle">
                                            {index < currentStepIndex ? (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            ) : (
                                                <span>{index + 1}</span>
                                            )}
                                        </div>
                                        <span className="node-title">{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Danh sách sản phẩm */}
                    <div className="tracking-products-card">
                        <h2>Sản phẩm</h2>
                        <ul className="tracking-product-list">
                            {details.map((item) => (
                                <li key={item.id} className="tracking-product-row">
                                    <div className="tracking-product-thumb">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                    </div>
                                    <div className="tracking-product-info">
                                        <span className="tracking-product-name">Sản phẩm x {item.quantity}</span>
                                        <span className="tracking-product-unit">{Number(item.unitPrice).toLocaleString('vi-VN')} đ/sp</span>
                                    </div>
                                    <div className="tracking-product-total">{formatVnd(item.subTotal)}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Sidebar chi tiết đơn */}
                <div className="tracking-sidebar">
                    <div className="order-summary-card">
                        <h3>Chi tiết đơn hàng</h3>

                        <div className="summary-section">
                            <h4>Thanh toán</h4>
                            <p>{order.paymentMethod || '—'}</p>
                        </div>

                        <div className="summary-section">
                            <h4>Sản phẩm</h4>
                            <p>{formatVnd(productsSubtotal)}</p>
                        </div>

                        <div className="summary-section">
                            <h4>Tổng thanh toán</h4>
                            <p className="price-total">{formatVnd(order.total)}</p>
                        </div>

                        {payments.length > 0 && (
                            <div className="summary-section payment-history-section">
                                <h4>Lịch sử thanh toán</h4>
                                <div className="payment-history-list">
                                    {payments.map((pay, index) => {
                                        const status = String(pay?.status || '').toUpperCase();
                                        const canRefund = isAdmin && status === 'SUCCESS';
                                        return (
                                            <div key={pay.paymentId || pay.transactionId || `${orderId}-${index}`} className="payment-history-item">
                                                <div className="payment-history-top">
                                                    <code>{pay.transactionId || 'N/A'}</code>
                                                    <PaymentStatusBadge status={status || 'PENDING'} />
                                                </div>
                                                {pay.stageName ? <p className="payment-stage">Giai đoạn: {pay.stageName}</p> : null}
                                                <div className="payment-meta-grid">
                                                    <span>Số tiền: <strong>{formatVnd(pay.amount)}</strong></span>
                                                    <span>Phương thức: <strong>{pay.paymentMethod || 'VNPAY'}</strong></span>
                                                    <span>Tạo lúc: <strong>{formatDateTime(pay.createdAt)}</strong></span>
                                                    <span>Thanh toán: <strong>{formatDateTime(pay.paidAt)}</strong></span>
                                                </div>
                                                {canRefund && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => handleRefund(pay.paymentId)}
                                                        disabled={refundingId === pay.paymentId}
                                                    >
                                                        {refundingId === pay.paymentId ? 'Đang hoàn tiền...' : 'Hoàn tiền'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="summary-actions">
                            <button type="button" className="btn btn-outline btn-full" onClick={() => navigate('/orders')}>
                                Xem tất cả đơn hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingPage;

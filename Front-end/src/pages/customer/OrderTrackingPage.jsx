import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../../services/orderService';
import './OrderTrackingPage.css';

const formatVnd = (value) => `${Number(value).toLocaleString('vi-VN')} ₫`;

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
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!orderId) {
            setLoading(false);
            setError('Thiếu mã đơn hàng.');
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        getOrderById(orderId)
            .then((res) => {
                if (cancelled) return;
                if (res.success && res.data) {
                    setOrder(res.data);
                } else {
                    setError(res.error || 'Không tìm thấy đơn hàng.');
                }
            })
            .catch(() => {
                if (!cancelled) setError('Không thể tải thông tin đơn hàng.');
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

    if (error || !order) {
        return (
            <div className="order-tracking-page">
                <div className="tracking-error">
                    <h2>Không tìm thấy đơn hàng</h2>
                    <p>{error || 'Không thể tải thông tin theo dõi đơn hàng.'}</p>
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

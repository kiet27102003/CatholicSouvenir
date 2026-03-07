import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrders } from '../../services/orderService';
import './OrderHistoryPage.css';

const formatVnd = (value) => `${Number(value).toLocaleString('vi-VN')} ₫`;

const OrderHistoryPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        getOrders()
            .then((res) => {
                if (cancelled) return;
                if (res.success && Array.isArray(res.data)) {
                    setOrders(res.data);
                } else {
                    setError(res.error || 'Không thể tải đơn hàng.');
                }
            })
            .catch(() => {
                if (!cancelled) setError('Không thể tải đơn hàng.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [user?.id]);

    const getStatusStyle = (status) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'DELIVERED':
            case 'COMPLETED':
                return 'status-delivered';
            case 'IN_PROGRESS':
            case 'PROCESSING':
            case 'SHIPPED':
                return 'status-in-progress';
            case 'PENDING':
                return 'status-pending';
            case 'CANCELLED':
            case 'CANCELED':
                return 'status-cancelled';
            default:
                return '';
        }
    };

    const getStatusLabel = (status) => {
        const s = (status || '').toUpperCase();
        const map = {
            PENDING: 'Chờ xử lý',
            PROCESSING: 'Đang xử lý',
            IN_PROGRESS: 'Đang giao',
            SHIPPED: 'Đang giao',
            DELIVERED: 'Đã giao',
            COMPLETED: 'Hoàn thành',
            CANCELLED: 'Đã hủy',
            CANCELED: 'Đã hủy',
        };
        return map[s] || status || '—';
    };

    return (
        <div className="orders-page">
            <div className="orders-header">
                <h1 className="orders-title">Lịch sử đơn hàng</h1>
                <p className="orders-subtitle">Xem và theo dõi đơn hàng của bạn.</p>
            </div>

            {error && (
                <div className="orders-error">
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="orders-loading">
                    <div className="spinner"></div>
                    <p>Đang tải đơn hàng...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="orders-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <h3>Chưa có đơn hàng</h3>
                    <p>Khi bạn đặt hàng, đơn sẽ hiển thị tại đây.</p>
                    <Link to="/shop" className="btn btn-primary" style={{ textDecoration: 'none' }}>Mua sắm</Link>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map((order) => (
                        <div key={order.orderId} className="order-card">
                            <div className="order-card-header">
                                <div className="order-info-mobile">
                                    <div className="order-id">
                                        <span className="label">Mã đơn:</span> {order.orderId}
                                        {order.paymentMethod && (
                                            <span className="badge badge-payment">{order.paymentMethod}</span>
                                        )}
                                    </div>
                                    <div className="order-date">
                                        Đặt ngày {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>

                                <div className="order-status-actions">
                                    <div className={`order-status ${getStatusStyle(order.status)}`}>
                                        {getStatusLabel(order.status)}
                                    </div>
                                    <div className="order-total">
                                        Tổng: <strong>{formatVnd(order.total)}</strong>
                                    </div>
                                    <Link to={`/orders/${order.orderId}/tracking`} className="btn btn-outline btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        Theo dõi đơn
                                    </Link>
                                </div>
                            </div>

                            <div className="order-items">
                                {(order.orderDetails || []).map((item, index) => (
                                    <div key={item.id || index} className="order-item">
                                        <div className="item-details">
                                            <div className="item-image-placeholder">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                    <polyline points="21 15 16 10 5 21"></polyline>
                                                </svg>
                                            </div>
                                            <div className="item-text">
                                                <p className="item-name">Sản phẩm × {item.quantity}</p>
                                                <p className="item-qty">{formatVnd(item.unitPrice)}/sp</p>
                                            </div>
                                        </div>
                                        <div className="item-price">
                                            {formatVnd(item.subTotal)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistoryPage;

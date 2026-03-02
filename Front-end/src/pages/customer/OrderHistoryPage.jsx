import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './OrderHistoryPage.css';

const OrderHistoryPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: fetch orders from API when endpoint is available
        setOrders([]);
        setLoading(false);
    }, [user?.id]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Delivered':
                return 'status-delivered';
            case 'In Progress':
                return 'status-in-progress';
            case 'Pending':
                return 'status-pending';
            case 'Cancelled':
                return 'status-cancelled';
            default:
                return '';
        }
    };

    return (
        <div className="orders-page">
            <div className="orders-header">
                <h1 className="orders-title">Order History</h1>
                <p className="orders-subtitle">View and track your previous and current orders.</p>
            </div>

            {loading ? (
                <div className="orders-loading">
                    <div className="spinner"></div>
                    <p>Loading your orders...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="orders-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <h3>No orders yet</h3>
                    <p>When you place an order, it will appear here.</p>
                    <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Start Shopping</Link>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-card-header">
                                <div className="order-info-mobile">
                                    <div className="order-id">
                                        <span className="label">Order ID:</span> {order.id}
                                        {order.type === 'Custom Request' && (
                                            <span className="badge badge-custom">Custom</span>
                                        )}
                                    </div>
                                    <div className="order-date">Placed on {new Date(order.date).toLocaleDateString()}</div>
                                </div>

                                <div className="order-status-actions">
                                    <div className={`order-status ${getStatusStyle(order.status)}`}>
                                        {order.status}
                                    </div>
                                    <div className="order-total">
                                        Total: <strong>${order.total.toFixed(2)}</strong>
                                    </div>
                                    <Link to={`/orders/${order.id}/tracking`} className="btn btn-outline btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Track Order</Link>
                                </div>
                            </div>

                            <div className="order-items">
                                {order.items.map((item, index) => (
                                    <div key={index} className="order-item">
                                        <div className="item-details">
                                            <div className="item-image-placeholder">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                    <polyline points="21 15 16 10 5 21"></polyline>
                                                </svg>
                                            </div>
                                            <div className="item-text">
                                                <p className="item-name">{item.name}</p>
                                                <p className="item-qty">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="item-price">
                                            ${item.price.toFixed(2)}
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

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderTrackingPage.css';

const MOCK_ORDER = {
    id: 'ORD-2023-8942',
    date: 'October 26, 2023',
    status: 'in_progress', // payment_received, in_progress, shipped, delivered
    estimatedDelivery: 'Nov 15, 2023',
    artisanName: 'Marco V.',
    totalAmount: 185.00,
    item: 'Custom Olive Wood & Silver Rosary',
    shippingAddress: 'Maria Rossi, 123 Via Roma, Rome, Italy, 00100',
    progressSteps: [
        { id: '1', title: 'Payment Received', date: 'Oct 26, 2023, 10:30 AM', completed: true, description: 'Your payment has been successfully processed.' },
        { id: '2', title: 'Artisan Review', date: 'Oct 26, 2023, 02:15 PM', completed: true, description: 'Marco V. has reviewed your specifications and is preparing materials.' },
        { id: '3', title: 'Crafting in Progress', date: 'Oct 28, 2023, 09:00 AM', completed: true, description: 'Wood carving and silver molding have begun.' },
        { id: '4', title: 'Final Finishing', date: 'Pending', completed: false, description: 'Sanding, oiling, and final assembly.' },
        { id: '5', title: 'Shipped', date: 'Pending', completed: false, description: 'Your item will be handed over to the courier.' },
    ]
};

const OrderTrackingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        // Simulate fetch
        setTimeout(() => {
            setOrder(MOCK_ORDER);
            setLoading(false);
        }, 600);
    }, [id]);

    if (loading) {
        return (
            <div className="order-tracking-page">
                <div className="tracking-loading">
                    <div className="spinner"></div>
                    <p>Loading tracking details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-tracking-page">
                <div className="tracking-error">
                    <h2>Order Not Found</h2>
                    <p>We couldn't find the tracking information for this order.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/orders')}>Back to Orders</button>
                </div>
            </div>
        );
    }

    // Calculate progress percentage
    const completedSteps = order.progressSteps.filter(step => step.completed).length;
    const totalSteps = order.progressSteps.length;
    const progressPercentage = ((completedSteps - 1) / (totalSteps - 1)) * 100;

    return (
        <div className="order-tracking-page">
            <button className="back-link mb-xl" onClick={() => navigate('/orders')}>
                &larr; Back to Order History
            </button>

            <div className="tracking-header">
                <div className="tracking-header-left">
                    <h1>Order {order.id}</h1>
                    <p className="order-date">Placed on {order.date}</p>
                </div>
                <div className="tracking-header-right">
                    <div className="est-delivery">
                        <span className="est-label">Estimated Delivery</span>
                        <span className="est-date">{order.estimatedDelivery}</span>
                    </div>
                </div>
            </div>

            <div className="tracking-content-grid">

                {/* Visual Timeline */}
                <div className="tracking-timeline-section">
                    <h2>Tracking Progress</h2>

                    <div className="timeline-visual-container">
                        <div className="timeline-track-bg"></div>
                        <div className="timeline-track-fill" style={{ width: `${progressPercentage}%` }}></div>

                        <div className="timeline-nodes">
                            {order.progressSteps.map((step, index) => (
                                <div key={step.id} className={`timeline-node ${step.completed ? 'completed' : ''}`}>
                                    <div className="node-circle">
                                        {step.completed ? (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        ) : (
                                            <span>{index + 1}</span>
                                        )}
                                    </div>
                                    <span className="node-title">{step.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="timeline-details">
                        {order.progressSteps.map((step, index) => (
                            <div key={step.id} className={`step-detail-card ${step.completed ? 'completed' : 'pending'}`}>
                                <div className="step-time">
                                    <span className="step-date">{step.date}</span>
                                </div>
                                <div className="step-content">
                                    <div className="step-indicator">
                                        <div className="indicator-line"></div>
                                        <div className="indicator-dot"></div>
                                    </div>
                                    <div className="step-text">
                                        <h3>{step.title}</h3>
                                        <p>{step.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Details Sidebar */}
                <div className="tracking-sidebar">
                    <div className="order-summary-card">
                        <h3>Order Details</h3>

                        <div className="summary-section">
                            <h4>Item</h4>
                            <p>{order.item}</p>
                            <p className="text-muted">Artisan: {order.artisanName}</p>
                        </div>

                        <div className="summary-section">
                            <h4>Shipping Address</h4>
                            <p>{order.shippingAddress.split(',').map((line, i) => <span key={i} style={{ display: 'block' }}>{line.trim()}</span>)}</p>
                        </div>

                        <div className="summary-section">
                            <h4>Total Paid</h4>
                            <p className="price-total">${order.totalAmount.toFixed(2)}</p>
                        </div>

                        <div className="summary-actions">
                            <button className="btn btn-outline btn-full" onClick={() => navigate('/messages')}>
                                Contact Artisan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingPage;

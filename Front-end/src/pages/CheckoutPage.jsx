import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/orderService';
import './CheckoutPage.css';

const SHIPPING_FEE = 15000; // VNĐ

const formatVnd = (value) =>
    `${Number(value).toLocaleString('vi-VN')} ₫`;

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { cartItems, cartTotalAmount, clearCart } = useCart();

    const amount = cartItems.length > 0 ? cartTotalAmount : (location.state?.amount || 0);
    const isCustom = location.state?.isCustom ?? false;
    const title = location.state?.title || (cartItems.length === 1 ? cartItems[0].title : `Order with ${cartItems.length} items`);

    const [paymentMethod, setPaymentMethod] = useState('card');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [submitError, setSubmitError] = useState(null);
    const [formData, setFormData] = useState({
        name: 'Maria Rossi',
        cardNumber: '',
        expiry: '',
        cvv: '',
        shippingAddress: '123 Via Roma, Rome, Italy, 00100'
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Redirect if not logged in
    useEffect(() => {
        if (!user && cartItems.length > 0) {
            navigate('/login', { state: { from: '/checkout' }, replace: true });
        }
    }, [user, cartItems.length, navigate]);

    // Redirect if cart empty and no state
    useEffect(() => {
        if (cartItems.length === 0 && !location.state?.amount) {
            navigate('/shop', { replace: true });
        }
    }, [cartItems.length, location.state?.amount, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const paymentMethodValue =
        paymentMethod === 'paypal' ? 'PAYPAL'
        : paymentMethod === 'cod' ? 'COD'
        : 'CARD';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);
        setSubmitting(true);

        if (!user?.id) {
            setSubmitting(false);
            setSubmitError('Vui lòng đăng nhập để đặt hàng.');
            return;
        }
        if (cartItems.length === 0) {
            setSubmitting(false);
            setSubmitError('Giỏ hàng trống.');
            return;
        }

        const result = await createOrder({
            accountId: user.id,
            paymentMethod: paymentMethodValue,
            orderDate: new Date().toISOString(),
            items: cartItems.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
            })),
        });

        setSubmitting(false);

        if (result.success) {
            clearCart();
            setOrderId(result.data?.id ?? result.data?.orderId ?? null);
            setSuccess(true);
            setTimeout(() => navigate('/orders'), 3000);
        } else {
            setSubmitError(result.error || 'Đặt hàng thất bại. Vui lòng thử lại.');
        }
    };

    if (success) {
        return (
            <div className="checkout-page">
                <Header />
                <div className="checkout-success-container">
                    <div className="success-icon-large">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h2>Payment Successful!</h2>
                    <p>Thank you for your purchase. Your payment of <strong>{formatVnd(amount + SHIPPING_FEE)}</strong> has been processed securely.</p>
                    {orderId && <p className="order-number">Order ID: #{orderId}</p>}
                    <button className="btn btn-primary" onClick={() => navigate('/orders')}>
                        View Order Status
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <Header />

            <main className="checkout-main container">
                <div className="checkout-header">
                    <h1>Secure Checkout</h1>
                </div>

                <div className="checkout-grid">
                    {/* Left Column: Forms */}
                    <div className="checkout-forms">
                        <div className="checkout-section">
                            <h2>1. Shipping Address</h2>
                            <div className="shipping-preview">
                                <p><strong>{formData.name}</strong></p>
                                <p>{formData.shippingAddress}</p>
                                <button className="btn-text">Edit Address</button>
                            </div>
                        </div>

                        <div className="checkout-section">
                            <h2>2. Payment Method</h2>
                            <div className="payment-options">
                                <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="card"
                                        checked={paymentMethod === 'card'}
                                        onChange={() => setPaymentMethod('card')}
                                    />
                                    <span>Credit / Debit Card</span>
                                    <div className="payment-icons">
                                        <div className="card-icon visa"></div>
                                        <div className="card-icon mc"></div>
                                    </div>
                                </label>
                                <label className={`payment-option ${paymentMethod === 'paypal' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="paypal"
                                        checked={paymentMethod === 'paypal'}
                                        onChange={() => setPaymentMethod('paypal')}
                                    />
                                    <span>PayPal</span>
                                    <div className="payment-icons">
                                        <div className="card-icon paypal"></div>
                                    </div>
                                </label>
                                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => setPaymentMethod('cod')}
                                    />
                                    <span>Trả khi nhận hàng (COD)</span>
                                </label>
                            </div>

                            {paymentMethod === 'card' && (
                                <form className="card-form" onSubmit={handleSubmit} id="checkout-form">
                                    <div className="form-group">
                                        <label htmlFor="cardNumber">Card Number <span className="required">*</span></label>
                                        <div className="input-with-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                                <line x1="1" y1="10" x2="23" y2="10"></line>
                                            </svg>
                                            <input
                                                type="text"
                                                id="cardNumber"
                                                name="cardNumber"
                                                placeholder="0000 0000 0000 0000"
                                                maxLength="19"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="expiry">Expiry Date <span className="required">*</span></label>
                                            <input type="text" id="expiry" placeholder="MM/YY" maxLength="5" required />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="cvv">CVV <span className="required">*</span></label>
                                            <input type="text" id="cvv" placeholder="123" maxLength="4" required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="nameOnCard">Name on Card <span className="required">*</span></label>
                                        <input type="text" id="nameOnCard" placeholder="Full Name" defaultValue={formData.name} required />
                                    </div>
                                </form>
                            )}

                            {paymentMethod === 'paypal' && (
                                <div className="paypal-container">
                                    <button
                                        type="button"
                                        className="btn-paypal"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Processing...' : 'Proceed to PayPal'}
                                    </button>
                                </div>
                            )}

                            {paymentMethod === 'cod' && (
                                <div className="cod-container">
                                    <p className="cod-description">Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="checkout-summary">
                        <div className="summary-box">
                            <h2>Order Summary</h2>

                            <div className="summary-items">
                                {cartItems.length > 0
                                    ? cartItems.map((item) => (
                                        <div key={item.id} className="summary-item">
                                            <div className="item-info">
                                                <span className="item-name">{item.title}</span>
                                                <span className="item-qty">× {item.quantity}</span>
                                            </div>
                                            <span className="item-price">{formatVnd(item.price * item.quantity)}</span>
                                        </div>
                                    ))
                                    : (
                                        <div className="summary-item">
                                            <div className="item-info">
                                                <span className="item-name">{title}</span>
                                                {isCustom && <span className="item-badge">Custom Order</span>}
                                            </div>
                                            <span className="item-price">{formatVnd(amount)}</span>
                                        </div>
                                    )}
                            </div>

                            <div className="summary-totals">
                                <div className="total-row">
                                    <span>Subtotal</span>
                                    <span>{formatVnd(amount)}</span>
                                </div>
                                <div className="total-row">
                                    <span>Shipping</span>
                                    <span>{formatVnd(SHIPPING_FEE)}</span>
                                </div>
                                <div className="total-row">
                                    <span>Tax</span>
                                    <span>{formatVnd(0)}</span>
                                </div>
                                <div className="total-row grand-total">
                                    <span>Total</span>
                                    <span>{formatVnd(amount + SHIPPING_FEE)}</span>
                                </div>
                            </div>

                            {submitError && (
                                <p className="checkout-error" role="alert">{submitError}</p>
                            )}

                            {paymentMethod === 'card' && (
                                <button
                                    type="submit"
                                    form="checkout-form"
                                    className="btn btn-primary btn-pay-now"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Processing...' : `Thanh toán ${formatVnd(amount + SHIPPING_FEE)}`}
                                </button>
                            )}

                            {paymentMethod === 'paypal' && (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-pay-now"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Processing...' : 'Proceed to PayPal'}
                                </button>
                            )}

                            {paymentMethod === 'cod' && (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-pay-now"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
                                </button>
                            )}

                            <div className="secure-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                Secure SSL Encrypted Connection
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutPage;

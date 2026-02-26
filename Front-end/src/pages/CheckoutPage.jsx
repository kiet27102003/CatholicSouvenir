import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // In a real app, this would use CartContext or location.state
    const amount = location.state?.amount || 185.00;
    const isCustom = location.state?.isCustom || true;
    const title = location.state?.title || 'Custom Olive Wood & Silver Rosary';

    const [paymentMethod, setPaymentMethod] = useState('card');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: 'Maria Rossi',
        cardNumber: '',
        expiry: '',
        cvv: '',
        shippingAddress: '123 Via Roma, Rome, Italy, 00100' // Mocked from user profile
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Simulate payment processing
        setTimeout(() => {
            setSubmitting(false);
            setSuccess(true);

            // Redirect to order tracking or history
            setTimeout(() => {
                navigate('/orders');
            }, 3000);
        }, 1500);
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
                    <p>Thank you for your purchase. Your payment of <strong>${amount.toFixed(2)}</strong> has been processed securely.</p>
                    <p className="order-number">Order ID: #{Math.floor(Math.random() * 10000) + 10000}</p>
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
                                    <button className="btn-paypal" onClick={handleSubmit}>Proceed to PayPal</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="checkout-summary">
                        <div className="summary-box">
                            <h2>Order Summary</h2>

                            <div className="summary-items">
                                <div className="summary-item">
                                    <div className="item-info">
                                        <span className="item-name">{title}</span>
                                        {isCustom && <span className="item-badge">Custom Order</span>}
                                    </div>
                                    <span className="item-price">${amount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="summary-totals">
                                <div className="total-row">
                                    <span>Subtotal</span>
                                    <span>${amount.toFixed(2)}</span>
                                </div>
                                <div className="total-row">
                                    <span>Shipping</span>
                                    <span>$15.00</span>
                                </div>
                                <div className="total-row">
                                    <span>Tax</span>
                                    <span>$0.00</span>
                                </div>
                                <div className="total-row grand-total">
                                    <span>Total</span>
                                    <span>${(amount + 15).toFixed(2)}</span>
                                </div>
                            </div>

                            {paymentMethod === 'card' && (
                                <button
                                    type="submit"
                                    form="checkout-form"
                                    className="btn btn-primary btn-pay-now"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Processing...' : `Pay $${(amount + 15).toFixed(2)}`}
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

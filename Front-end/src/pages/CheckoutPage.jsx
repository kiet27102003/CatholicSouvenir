import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orderService';
import paymentService from '../services/paymentService';
import { appToast } from '../lib/appToast';
import './CheckoutPage.css';

const formatVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const PAYMENT_METHODS = [
    { method: 'VNPAY', label: 'VNPay', description: 'Thẻ ATM, Visa, QR' },
];

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedItems, subtotal } = useCart();

    const [paymentMethod, setPaymentMethod] = useState('VNPAY');
    const [submitting, setSubmitting] = useState(false);
    const [shipping, setShipping] = useState({ fullName: '', phone: '', address: '', note: '' });

    const items = selectedItems || [];

    React.useEffect(() => {
        if (!items.length) navigate('/cart', { replace: true });
    }, [items.length, navigate]);

    const handlePlaceOrder = async () => {
        if (submitting) return;
        if (!shipping.fullName.trim() || !shipping.phone.trim() || !shipping.address.trim()) {
            appToast.warning('Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ');
            return;
        }

        if (!user?.id) {
            appToast.warning('Vui lòng đăng nhập để thanh toán');
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }

        setSubmitting(true);
        try {
            const orderRes = await createOrder({
                accountId: user.id,
                paymentMethod,
                orderDate: new Date().toISOString(),
                shippingFullName: shipping.fullName.trim(),
                shippingPhone: shipping.phone.trim(),
                shippingAddress: shipping.address.trim(),
                note: shipping.note?.trim() || '',
                items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
            });

            if (!orderRes.success) {
                appToast.error('Tạo đơn hàng thất bại', orderRes.error || 'Vui lòng thử lại');
                return;
            }

            const orderId = orderRes.data?.orderId || orderRes.data?.id;
            const customOrderId = orderRes.data?.customOrderId || orderRes.data?.customOrder?.customOrderId;

            if (!customOrderId) {
                appToast.error('Không tìm thấy customOrderId để thanh toán');
                return;
            }

            sessionStorage.setItem('pending_payment_meta', JSON.stringify({
                orderId: orderId || null,
                customOrderId,
                selectedProductIds: items.map((i) => i.productId),
            }));

            const payRes = await paymentService.initiatePayment({
                customOrderId,
                orderId: null,
                stageId: null,
                method: paymentMethod,
                returnUrl: `${window.location.origin}/payment/success`,
                cancelUrl: `${window.location.origin}/payment/failed`,
            });

            if (!payRes.success) {
                appToast.error('Khởi tạo thanh toán thất bại', payRes.error || 'Vui lòng thử lại');
                return;
            }

            const paymentUrl = payRes.data?.paymentUrl;
            if (!paymentUrl) {
                appToast.error('Không nhận được link thanh toán');
                return;
            }

            window.location.href = paymentUrl;
        } catch (error) {
            appToast.error('Thanh toán thất bại', error?.message || 'Vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    };

    const total = useMemo(() => Number(subtotal || 0), [subtotal]);

    return (
        <div className="checkout-page">
            <Header />
            <main className="checkout-main container">
                <div className="checkout-steps">
                    <span className="done">Giỏ hàng</span>
                    <span className="active">Thanh toán</span>
                    <span>Xác nhận</span>
                </div>

                <div className="checkout-layout">
                    <section className="checkout-left">
                        <article className="checkout-card">
                            <h3>Phương thức thanh toán</h3>
                            <div className="method-list">
                                {PAYMENT_METHODS.map((m) => (
                                    <button
                                        key={m.method}
                                        type="button"
                                        className={`method-card ${paymentMethod === m.method ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod(m.method)}
                                    >
                                        <span className="dot" />
                                        <div>
                                            <strong>{m.label}</strong>
                                            <p>{m.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {paymentMethod === 'VNPAY' && (
                                <p className="method-info">Bạn sẽ được chuyển đến cổng VNPay để thanh toán an toàn.</p>
                            )}
                        </article>

                        <article className="checkout-card">
                            <h3>Địa chỉ giao hàng</h3>
                            <div className="form-grid">
                                <label>Họ tên *
                                    <input value={shipping.fullName} onChange={(e) => setShipping((p) => ({ ...p, fullName: e.target.value }))} />
                                </label>
                                <label>Số điện thoại *
                                    <input value={shipping.phone} onChange={(e) => setShipping((p) => ({ ...p, phone: e.target.value }))} />
                                </label>
                                <label className="wide">Địa chỉ *
                                    <input value={shipping.address} onChange={(e) => setShipping((p) => ({ ...p, address: e.target.value }))} />
                                </label>
                                <label className="wide">Ghi chú
                                    <textarea rows={3} value={shipping.note} onChange={(e) => setShipping((p) => ({ ...p, note: e.target.value }))} />
                                </label>
                            </div>
                        </article>
                    </section>

                    <aside className="checkout-right">
                        <article className="checkout-card summary-card">
                            <h3>Tóm tắt đơn hàng</h3>
                            <div className="summary-items">
                                {items.map((item) => (
                                    <div key={`${item.productId}-${item.productName}`} className="summary-item">
                                        <div className="summary-item-left">
                                            <div className="thumb">{item.imageUrl ? <img src={item.imageUrl} alt={item.productName} /> : null}</div>
                                            <div>
                                                <strong>{item.productName}</strong>
                                                {item.zoneInputs?.length > 0 && (
                                                    <p>{item.zoneInputs.map((z) => `${z.zoneName}: ${z.value || '—'}`).join(' · ')}</p>
                                                )}
                                                <span>SL: {item.quantity}</span>
                                            </div>
                                        </div>
                                        <strong>{formatVnd(item.totalPrice)}</strong>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-total">
                                <div><span>Tạm tính</span><strong>{formatVnd(total)}</strong></div>
                                <div><span>Phí vận chuyển</span><strong>Miễn phí</strong></div>
                                <div className="grand"><span>Tổng cộng</span><strong>{formatVnd(total)}</strong></div>
                            </div>

                            <button type="button" className="btn btn-primary checkout-submit" onClick={handlePlaceOrder} disabled={submitting || !items.length}>
                                {submitting ? 'Đang xử lý...' : 'Đặt hàng & Thanh toán'}
                            </button>
                        </article>
                    </aside>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;

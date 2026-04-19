import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import paymentService from '../services/paymentService';
import PaymentStatusBadge from '../components/payment/PaymentStatusBadge';
import { useCart } from '../context/CartContext';
import { appToast } from '../lib/appToast';
import './PaymentResultPage.css';

const formatVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date);
};

const PaymentSuccessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState(null);
    const { clearSelectedItems } = useCart();

    const queryObj = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const obj = {};
        params.forEach((value, key) => { obj[key] = value; });

        // Normalize common aliases so backend can always receive VNPay-style keys.
        if (obj.txnRef && !obj.vnp_TxnRef) obj.vnp_TxnRef = obj.txnRef;
        if (obj.code && !obj.vnp_ResponseCode) obj.vnp_ResponseCode = obj.code;
        if (obj.amount && !obj.vnp_Amount) obj.vnp_Amount = obj.amount;

        return obj;
    }, [location.search]);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setLoading(true);
            const result = await paymentService.callbackPayment('VNPAY', queryObj);
            if (cancelled) return;

            if (!result.success) {
                appToast.error('Xử lý thanh toán thất bại', result.error || 'Vui lòng thử lại');
                navigate('/payment/failed', { replace: true });
                return;
            }

            const data = result.data || {};
            if (String(data.status || '').toUpperCase() !== 'SUCCESS') {
                navigate('/payment/failed', { replace: true, state: { payment: data } });
                return;
            }

            setPayment(data);

            const raw = sessionStorage.getItem('pending_payment_meta');
            const parsed = raw ? JSON.parse(raw) : null;
            const productIds = Array.isArray(parsed?.selectedProductIds) ? parsed.selectedProductIds : [];
            if (productIds.length > 0) {
                await clearSelectedItems(productIds);
            }
            sessionStorage.removeItem('pending_payment_meta');
            appToast.success('Thanh toán thành công');
            setLoading(false);
        };

        run();
        return () => { cancelled = true; };
    }, [queryObj, navigate, clearSelectedItems]);

    if (loading) {
        return <div className="payment-page"><Header /><main className="container payment-main"><p>Đang xác nhận thanh toán...</p></main><Footer /></div>;
    }

    if (!payment) {
        return null;
    }

    return (
        <div className="payment-page">
            <Header />
            <main className="container payment-main">
                <section className="payment-result-card success">
                    <div className="result-icon">✓</div>
                    <h1>Thanh toán thành công!</h1>
                    <p>Đơn hàng đã được xác nhận. Cảm ơn bạn đã mua sắm.</p>

                    <div className="payment-grid">
                        <div><span>Mã giao dịch</span><strong>{payment.transactionId || '—'}</strong></div>
                        <div><span>Số tiền</span><strong>{formatVnd(payment.amount)}</strong></div>
                        <div><span>Phương thức</span><strong>{payment.paymentMethod || 'VNPAY'}</strong></div>
                        <div><span>Thời gian</span><strong>{formatDateTime(payment.paidAt)}</strong></div>
                        {payment.stageName && <div className="full"><span>Giai đoạn</span><strong>{payment.stageName}</strong></div>}
                        <div className="full"><PaymentStatusBadge status={payment.status} /></div>
                    </div>

                    <div className="payment-actions">
                        <button type="button" className="btn btn-primary" onClick={() => navigate(`/orders/${payment.orderId}`)}>
                            Xem đơn hàng
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/products')}>
                            Tiếp tục mua sắm
                        </button>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default PaymentSuccessPage;

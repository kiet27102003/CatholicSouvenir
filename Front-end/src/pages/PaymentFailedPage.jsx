import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import paymentService from '../services/paymentService';
import PaymentStatusBadge from '../components/payment/PaymentStatusBadge';
import { appToast } from '../lib/appToast';
import './PaymentResultPage.css';

const formatVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const PaymentFailedPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState(location.state?.payment || null);
    const [retrying, setRetrying] = useState(false);

    const queryObj = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const obj = {};
        params.forEach((value, key) => { obj[key] = value; });
        return obj;
    }, [location.search]);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (payment) {
                setLoading(false);
                return;
            }
            setLoading(true);
            const result = await paymentService.callbackPayment('VNPAY', queryObj);
            if (cancelled) return;

            if (!result.success) {
                appToast.error('Xử lý thanh toán thất bại', result.error || 'Vui lòng thử lại');
                setPayment({ status: 'FAILED', failureReason: result.error || 'Callback không thành công' });
                setLoading(false);
                return;
            }

            const data = result.data || {};
            if (String(data.status || '').toUpperCase() === 'SUCCESS') {
                navigate('/payment/success', { replace: true, state: { payment: data } });
                return;
            }

            setPayment(data);
            setLoading(false);
        };
        run();
        return () => { cancelled = true; };
    }, [queryObj, payment, navigate]);

    const handleRetry = async () => {
        const raw = sessionStorage.getItem('pending_payment_meta');
        const parsed = raw ? JSON.parse(raw) : null;
        const customOrderId = payment?.customOrderId || parsed?.customOrderId;

        if (!customOrderId) {
            appToast.warning('Không tìm thấy customOrderId để thanh toán lại');
            return;
        }

        setRetrying(true);
        const frontendUrl = import.meta.env.VITE_APP_FRONTEND_URL || window.location.origin;
        const res = await paymentService.initiatePayment({
            customOrderId,
            orderId: null,
            stageId: null,
            method: 'VNPAY',
            returnUrl: `${frontendUrl}/payment/success`,
            cancelUrl: `${frontendUrl}/payment/failed`,
        });
        setRetrying(false);

        if (!res.success || !res.data?.paymentUrl) {
            appToast.error('Không thể thanh toán lại', res.error || 'Vui lòng thử lại');
            return;
        }

        window.location.href = res.data.paymentUrl;
    };

    if (loading) {
        return <div className="payment-page"><Header /><main className="container payment-main"><p>Đang xác nhận giao dịch...</p></main><Footer /></div>;
    }

    return (
        <div className="payment-page">
            <Header />
            <main className="container payment-main">
                <section className="payment-result-card failed">
                    <div className="result-icon">✕</div>
                    <h1>Thanh toán thất bại</h1>
                    <p>Giao dịch không thành công. Vui lòng thử lại.</p>

                    <div className="payment-grid">
                        <div><span>Mã giao dịch</span><strong>{payment?.transactionId || '—'}</strong></div>
                        <div><span>Số tiền</span><strong>{formatVnd(payment?.amount || 0)}</strong></div>
                        <div className="full"><span>Lý do</span><strong>{payment?.failureReason || 'Không xác định'}</strong></div>
                        <div className="full"><PaymentStatusBadge status={payment?.status || 'FAILED'} /></div>
                    </div>

                    <div className="payment-actions">
                        <button type="button" className="btn btn-primary" onClick={handleRetry} disabled={retrying}>
                            {retrying ? 'Đang xử lý...' : 'Thử lại thanh toán'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/orders')}>
                            Huỷ đơn hàng
                        </button>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default PaymentFailedPage;

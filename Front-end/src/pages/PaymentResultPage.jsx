import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import PaymentStatusBadge from '../components/payment/PaymentStatusBadge';
import './PaymentResultPage.css';

const formatVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    const params = new URLSearchParams(window.location.search);
    const txnRef = params.get('txnRef');
    const responseCode = params.get('code');
    const success = params.get('success');

    const isSuccess = success === 'true' && responseCode === '00';

    const payment = !txnRef
        ? { status: 'INVALID' }
        : {
            transactionId: txnRef,
            amount: 0,
            paymentMethod: 'VNPAY',
            status: isSuccess ? 'SUCCESS' : 'FAILED',
            paidAt: new Date().toISOString(),
        };

    const renderInvalid = () => (
        <section className="payment-result-card failed">
            <div className="result-icon">!</div>
            <h1>Invalid payment data</h1>
            <p>Không tìm thấy thông tin thanh toán hợp lệ từ VNPAY.</p>
            <div className="payment-actions">
                <button type="button" className="btn btn-primary" onClick={() => navigate('/checkout')}>
                    Quay lại thanh toán
                </button>
            </div>
        </section>
    );

    const renderPayment = () => {
        const isPaymentSuccess = payment.status === 'SUCCESS';

        return (
            <section className={`payment-result-card ${isPaymentSuccess ? 'success' : 'failed'}`}>
                <div className="result-icon">{isPaymentSuccess ? '✓' : '!'}</div>
                <h1>{isPaymentSuccess ? 'Payment success' : 'Payment failed'}</h1>
                <p>
                    {isPaymentSuccess
                        ? 'Đơn hàng đã được xác nhận. Cảm ơn bạn đã mua sắm.'
                        : 'Thanh toán không thành công hoặc bị từ chối bởi cổng thanh toán.'}
                </p>

                <div className="payment-grid">
                    <div><span>Mã giao dịch</span><strong>{payment.transactionId || '—'}</strong></div>
                    <div><span>Số tiền</span><strong>{formatVnd(payment.amount)}</strong></div>
                    <div><span>Phương thức</span><strong>{payment.paymentMethod || 'VNPAY'}</strong></div>
                    <div><span>Thời gian</span><strong>{formatDateTime(payment.paidAt)}</strong></div>
                    <div className="full"><PaymentStatusBadge status={payment.status} /></div>
                </div>

                <div className="payment-actions">
                    {isPaymentSuccess ? (
                        <>
                            <button type="button" className="btn btn-primary" onClick={() => navigate('/orders')}>
                                Xem đơn hàng
                            </button>
                            <button type="button" className="btn btn-outline" onClick={() => navigate('/products')}>
                                Tiếp tục mua sắm
                            </button>
                        </>
                    ) : (
                        <button type="button" className="btn btn-primary" onClick={() => navigate('/checkout')}>
                            Thử lại thanh toán
                        </button>
                    )}
                </div>
            </section>
        );
    };

    return (
        <div className="payment-page">
            <Header />
            <main className="container payment-main">
                {!txnRef ? renderInvalid() : renderPayment()}
            </main>
            <Footer />
        </div>
    );
};

export default PaymentSuccessPage;

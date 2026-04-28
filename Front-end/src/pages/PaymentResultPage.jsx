import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    const location = useLocation();
    const params = new URLSearchParams(location.search);

    const paymentId = params.get('paymentId') || params.get('txnRef') || params.get('transactionId');
    const orderGroupId = params.get('orderGroupId') || params.get('orderGroup') || params.get('paymentId');
    const responseCode = params.get('responseCode') || params.get('code');
    const status = params.get('status');
    const amount = Number(params.get('amount') || params.get('totalAmount') || 0);
    const orderCount = Number(params.get('orderCount') || 0);
    const isSuccess = String(status || '').toUpperCase() === 'SUCCESS' || responseCode === '00';

    const payment = !paymentId && !orderGroupId
        ? { status: 'INVALID' }
        : {
            transactionId: paymentId || orderGroupId,
            amount,
            paymentMethod: 'VNPAY',
            status: isSuccess ? 'SUCCESS' : 'FAILED',
            paidAt: new Date().toISOString(),
            orderGroupId,
            responseCode,
            orderCount,
        };

    const renderInvalid = () => (
        <section className="payment-result-card failed">
            <div className="result-icon">!</div>
            <h1>Dữ liệu thanh toán không hợp lệ</h1>
            <p>Không tìm thấy thông tin thanh toán hợp lệ từ URL.</p>
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
                <h1>{isPaymentSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại'}</h1>
                <p>
                    {isPaymentSuccess
                        ? 'Giao dịch đã được ghi nhận thành công. Đơn hàng của bạn đang được xử lý.'
                        : 'Thanh toán chưa hoàn tất hoặc đã bị từ chối bởi cổng thanh toán.'}
                </p>

                <div className="payment-meta">
                    <span>Mã nhóm đơn hàng: <strong>{payment.orderGroupId || '—'}</strong></span>
                </div>

                <div className="payment-grid">
                    <div><span>Mã giao dịch</span><strong>{paymentId || '—'}</strong></div>
                    <div><span>Mã nhóm đơn</span><strong>{payment.orderGroupId || '—'}</strong></div>
                    <div><span>Số tiền</span><strong>{formatVnd(payment.amount)}</strong></div>
                    <div><span>Mã phản hồi</span><strong>{payment.responseCode || '—'}</strong></div>
                    <div><span>Phương thức</span><strong>{payment.paymentMethod || 'VNPAY'}</strong></div>
                    <div><span>Thời gian</span><strong>{formatDateTime(payment.paidAt)}</strong></div>
                    {payment.orderCount ? (
                        <div><span>Số đơn hàng</span><strong>{payment.orderCount}</strong></div>
                    ) : null}
                    <div className="full"><PaymentStatusBadge status={payment.status} /></div>
                </div>

                <div className="payment-actions">
                    {isPaymentSuccess ? (
                        <>
                            <button type="button" className="btn btn-primary" onClick={() => navigate('/orders')}>
                                Xem đơn hàng
                            </button>
                            <button type="button" className="btn btn-outline" onClick={() => navigate('/checkout')}>
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
                {!paymentId ? renderInvalid() : renderPayment()}
            </main>
            <Footer />
        </div>
    );
};

export default PaymentSuccessPage;

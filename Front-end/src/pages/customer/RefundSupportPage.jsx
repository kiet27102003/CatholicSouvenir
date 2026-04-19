import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './RefundSupportPage.css';

const RefundSupportPage = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const role = String(user?.role || '').toUpperCase();
    const canView = role === 'CUSTOMER';

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!canView) return <Navigate to="/" replace />;

    return (
        <div className="refund-support-page">
            <Header />
            <main className="refund-support-shell">
                <section className="refund-support-hero">
                    <div>
                        <p className="refund-support-eyebrow">Dịch vụ &amp; hỗ trợ</p>
                        <h1>Hoàn tiền</h1>
                        <p>Tra cứu trạng thái hoàn tiền, hiểu quy trình xử lý và biết cách theo dõi yêu cầu của bạn.</p>
                    </div>
                    <div className="refund-support-actions">
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/complaint-history')}>
                            Xem khiếu nại
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => navigate('/orders')}>
                            Xem đơn hàng
                        </button>
                    </div>
                </section>

                <section className="refund-support-grid">
                    <article className="refund-support-card">
                        <h2>Quy trình hoàn tiền</h2>
                        <ol>
                            <li>Gửi khiếu nại từ đơn hàng hoặc lịch sử khiếu nại.</li>
                            <li>Đội ngũ hỗ trợ xác minh nội dung và bằng chứng.</li>
                            <li>Khi được phê duyệt, hệ thống tiến hành hoàn tiền theo phương thức thanh toán ban đầu.</li>
                        </ol>
                    </article>

                    <article className="refund-support-card">
                        <h2>Thời gian xử lý</h2>
                        <p>Thời gian hoàn tiền có thể thay đổi tùy theo phương thức thanh toán và ngân hàng/ ví điện tử.</p>
                        <p>Trạng thái thường gặp: chờ xử lý, đang hoàn tiền, đã hoàn tiền hoặc từ chối.</p>
                    </article>

                    <article className="refund-support-card">
                        <h2>Khi nào cần liên hệ?</h2>
                        <p>Nếu yêu cầu của bạn đã được phê duyệt nhưng chưa nhận được tiền sau thời gian dự kiến, hãy liên hệ CSKH kèm mã đơn hàng và mã khiếu nại.</p>
                    </article>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default RefundSupportPage;

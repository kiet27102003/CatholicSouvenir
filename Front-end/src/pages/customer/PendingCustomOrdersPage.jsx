import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiClock, FiEye, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { appToast } from '../../lib/appToast';
import { getCustomerCustomOrders } from '../../services/customRequestService';
import './CustomRequestsManagePage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const formatDateTime = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return value;
    }
};

const getOrderId = (item) => item?.customOrderId ?? item?.orderId ?? item?.id ?? null;

const PendingCustomOrdersPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    const fetchOrders = async () => {
        setLoading(true);
        const res = await getCustomerCustomOrders({ status: 'PENDING_CONFIRMATION', page: 0, size: 20 });
        setLoading(false);

        if (!res.success) {
            setOrders([]);
            appToast.error('Không tải được đơn chờ xác nhận', res.error || 'Vui lòng thử lại');
            return;
        }

        setOrders(Array.isArray(res.data?.content) ? res.data.content : []);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div className="custom-requests-manage-page">
            <Header />
            <main className="custom-requests-manage-main">
                <section className="manage-hero">
                    <div className="manage-hero-copy">
                        <div className="manage-badge-row">
                            <button type="button" className="btn btn-outline manage-back-btn" onClick={() => navigate('/custom-requests')}>
                                <FiArrowLeft /> Quay lại danh sách yêu cầu
                            </button>
                        </div>
                        <h1>Đơn custom chờ xác nhận</h1>
                        <p>Các custom order đã được nghệ nhân tạo nhưng bạn chưa xác nhận. Hãy mở chi tiết để kiểm tra stages và xác nhận đơn.</p>
                        <div className="manage-hero-actions">
                            <button type="button" className="btn btn-outline" onClick={fetchOrders}>
                                <FiRefreshCw /> Làm mới
                            </button>
                        </div>
                        <div className="manage-summary-grid">
                            <div className="summary-card"><FiClock /><strong>{orders.length}</strong><span>Đơn chờ xác nhận</span></div>
                        </div>
                    </div>
                    <div className="manage-hero-panel">
                        <div className="panel-card">
                            <div className="panel-card-icon">◌</div>
                            <h3>Xác nhận để mở khóa thanh toán</h3>
                            <p>Sau khi bạn xác nhận, stage đầu tiên sẽ được mở khóa và bạn có thể thanh toán theo tiến độ.</p>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="manage-loading-grid">
                        {[1, 2, 3].map((item) => <div key={item} className="manage-card-skeleton" />)}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="manage-empty">
                        <div className="manage-empty-icon">◌</div>
                        <h3>Không có đơn nào đang chờ xác nhận</h3>
                        <p>Khi nghệ nhân tạo custom order mới, đơn sẽ xuất hiện ở đây để bạn xác nhận.</p>
                        <button type="button" className="btn btn-primary" onClick={() => navigate('/custom-requests')}>
                            Về danh sách yêu cầu
                        </button>
                    </div>
                ) : (
                    <div className="manage-list-grid">
                        {orders.map((item) => {
                            const orderId = getOrderId(item);
                            const stages = Array.isArray(item?.stages) ? item.stages : [];
                            return (
                                <article key={String(orderId)} className="manage-card">
                                    <header className="manage-card-header">
                                        <div>
                                            <h3>{item?.title || item?.requestTitle || item?.description || 'Custom order'}</h3>
                                            <p>{formatDateTime(item?.createdAt)} · {formatCurrency(item?.totalPrice)}</p>
                                        </div>
                                        <span className="manage-status status-open">Chờ xác nhận</span>
                                    </header>

                                    <div className="manage-card-body">
                                        <p>{item?.description || '—'}</p>
                                        <div className="manage-card-meta">{stages.length} giai đoạn</div>
                                    </div>

                                    <footer className="manage-card-footer">
                                        <span className="manage-card-meta">{item?.artisanName || 'Nghệ nhân đã chọn'}</span>
                                        <div className="manage-card-actions">
                                            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(`/custom-requests/${item?.requestId || item?.customRequestId || orderId}`)}>
                                                <FiEye /> Chi tiết & xác nhận
                                            </button>
                                        </div>
                                    </footer>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PendingCustomOrdersPage;

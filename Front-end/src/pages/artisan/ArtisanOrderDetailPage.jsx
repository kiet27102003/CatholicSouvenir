import React, { useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiDollarSign, FiMail, FiPackage, FiPhone, FiShoppingBag, FiUser } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import { getOrderById } from '../../services/orderService';
import Sidebar from './components/Sidebar';
import './ArtisanDashboard.css';
import './ArtisanOrderDetailPage.css';

const moneyFormatter = new Intl.NumberFormat('vi-VN');
const formatCurrency = (value) => `${moneyFormatter.format(Number(value || 0))} đ`;

const formatDate = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN');
    } catch {
        return value;
    }
};

const STATUS_LABELS = {
    PENDING_PAYMENT: 'Chờ thanh toán',
    CONFIRMED: 'Đã xác nhận',
    PAID: 'Đã thanh toán',
    SHIPPING: 'Đang giao hàng',
    DELIVERED: 'Đã giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã huỷ',
    REFUNDED: 'Đã hoàn tiền',
};

const getStatusLabel = (status) => STATUS_LABELS[String(status || '').toUpperCase()] || status || '—';

const getStatusClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'DELIVERED') return 'completed';
    if (s === 'CANCELLED' || s === 'REFUNDED') return 'cancelled';
    if (s === 'PAID' || s === 'SHIPPING' || s === 'CONFIRMED') return 'in-progress';
    return 'pending';
};

const ArtisanOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            setLoading(true);
            const res = await getOrderById(id);
            if (ignore) return;
            setLoading(false);

            if (!res.success) {
                setOrder(null);
                appToast.error('Không tải được chi tiết đơn hàng', res.error || 'Vui lòng thử lại');
                return;
            }

            setOrder(res.data || null);
        };

        if (id) load();
        else setLoading(false);

        return () => {
            ignore = true;
        };
    }, [id]);

    const items = useMemo(() => {
        const orderDetails = Array.isArray(order?.orderDetails) ? order.orderDetails : [];
        const templateDetails = Array.isArray(order?.templateDetails) ? order.templateDetails : [];
        return [...orderDetails, ...templateDetails];
    }, [order]);

    const totalItems = items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);

    if (!id) return <div className="artisan-empty">Thiếu mã đơn hàng.</div>;
    if (loading) return <div className="artisan-skeleton-page" />;
    if (!order) return <div className="artisan-empty">Không tìm thấy đơn hàng.</div>;

    return (
        <div className="artisan-dashboard">
            <Sidebar
                user={user}
                activeView="customOrders"
                setActiveView={(view) => navigate(view === 'customOrders' ? '/artisan/orders' : `/artisan/${view}`)}
                onLogout={logout}
            />

            <main className="artisan-main">
                <div className="artisan-order-detail-page modern-order-detail-page">
                    <header className="detail-page-header">
                        <button type="button" className="btn btn-outline back-btn-top" onClick={() => navigate('/artisan/orders')}>
                            ← Quay lại danh sách
                        </button>
                        <div className="header-main-row">
                            <h1>Chi tiết đơn hàng</h1>
                        </div>
                    </header>

                    <section className="detail-summary-grid">
                        <article className="summary-card summary-status-card">
                            <span className="summary-icon"><FiShoppingBag /></span>
                            <div>
                                <p>Trạng thái đơn</p>
                                <strong><span className={`status-badge ${getStatusClass(order?.status)}`}>{getStatusLabel(order?.status)}</span></strong>
                            </div>
                        </article>
                        <article className="summary-card">
                            <span className="summary-icon"><FiDollarSign /></span>
                            <div>
                                <p>Tổng tiền</p>
                                <strong>{formatCurrency(order?.total)}</strong>
                            </div>
                        </article>
                        <article className="summary-card">
                            <span className="summary-icon icon-blue"><FiCalendar /></span>
                            <div>
                                <p>Ngày đặt</p>
                                <strong>{formatDate(order?.orderDate || order?.createAt)}</strong>
                            </div>
                        </article>
                        <article className="summary-card">
                            <span className="summary-icon icon-green"><FiPackage /></span>
                            <div>
                                <p>Số lượng</p>
                                <strong>{totalItems}</strong>
                            </div>
                        </article>
                    </section>

                    <div className="detail-layout-grid">
                        <section className="left-col">
                            <article className="card-box info-card">
                                <h3>Thông tin đơn</h3>
                                <div className="info-grid">
                                    <div>
                                        <label>Mã đơn hàng</label>
                                        <p>{order?.orderId || '—'}</p>
                                    </div>
                                    <div>
                                        <label>Phương thức thanh toán</label>
                                        <p>{order?.paymentMethod || '—'}</p>
                                    </div>
                                    <div>
                                        <label>Khách hàng</label>
                                        <p>{order?.fullName || '—'}</p>
                                    </div>
                                    <div>
                                        <label>Ngày cập nhật</label>
                                        <p>{formatDate(order?.updateAt)}</p>
                                    </div>
                                </div>
                            </article>

                            <article className="card-box">
                                <h3>Sản phẩm trong đơn</h3>
                                <div className="stages-list">
                                    {items.length === 0 ? (
                                        <p className="muted">Đơn hàng chưa có sản phẩm.</p>
                                    ) : (
                                        items.map((item, idx) => (
                                            <div key={item?.id || `${item?.productId || 'item'}-${idx}`} className="stage-item completed">
                                                <div className="timeline-dot">{idx + 1}</div>
                                                <div className="stage-content">
                                                    <div className="stage-top-row">
                                                        <h4>{item?.productName || 'Sản phẩm'}</h4>
                                                        <span className="mini-status completed">{formatCurrency(item?.subTotal || item?.unitPrice || 0)}</span>
                                                    </div>
                                                    <div className="stage-sub-row">
                                                        <span>Số lượng: {item?.quantity || 0}</span>
                                                        <strong>{formatCurrency(item?.unitPrice || 0)}</strong>
                                                    </div>
                                                    {item?.image && <img src={item.image} alt={item?.productName || 'product'} className="proof-thumb" />}
                                                    <p className="muted">Giảm giá: {formatCurrency(item?.discount || 0)} • Thành tiền: {formatCurrency(item?.subTotal || 0)}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </article>
                        </section>

                        <aside className="right-col">
                            <article className="card-box side-card">
                                <h3>Thông tin khách hàng</h3>
                                <div className="person-row">
                                    <span className="person-icon"><FiUser /></span>
                                    <div>
                                        <strong>{order?.fullName || 'Khách hàng'}</strong>
                                        <p><FiMail /> —</p>
                                    </div>
                                </div>
                            </article>

                            <article className="card-box side-card">
                                <h3>Tóm tắt đơn</h3>
                                <p><span>Mã đơn:</span> <strong>{order?.orderId || '—'}</strong></p>
                                <p><span>Thanh toán:</span> <strong>{order?.paymentMethod || '—'}</strong></p>
                                <p><span>Trạng thái:</span> <strong>{getStatusLabel(order?.status)}</strong></p>
                                <p><span>Tổng tiền:</span> <strong>{formatCurrency(order?.total)}</strong></p>
                            </article>


                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ArtisanOrderDetailPage;

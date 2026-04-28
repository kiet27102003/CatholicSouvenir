import React, { useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiCreditCard, FiHash, FiPackage, FiRefreshCw, FiTag, FiTruck, FiUser } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import { getOrderById } from '../../services/orderService';
import './ArtisanDashboard.css';
import './ArtisanCustomOrderDetailPage.css';

const moneyFormatter = new Intl.NumberFormat('vi-VN');
const formatCurrency = (value) => `${moneyFormatter.format(Number(value || 0))} đ`;

const formatDateTime = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN');
    } catch {
        return value;
    }
};

const getStatusClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PAID') return 'in-progress';
    if (s === 'DELIVERED' || s === 'COMPLETED') return 'completed';
    if (s === 'CANCELLED') return 'cancelled';
    return 'pending';
};

const getStatusText = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PAID') return 'Đã thanh toán';
    if (s === 'SHIPPING') return 'Đang giao';
    if (s === 'DELIVERED') return 'Đã giao';
    if (s === 'COMPLETED') return 'Hoàn thành';
    if (s === 'CANCELLED') return 'Đã huỷ';
    return s || '—';
};

const ArtisanOrderDetailPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            if (!orderId) {
                setLoading(false);
                setOrder(null);
                return;
            }

            setLoading(true);
            const res = await getOrderById(orderId);
            if (ignore) return;
            setLoading(false);

            if (!res.success) {
                setOrder(null);
                appToast.error('Không tải được chi tiết đơn hàng', res.error || 'Vui lòng thử lại');
                return;
            }

            setOrder(res.data || null);
        };

        load();
        return () => {
            ignore = true;
        };
    }, [orderId]);

    const details = useMemo(() => (Array.isArray(order?.orderDetails) ? order.orderDetails : []), [order]);
    const templateDetails = useMemo(() => (Array.isArray(order?.templateDetails) ? order.templateDetails : []), [order]);
    const totalItems = useMemo(() => details.reduce((sum, item) => sum + Number(item?.quantity || 0), 0), [details]);

    if (!orderId) return <div className="artisan-empty">Thiếu mã đơn hàng.</div>;
    if (loading) return <div className="artisan-skeleton-page" />;
    if (!order) return <div className="artisan-empty">Không tìm thấy đơn hàng.</div>;

    return (
        <div className="artisan-dashboard">
            <main className="artisan-main artisan-order-detail-page">
                <div className="detail-page-header">
                    <button type="button" className="btn btn-outline back-btn-top" onClick={() => navigate('/artisan/ready-orders')}>
                        ← Quay lại danh sách
                    </button>

                    <div className="header-main-row">
                        <h1>Chi tiết đơn hàng</h1>
                        <span className={`status-badge ${getStatusClass(order?.status)}`}>{getStatusText(order?.status)}</span>
                    </div>
                </div>

                <section className="detail-summary-grid">
                    <article className="summary-card summary-status-card">
                        <span className="summary-icon"><FiHash /></span>
                        <div>
                            <p>Mã đơn</p>
                            <strong>{order?.orderId || '—'}</strong>
                        </div>
                    </article>
                    <article className="summary-card">
                        <span className="summary-icon"><FiPackage /></span>
                        <div>
                            <p>Tổng tiền</p>
                            <strong>{formatCurrency(order?.total)}</strong>
                        </div>
                    </article>
                    <article className="summary-card">
                        <span className="summary-icon icon-blue"><FiCreditCard /></span>
                        <div>
                            <p>Phương thức thanh toán</p>
                            <strong>{order?.paymentMethod || '—'}</strong>
                        </div>
                    </article>
                    <article className="summary-card">
                        <span className="summary-icon icon-green"><FiCalendar /></span>
                        <div>
                            <p>Ngày đặt</p>
                            <strong>{formatDateTime(order?.orderDate || order?.createAt)}</strong>
                        </div>
                    </article>
                </section>

                <div className="detail-layout-grid">
                    <section className="left-col">
                        <article className="card-box info-card">
                            <h3>Thông tin đơn hàng</h3>
                            <div className="info-grid">
                                <div>
                                    <label>Khách hàng</label>
                                    <p>{order?.fullName || '—'}</p>
                                </div>
                                <div>
                                    <label>Trạng thái</label>
                                    <p><span className={`status-badge ${getStatusClass(order?.status)}`}>{getStatusText(order?.status)}</span></p>
                                </div>
                                <div>
                                    <label>Ngày tạo</label>
                                    <p>{formatDateTime(order?.createAt)}</p>
                                </div>
                                <div>
                                    <label>Cập nhật lần cuối</label>
                                    <p>{formatDateTime(order?.updateAt)}</p>
                                </div>
                                <div>
                                    <label>Tổng sản phẩm</label>
                                    <p>{totalItems}</p>
                                </div>
                                <div>
                                    <label>Phí giao hàng</label>
                                    <p>{order?.shippingFee == null ? '—' : formatCurrency(order.shippingFee)}</p>
                                </div>
                            </div>
                        </article>

                        <article className="card-box">
                            <div className="stage-card-header">
                                <h3>Sản phẩm trong đơn</h3>
                                <span>{details.length} dòng sản phẩm</span>
                            </div>

                            <div className="stages-list">
                                {details.length === 0 ? (
                                    <div className="artisan-empty">Đơn hàng chưa có sản phẩm.</div>
                                ) : (
                                    details.map((item) => (
                                        <div key={item.id || item.productId} className="stage-item completed">
                                            <div className="timeline-dot">✓</div>
                                            <div className="stage-content">
                                                <div className="stage-top-row">
                                                    <h4>{item?.productName || 'Sản phẩm'}</h4>
                                                    <span className="mini-status completed">{formatCurrency(item?.subTotal)}</span>
                                                </div>

                                                <div className="stage-sub-row">
                                                    <span>Số lượng: {item?.quantity ?? 0}</span>
                                                    <strong>Đơn giá: {formatCurrency(item?.unitPrice)}</strong>
                                                </div>

                                                <div className="order-detail-product-row">
                                                    {item?.image ? <img src={item.image} alt={item?.productName || 'product'} className="order-detail-thumb" /> : null}
                                                    <div>
                                                        <p>Mã sản phẩm: {item?.productId || '—'}</p>
                                                        <p>Chiết khấu: {formatCurrency(item?.discount)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </article>

                        {templateDetails.length > 0 && (
                            <article className="card-box">
                                <div className="stage-card-header">
                                    <h3>Template đi kèm</h3>
                                    <span>{templateDetails.length} mục</span>
                                </div>
                                <div className="stages-list">
                                    {templateDetails.map((item, index) => (
                                        <div key={item.id || index} className="stage-item completed">
                                            <div className="timeline-dot">✓</div>
                                            <div className="stage-content">
                                                <div className="stage-top-row">
                                                    <h4>{item?.templateName || `Template ${index + 1}`}</h4>
                                                </div>
                                                <div className="stage-sub-row">
                                                    <span>Số lượng: {item?.quantity ?? 0}</span>
                                                    <strong>{formatCurrency(item?.price || item?.unitPrice || 0)}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        )}
                    </section>

                    <aside className="right-col">
                        <article className="card-box side-card">
                            <h3>Thông tin người mua</h3>
                            <p><FiUser /> <strong>{order?.fullName || '—'}</strong></p>
                            <p><FiTag /> Mã khách hàng: {order?.customerId || '—'}</p>
                        </article>

                        <article className="card-box side-card">
                            <h3>Tóm tắt thanh toán</h3>
                            <p><span>Tổng tiền:</span> <strong>{formatCurrency(order?.total)}</strong></p>
                            <p><span>Phí giao hàng:</span> <strong>{order?.shippingFee == null ? '—' : formatCurrency(order.shippingFee)}</strong></p>
                            <p><span>Thanh toán:</span> <strong>{order?.paymentMethod || '—'}</strong></p>
                            <p><span>Trạng thái:</span> <strong>{getStatusText(order?.status)}</strong></p>
                        </article>

                        <article className="card-box side-card">
                            <h3>Ghi chú</h3>
                            <p className="muted">
                                {user?.role === 'ARTISAN'
                                    ? 'Trang này hiển thị chi tiết đơn hàng để nghệ nhân đối chiếu thông tin sản phẩm và trạng thái đơn.'
                                    : 'Trang chi tiết đơn hàng.'}
                            </p>
                        </article>

                        <article className="card-box side-card">
                            <h3>Thao tác nhanh</h3>
                            <div className="shipment-card-actions">
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/artisan/ready-orders')}>
                                    <FiRefreshCw /> Làm mới danh sách
                                </button>
                                <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/artisan/ready-orders')}>
                                    <FiTruck /> Quay lại đơn sẵn
                                </button>
                            </div>
                        </article>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default ArtisanOrderDetailPage;

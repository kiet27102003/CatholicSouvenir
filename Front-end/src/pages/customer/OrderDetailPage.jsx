import React, { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiCalendar, FiCreditCard, FiHash, FiPackage, FiShoppingBag, FiTruck, FiUser } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getOrderById } from '../../services/orderService';
import { appToast } from '../../lib/appToast';
import './OrderDetailPage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatDateTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY · HH:mm') : '—');

const STATUS_META = {
    PENDING: { label: 'Chờ thanh toán', className: 'status-pending' },
    PAID: { label: 'Đã thanh toán', className: 'status-paid' },
    SHIPPING: { label: 'Đang giao', className: 'status-shipping' },
    DELIVERED: { label: 'Hoàn thành', className: 'status-delivered' },
    CANCELLED: { label: 'Đã huỷ', className: 'status-cancelled' },
};

const getStatusMeta = (status) => {
    const key = String(status || '').toUpperCase();
    return STATUS_META[key] || { label: key || 'Không xác định', className: 'status-unknown' };
};

const getItemName = (item) => item?.productName || item?.templateName || 'Sản phẩm tuỳ chỉnh';
const getItemImage = (item) => item?.image || item?.thumbnail || 'https://via.placeholder.com/96x96?text=SP';
const getItemAmount = (item) => Number(item?.subTotal ?? item?.subtotal ?? item?.unitPrice ?? 0) * Number(item?.quantity || 1);

const OrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadDetail = async () => {
            setLoading(true);
            const res = await getOrderById(id);
            if (cancelled) return;

            if (!res.success) {
                appToast.error('Không tải được chi tiết đơn hàng', res.error || 'Vui lòng thử lại');
                setOrder(null);
                setLoading(false);
                return;
            }

            setOrder(res.data || null);
            setLoading(false);
        };

        loadDetail();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const statusMeta = useMemo(() => getStatusMeta(order?.status), [order?.status]);
    const orderDetails = Array.isArray(order?.orderDetails) ? order.orderDetails : [];
    const templateDetails = Array.isArray(order?.templateDetails) ? order.templateDetails : [];
    const items = [...orderDetails, ...templateDetails];

    if (loading) {
        return (
            <div className="order-detail-page">
                <div className="detail-skeleton header" />
                <div className="detail-skeleton content" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-detail-page empty-state">
                <h2>Không tìm thấy đơn hàng</h2>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/orders')}>
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="order-detail-page">
            <div className="detail-shell">
                <button type="button" className="back-link" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Quay lại
                </button>

                <section className="hero-card">
                    <div className="hero-copy">
                        <div className={`status-pill ${statusMeta.className}`}>{statusMeta.label}</div>
                        <h1>#{order.orderId}</h1>
                        <p>Đơn hàng được tạo lúc {formatDateTime(order.orderDate || order.createAt)}</p>
                    </div>
                    <div className="hero-metrics">
                        <div className="metric-card">
                            <FiShoppingBag />
                            <div>
                                <span>Tổng tiền</span>
                                <strong>{formatCurrency(order.total)}</strong>
                            </div>
                        </div>
                        <div className="metric-card">
                            <FiCreditCard />
                            <div>
                                <span>Thanh toán</span>
                                <strong>{order.paymentMethod || '—'}</strong>
                            </div>
                        </div>
                        <div className="metric-card">
                            <FiUser />
                            <div>
                                <span>Khách hàng</span>
                                <strong>{order.fullName || '—'}</strong>
                            </div>
                        </div>
                        <div className="metric-card">
                            <FiCalendar />
                            <div>
                                <span>Cập nhật</span>
                                <strong>{formatDateTime(order.updateAt)}</strong>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="detail-grid">
                    <main className="detail-main">
                        <section className="panel">
                            <div className="panel-head">
                                <h2>Danh sách sản phẩm</h2>
                                <span>{items.length} mục</span>
                            </div>

                            <div className="items-list">
                                {items.length > 0 ? items.map((item, idx) => (
                                    <article key={`${order.orderId}-${idx}`} className="item-card">
                                        <img src={getItemImage(item)} alt={getItemName(item)} />
                                        <div className="item-content">
                                            <div className="item-title-row">
                                                <h3>{getItemName(item)}</h3>
                                                <strong>{formatCurrency(item.subTotal ?? item.subtotal ?? getItemAmount(item))}</strong>
                                            </div>
                                            <p>Số lượng: x{item.quantity || 1}</p>
                                            <p>Đơn giá: {formatCurrency(item.unitPrice)}</p>
                                            {item.customizations && typeof item.customizations === 'object' && (
                                                <div className="custom-tags">
                                                    {Object.entries(item.customizations).map(([key, value]) => (
                                                        <span key={key}>{key}: {String(value)}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                )) : (
                                    <div className="empty-items">Đơn hàng này chưa có sản phẩm chi tiết.</div>
                                )}
                            </div>
                        </section>
                    </main>

                    <aside className="detail-aside">
                        <section className="panel summary-panel">
                            <div className="panel-head">
                                <h2>Tổng quan đơn hàng</h2>
                            </div>
                            <ul className="summary-list">
                                <li><FiHash /> <span>Mã đơn</span><strong>#{order.orderId}</strong></li>
                                <li><FiCalendar /> <span>Ngày đặt</span><strong>{formatDateTime(order.orderDate || order.createAt)}</strong></li>
                                <li><FiTruck /> <span>Trạng thái</span><strong>{statusMeta.label}</strong></li>
                                <li><FiCreditCard /> <span>Thanh toán</span><strong>{order.paymentMethod || '—'}</strong></li>
                                <li><FiUser /> <span>Khách hàng</span><strong>{order.fullName || '—'}</strong></li>
                            </ul>
                        </section>

                        <section className="panel">
                            <div className="panel-head">
                                <h2>Thông tin thanh toán</h2>
                            </div>
                            <div className="payment-box">
                                <div>
                                    <span>Tạm tính</span>
                                    <strong>{formatCurrency(order.total)}</strong>
                                </div>
                                <div>
                                    <span>Phí vận chuyển</span>
                                    <strong>{formatCurrency(order.shippingFee || 0)}</strong>
                                </div>
                                <div className="payment-total">
                                    <span>Tổng cộng</span>
                                    <strong>{formatCurrency(order.total)}</strong>
                                </div>
                            </div>
                        </section>

                        <section className="panel">
                            <div className="panel-head">
                                <h2>Thông tin giao hàng</h2>
                            </div>
                            <div className="shipping-box">
                                <p><strong>Người nhận:</strong> {order.fullName || '—'}</p>
                                <p><strong>Số điện thoại:</strong> {order.phone || order.recipientPhone || '—'}</p>
                                <p><strong>Địa chỉ:</strong> {order.address || order.deliveryAddress || '—'}</p>
                                <p><strong>Ghi chú:</strong> {order.note || '—'}</p>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;

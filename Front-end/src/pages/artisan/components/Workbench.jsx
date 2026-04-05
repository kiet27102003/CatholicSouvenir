import React, { useState, useEffect, useCallback } from 'react';
import { getOrdersByArtisan, updateOrderStatus, deleteOrder, getArtisanMyRequests, getCustomRequestById } from '../../../services/orderService';
import { appToast } from '../../../lib/appToast';
import './Workbench.css';

/** Các trạng thái đơn hàng dùng cho PUT /api/order/{orderId}. Màu hiển thị trên UI. */
const ORDER_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Chờ xử lý', color: 'yellow', emoji: '🟡' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'blue', emoji: '🔵' },
    { value: 'SHIPPING', label: 'Đang giao', color: 'purple', emoji: '🟣' },
    { value: 'COMPLETED', label: 'Hoàn thành', color: 'green', emoji: '🟢' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'red', emoji: '🔴' },
];

const Workbench = ({ user }) => {
    const artisanId = user?.id || user?.artisanId || user?.artisanUuid;
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoadFailed, setOrdersLoadFailed] = useState(false);
    const [detailOrder, setDetailOrder] = useState(null);
    const [orderPendingDelete, setOrderPendingDelete] = useState(null);
    const [inquiries, setInquiries] = useState([]);
    const [inquiriesLoading, setInquiriesLoading] = useState(true);
    const [inquiriesLoadFailed, setInquiriesLoadFailed] = useState(false);
    const [detailInquiry, setDetailInquiry] = useState(null);
    const [detailInquiryRequestId, setDetailInquiryRequestId] = useState(null);
    const [detailInquiryLoading, setDetailInquiryLoading] = useState(false);

    useEffect(() => {
        if (!artisanId) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setOrdersLoadFailed(false);
        getOrdersByArtisan(artisanId)
            .then((res) => {
                if (cancelled) return;
                if (res.success && Array.isArray(res.data)) setOrders(res.data);
                else if (!res.success) {
                    setOrdersLoadFailed(true);
                    appToast.error('Không tải được', res.error || 'Kiểm tra kết nối mạng');
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setOrdersLoadFailed(true);
                    appToast.error('Không tải được', 'Kiểm tra kết nối mạng');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [artisanId]);

    useEffect(() => {
        let cancelled = false;
        setInquiriesLoading(true);
        setInquiriesLoadFailed(false);
        getArtisanMyRequests()
            .then((res) => {
                if (cancelled) return;
                if (res.success && Array.isArray(res.data)) setInquiries(res.data);
                else if (!res.success) {
                    setInquiriesLoadFailed(true);
                    appToast.error('Không tải được', res.error || 'Kiểm tra kết nối mạng');
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setInquiriesLoadFailed(true);
                    appToast.error('Không tải được', 'Kiểm tra kết nối mạng');
                }
            })
            .finally(() => {
                if (!cancelled) setInquiriesLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const refreshOrders = useCallback(async () => {
        if (!artisanId) return;
        const res = await getOrdersByArtisan(artisanId);
        if (res.success && Array.isArray(res.data)) {
            setOrders(res.data);
            if (detailOrder) {
                const id = detailOrder.orderId || detailOrder.id;
                const updated = res.data.find((o) => (o.orderId || o.id) === id);
                if (updated) setDetailOrder(updated);
            }
        }
    }, [artisanId, detailOrder]);

    const handleViewInquiryDetail = useCallback(async (requestId) => {
        if (!requestId) return;
        setDetailInquiryRequestId(requestId);
        setDetailInquiryLoading(true);
        setDetailInquiry(null);
        const res = await getCustomRequestById(requestId);
        setDetailInquiryLoading(false);
        if (res.success) {
            setDetailInquiry(res.data);
        } else {
            appToast.error('Không tải được', res.error || 'Không tải được chi tiết yêu cầu.');
            setDetailInquiryRequestId(null);
        }
    }, []);

    const requestDeleteOrder = useCallback((order) => {
        setOrderPendingDelete(order);
    }, []);

    const cancelDeleteOrder = useCallback(() => setOrderPendingDelete(null), []);

    const executeDeleteOrder = useCallback(async () => {
        const order = orderPendingDelete;
        if (!order) return;
        const orderId = order.orderId || order.id;
        if (!orderId) {
            setOrderPendingDelete(null);
            return;
        }
        const result = await deleteOrder(orderId);
        if (result.success) {
            appToast.success('Đã xóa', 'Đơn hàng đã được xóa');
            setDetailOrder(null);
            setOrderPendingDelete(null);
            await refreshOrders();
        } else {
            appToast.error('Có lỗi xảy ra', result.error || 'Vui lòng thử lại');
        }
    }, [orderPendingDelete, refreshOrders]);

    const activeCommissions = orders;

    return (
        <div className="workbench">
            <header className="workbench-header">
                <div className="header-left">
                    <h1 className="workbench-title">Workbench</h1>
                    <p className="workbench-subtitle">Manage your active commissions and new requests.</p>
                </div>
                <div className="header-right">
                    <button className="btn-status">
                        <span className="status-indicator"></span>
                        Accepting Orders
                    </button>
                    <button className="btn-primary">+ Log Offline Sale</button>
                </div>
            </header>

            <div className="workbench-stats">
                <div className="stat-card">
                    <div className="stat-icon stat-icon-blue">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Active Commissions</p>
                        <p className="stat-value">{activeCommissions.length}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-green">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2V6M12 18V22M6 12H2M22 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Earnings (This Month)</p>
                        <p className="stat-value">—</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-purple">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Avg. Completion Time</p>
                        <p className="stat-value">—</p>
                    </div>
                </div>
            </div>

            <div className="workbench-content">
                <div className="commissions-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            <span className="section-icon">🎨</span>
                            In The Workshop
                        </h2>
                        <a href="#all" className="view-all-link">View All</a>
                    </div>

                    <div className="commissions-grid">
                        {loading ? (
                            <p className="view-placeholder">Đang tải đơn hàng...</p>
                        ) : ordersLoadFailed ? (
                            <p className="view-placeholder">Không tải được danh sách đơn hàng.</p>
                        ) : activeCommissions.length === 0 ? (
                            <p className="view-placeholder">Chưa có đơn hàng. Khi có đơn hàng, chúng sẽ hiển thị tại đây.</p>
                        ) : (
                            activeCommissions.map((order) => (
                                <OrderCard
                                    key={order.orderId || order.id}
                                    order={order}
                                    onViewDetail={() => setDetailOrder(order)}
                                    onDelete={() => requestDeleteOrder(order)}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="inquiries-section">
                    <div className="inquiry-header">
                        <div className="inquiry-title-wrapper">
                            <h2 className="section-title">
                                <span className="section-icon">✉️</span>
                                New Inquiries
                            </h2>
                            {inquiries.length > 0 && <span className="badge-new">{inquiries.length} New</span>}
                        </div>
                    </div>

                    <div className="inquiries-list">
                        {inquiriesLoading ? (
                            <p className="view-placeholder">Đang tải yêu cầu...</p>
                        ) : inquiriesLoadFailed ? (
                            <p className="view-placeholder">Không tải được danh sách yêu cầu.</p>
                        ) : inquiries.length === 0 ? (
                            <p className="view-placeholder">Chưa có yêu cầu mới. Các yêu cầu custom sẽ hiển thị tại đây.</p>
                        ) : (
                            inquiries.map((inquiry, index) => (
                                <InquiryCard
                                    key={getInquiryRequestId(inquiry) || `inquiry-${index}`}
                                    inquiry={inquiry}
                                    onViewDetail={handleViewInquiryDetail}
                                />
                            ))
                        )}
                    </div>

                    <div className="liturgical-calendar">
                        <div className="calendar-header">
                            <h3>Liturgical Calendar</h3>
                        </div>
                        <div className="calendar-content">
                            <p>Check upcoming feast days to plan your crafting schedule accordingly.</p>
                            <button className="btn-calendar">View Calendar</button>
                        </div>
                    </div>
                </div>
            </div>

            {detailOrder && (
                <OrderDetailModal
                    order={detailOrder}
                    onClose={() => setDetailOrder(null)}
                    onStatusUpdated={refreshOrders}
                    onDelete={() => requestDeleteOrder(detailOrder)}
                    statusOptions={ORDER_STATUS_OPTIONS}
                />
            )}

            {(detailInquiryRequestId || detailInquiry !== null || detailInquiryLoading) && (
                <InquiryDetailModal
                    requestId={detailInquiryRequestId ?? detailInquiry?.id ?? detailInquiry?.customRequestId}
                    detail={detailInquiry}
                    loading={detailInquiryLoading}
                    onClose={() => {
                        setDetailInquiryRequestId(null);
                        setDetailInquiry(null);
                    }}
                />
            )}

            {orderPendingDelete && (
                <div className="order-detail-overlay" role="presentation" onClick={cancelDeleteOrder}>
                    <div
                        className="order-detail-modal"
                        style={{ maxWidth: 420 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="wb-delete-order-title"
                    >
                        <div className="order-detail-header">
                            <h2 id="wb-delete-order-title" className="order-detail-title">Xác nhận xóa đơn</h2>
                            <button type="button" className="order-detail-close" onClick={cancelDeleteOrder} aria-label="Đóng">
                                ×
                            </button>
                        </div>
                        <div className="order-detail-body">
                            <p className="view-placeholder" style={{ margin: 0 }}>
                                Bạn có chắc muốn xóa đơn hàng này? Hành động không thể hoàn tác.
                            </p>
                        </div>
                        <div className="order-detail-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-order-detail" onClick={cancelDeleteOrder}>
                                Hủy
                            </button>
                            <button type="button" className="btn-order-delete" onClick={executeDeleteOrder}>
                                Xóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const formatVnd = (value) => `${Number(value).toLocaleString('vi-VN')} ₫`;

const getOrderStatusLabel = (status) => {
    const s = (status || '').toUpperCase();
    const opt = ORDER_STATUS_OPTIONS.find((o) => o.value === s);
    if (opt) return opt.label;
    const fallback = { PROCESSING: 'Đang xử lý', IN_PROGRESS: 'Đang giao', SHIPPED: 'Đang giao', DELIVERED: 'Đã giao', CANCELED: 'Đã hủy' };
    return fallback[s] || status || '—';
};

const getOrderStatusOption = (status) => {
    const s = (status || '').toUpperCase();
    const found = ORDER_STATUS_OPTIONS.find((o) => o.value === s);
    if (found) return found;
    return { value: s, label: getOrderStatusLabel(status), color: 'default', emoji: '⚪' };
};

const getPaymentMethodLabel = (method) => {
    const m = (method || '').toUpperCase();
    const map = { COD: 'COD', CARD: 'Thẻ', PAYPAL: 'PayPal', BANK: 'Chuyển khoản' };
    return map[m] || method || '—';
};

/** Rút gọn UUID để hiển thị (8 ký tự đầu). */
const shortOrderId = (id) => (id ? `${String(id).slice(0, 8)}…` : '—');

const OrderCard = ({ order, onViewDetail, onDelete }) => {
    const orderId = order.orderId || order.id;
    const date = order.orderDate
        ? new Date(order.orderDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
        : '—';
    const details = order.orderDetails || [];
    const productCount = details.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

    return (
        <div className="commission-card order-card">
            <div className="commission-content">
                <div className="commission-id">#{shortOrderId(orderId)}</div>
                <h3 className="commission-title">Đơn {shortOrderId(orderId)}</h3>
                <dl className="order-card-fields">
                    <div className="order-card-row">
                        <dt>Ngày đặt</dt>
                        <dd>{date}</dd>
                    </div>
                    <div className="order-card-row">
                        <dt>Tổng tiền</dt>
                        <dd>{formatVnd(order.total ?? 0)}</dd>
                    </div>
                    <div className="order-card-row">
                        <dt>Trạng thái</dt>
                        <dd>
                            <span className={`status-badge status-badge--${getOrderStatusOption(order.status).color}`}>
                                {getOrderStatusOption(order.status).emoji} {getOrderStatusLabel(order.status)}
                            </span>
                        </dd>
                    </div>
                    <div className="order-card-row">
                        <dt>Thanh toán</dt>
                        <dd>{getPaymentMethodLabel(order.paymentMethod)}</dd>
                    </div>
                    <div className="order-card-row">
                        <dt>Số sản phẩm</dt>
                        <dd>{productCount} sản phẩm</dd>
                    </div>
                </dl>
                <div className="order-card-actions">
                    <button type="button" className="btn-order-detail" onClick={onViewDetail}>
                        Xem chi tiết
                    </button>
                    <button type="button" className="btn-order-update" onClick={onViewDetail}>
                        Cập nhật
                    </button>
                    <button type="button" className="btn-order-delete" onClick={onDelete}>
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
};

/** Modal hiển thị đầy đủ thông tin đơn + cập nhật trạng thái (PUT) + xóa (DELETE /api/order/{orderId}). */
const OrderDetailModal = ({ order, onClose, onStatusUpdated, onDelete, statusOptions }) => {
    const [updating, setUpdating] = useState(false);
    if (!order) return null;
    const details = order.orderDetails || [];
    const formatDate = (v) => (v ? new Date(v).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
    const currentOption = getOrderStatusOption(order.status);

    const handleStatusChange = async (newStatus) => {
        const orderId = order.orderId || order.id;
        if (!orderId || newStatus === (order.status || '').toUpperCase()) return;
        setUpdating(true);
        const result = await updateOrderStatus(orderId, newStatus);
        setUpdating(false);
        if (result.success) {
            appToast.success('Đã cập nhật', 'Trạng thái đơn hàng đã được lưu');
            onStatusUpdated?.();
        } else {
            appToast.error('Có lỗi xảy ra', result.error || 'Vui lòng thử lại');
        }
    };

    return (
        <div className="order-detail-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
            <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="order-detail-header">
                    <h2 id="order-detail-title" className="order-detail-title">Chi tiết đơn hàng</h2>
                    <button type="button" className="order-detail-close" onClick={onClose} aria-label="Đóng">
                        ×
                    </button>
                </div>
                <div className="order-detail-body">
                    <section className="order-detail-section">
                        <h3>Thông tin chung</h3>
                        <dl className="order-detail-dl">
                            <div className="order-detail-row">
                                <dt>Order ID</dt>
                                <dd className="order-detail-id">{order.orderId || order.id || '—'}</dd>
                            </div>
                            <div className="order-detail-row">
                                <dt>Ngày đặt</dt>
                                <dd>{formatDate(order.orderDate)}</dd>
                            </div>
                            <div className="order-detail-row">
                                <dt>Tổng tiền</dt>
                                <dd>{formatVnd(order.total ?? 0)}</dd>
                            </div>
                            <div className="order-detail-row order-detail-row-status">
                                <dt>Trạng thái</dt>
                                <dd className="order-detail-status-cell">
                                    <span className={`status-badge status-badge--${currentOption.color}`}>
                                        {currentOption.emoji} {getOrderStatusLabel(order.status)}
                                    </span>
                                    {statusOptions && statusOptions.length > 0 && (
                                        <div className="order-detail-status-actions">
                                            {statusOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    className={`order-status-btn order-status-btn--${opt.color}`}
                                                    disabled={updating || (order.status || '').toUpperCase() === opt.value}
                                                    onClick={() => handleStatusChange(opt.value)}
                                                    title={opt.label}
                                                >
                                                    <span className="order-status-btn-emoji">{opt.emoji}</span>
                                                    <span>{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </dd>
                            </div>
                            <div className="order-detail-row">
                                <dt>Thanh toán</dt>
                                <dd>{getPaymentMethodLabel(order.paymentMethod)}</dd>
                            </div>
                            {order.createAt != null && (
                                <div className="order-detail-row">
                                    <dt>Create At</dt>
                                    <dd>{formatDate(order.createAt)}</dd>
                                </div>
                            )}
                            {order.updateAt != null && (
                                <div className="order-detail-row">
                                    <dt>Update At</dt>
                                    <dd>{formatDate(order.updateAt)}</dd>
                                </div>
                            )}
                            {order.customerId && (
                                <div className="order-detail-row">
                                    <dt>Customer ID</dt>
                                    <dd className="order-detail-id">{order.customerId}</dd>
                                </div>
                            )}
                        </dl>
                    </section>
                    <section className="order-detail-section">
                        <h3>Chi tiết sản phẩm ({details.length})</h3>
                        {details.length === 0 ? (
                            <p className="order-detail-empty">Không có chi tiết.</p>
                        ) : (
                            <div className="order-detail-table-wrap">
                                <table className="order-detail-table">
                                    <thead>
                                        <tr>
                                            <th>Product ID</th>
                                            <th>SL</th>
                                            <th>Đơn giá</th>
                                            <th>Thành tiền</th>
                                            <th>Giảm giá</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {details.map((d) => (
                                            <tr key={d.id || d.productId}>
                                                <td className="order-detail-id">{d.productId || '—'}</td>
                                                <td>{d.quantity ?? '—'}</td>
                                                <td>{formatVnd(d.unitPrice)}</td>
                                                <td>{formatVnd(d.subTotal)}</td>
                                                <td>{formatVnd(d.discount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
                <div className="order-detail-footer">
                    {onDelete && (
                        <button type="button" className="btn-order-delete" onClick={onDelete}>
                            Xóa đơn
                        </button>
                    )}
                    <button type="button" className="btn-order-detail" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

const CommissionCard = ({ commission }) => {
    return (
        <div className="commission-card">
            <div className="commission-image">
                <img
                    src={commission.id === 'CM-459'
                        ? 'https://images.unsplash.com/photo-1611163968425-b6c0e18d7958?w=400&h=400&fit=crop'
                        : 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop'
                    }
                    alt={commission.title}
                />
                <div className="commission-id">#{commission.id}</div>
            </div>

            <div className="commission-content">
                <h3 className="commission-title">{commission.title}</h3>
                <div className="commission-client">
                    <img src={commission.client.avatar} alt={commission.client.name} />
                    <span>for {commission.client.name}</span>
                </div>

                {commission.status && (
                    <div className="commission-status">
                        <div className="status-badge">
                            Feast of the<br />Assumption
                        </div>
                        <span className="days-left">{commission.daysLeft} days left</span>
                    </div>
                )}

                {commission.dueDate && (
                    <div className="commission-due">
                        <span className="due-label">Due: {commission.dueDate}</span>
                        <span className="days-left">{commission.daysLeft} days left</span>
                    </div>
                )}

                <div className="commission-phase">
                    <span className="phase-label">Current Phase: {commission.currentPhase}</span>
                    <span className="phase-progress">{commission.progress}%</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${commission.progress}%` }}></div>
                </div>

                <div className="commission-actions">
                    <button className="btn-update">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Update Progress
                    </button>
                    <button className="btn-message">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 8L10.89 13.26C11.5417 13.6761 12.4583 13.6761 13.11 13.26L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        Message
                    </button>
                </div>
            </div>
        </div>
    );
};

/** Chuỗi ISO không có timezone (Z hoặc ±HH:MM) → coi là UTC rồi parse. */
const toUtcDate = (v) => {
    if (v == null) return null;
    if (typeof v === 'string') {
        const s = v.trim();
        if (s && !/Z|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s + 'Z');
    }
    return new Date(v);
};

/** Format ngày giờ theo múi giờ Việt Nam (UTC+7). */
const formatDateVNT = (v) => (v ? toUtcDate(v).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }) : '—');

/** Modal chi tiết yêu cầu custom (GET /api/custom-requests/{requestId}). */
const InquiryDetailModal = ({ requestId, detail, loading, onClose }) => {
    if (!requestId && !detail && !loading) return null;
    return (
        <div className="order-detail-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="inquiry-detail-title">
            <div className="order-detail-modal inquiry-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="order-detail-header">
                    <h2 id="inquiry-detail-title" className="order-detail-title">Chi tiết yêu cầu custom</h2>
                    <button type="button" className="order-detail-close" onClick={onClose} aria-label="Đóng">×</button>
                </div>
                <div className="order-detail-body">
                    {loading && (
                        <p className="view-placeholder">Đang tải chi tiết...</p>
                    )}
                    {!loading && detail && (
                        <>
                            <section className="order-detail-section">
                                <h3>Thông tin chung</h3>
                                <dl className="order-detail-dl">
                                    <div className="order-detail-row">
                                        <dt>ID</dt>
                                        <dd className="order-detail-id">{detail.id ?? detail.customRequestId ?? requestId ?? '—'}</dd>
                                    </div>
                                    <div className="order-detail-row">
                                        <dt>Tiêu đề</dt>
                                        <dd>{detail.title ?? '—'}</dd>
                                    </div>
                                    <div className="order-detail-row">
                                        <dt>Mô tả</dt>
                                        <dd>{detail.description ?? '—'}</dd>
                                    </div>
                                    <div className="order-detail-row">
                                        <dt>Ngày tạo</dt>
                                        <dd>{formatDateVNT(detail.createdAt ?? detail.createAt)}</dd>
                                    </div>
                                    {detail.status != null && (
                                        <div className="order-detail-row">
                                            <dt>Trạng thái</dt>
                                            <dd>{detail.status}</dd>
                                        </div>
                                    )}
                                    {detail.customerName && (
                                        <div className="order-detail-row">
                                            <dt>Khách hàng</dt>
                                            <dd>{detail.customerName}</dd>
                                        </div>
                                    )}
                                    {detail.accountId && (
                                        <div className="order-detail-row">
                                            <dt>Account ID</dt>
                                            <dd className="order-detail-id">{detail.accountId}</dd>
                                        </div>
                                    )}
                                </dl>
                            </section>
                            {(detail.referenceImageUrl || detail.aiImageUrl) && (
                                <section className="order-detail-section">
                                    <h3>Ảnh tham khảo</h3>
                                    <div className="inquiry-detail-images">
                                        {detail.referenceImageUrl && (
                                            <div className="inquiry-detail-image-wrap">
                                                <span className="inquiry-detail-image-label">Ảnh tham khảo</span>
                                                <img src={detail.referenceImageUrl} alt="Tham khảo" className="inquiry-detail-image" />
                                            </div>
                                        )}
                                        {detail.aiImageUrl && (
                                            <div className="inquiry-detail-image-wrap">
                                                <span className="inquiry-detail-image-label">Ảnh AI</span>
                                                <img src={detail.aiImageUrl} alt="Ảnh AI" className="inquiry-detail-image" />
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
                <div className="order-detail-footer">
                    <button type="button" className="btn-order-detail" onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
};

/** Rút ra requestId từ object inquiry (API có thể trả về id với tên khác nhau). */
const getInquiryRequestId = (inquiry) => {
    if (!inquiry) return null;
    return inquiry.id ?? inquiry.customRequestId ?? inquiry.requestId ?? inquiry.uuid ?? null;
};

const InquiryCard = ({ inquiry, onViewDetail }) => {
    const title = inquiry?.title ?? 'Yêu cầu custom';
    const description = inquiry?.description ?? '';
    const createdAt = inquiry?.createdAt ?? inquiry?.createAt;
    const timeAgo = createdAt
        ? (() => {
            const d = new Date(createdAt);
            const now = new Date();
            const diffMs = now - d;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (diffMins < 60) return `${diffMins} phút trước`;
            if (diffHours < 24) return `${diffHours} giờ trước`;
            if (diffDays < 7) return `${diffDays} ngày trước`;
            return d.toLocaleDateString('vi-VN', { dateStyle: 'short' });
          })()
        : '';
    const clientName = inquiry?.customerName ?? inquiry?.client?.name ?? inquiry?.accountName ?? 'Khách hàng';
    const initials = (clientName || 'K').slice(0, 2).toUpperCase();
    const budget = inquiry?.budget ?? inquiry?.estimatedBudget;
    const requestId = getInquiryRequestId(inquiry);

    const handleViewDetail = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!onViewDetail) return;
        if (!requestId) {
            appToast.warning('Thiếu thông tin', 'Không có ID yêu cầu. Kiểm tra dữ liệu từ API.');
            return;
        }
        onViewDetail(requestId);
    };

    return (
        <div className="inquiry-card">
            <div className="inquiry-header-row">
                <div className="inquiry-client">
                    <div className="client-avatar">{inquiry?.client?.initials ?? initials}</div>
                    <div className="client-info">
                        <h4>{clientName}</h4>
                        <span className="time-ago">{inquiry?.timeAgo ?? timeAgo}</span>
                    </div>
                </div>
            </div>
            <h3 className="inquiry-title">{title}</h3>
            <p className="inquiry-description">{description || '—'}</p>
            <div className="inquiry-footer">
                {budget != null && (
                    <div className="inquiry-budget">
                        <span className="budget-label">Budget:</span>
                        <span className="budget-value">${budget}</span>
                    </div>
                )}
                <button type="button" className="review-link" onClick={handleViewDetail}>Xem chi tiết</button>
            </div>
            <div className="inquiry-actions">
                <button className="btn-accept">Chấp nhận</button>
                <button className="btn-decline">Từ chối</button>
            </div>
        </div>
    );
};

export default Workbench;

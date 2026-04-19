import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiCreditCard, FiHash, FiPackage, FiTruck, FiUser } from 'react-icons/fi';
import { appToast } from '../../lib/appToast';
import { getOrderById, updateOrderStatus } from '../../services/orderService';
import paymentService from '../../services/paymentService';
import shipmentService from '../../services/shipmentService';
import ImageUpload from '../../components/ui/ImageUpload';
import { createComplaint } from '../../services/complaintService';
import './OrderTrackingPage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatDateTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

const STATUS_META = {
    PENDING: { label: 'Chờ thanh toán', className: 'status-pending' },
    PAID: { label: 'Đã thanh toán', className: 'status-paid' },
    SHIPPING: { label: 'Đang giao hàng', className: 'status-shipping' },
    DELIVERED: { label: 'Hoàn thành', className: 'status-delivered' },
    CANCELLED: { label: 'Đã huỷ', className: 'status-cancelled' },
};

const getStatusMeta = (status) => {
    const key = String(status || '').toUpperCase();
    return STATUS_META[key] || { label: key || 'Không xác định', className: 'status-unknown' };
};

const getItemImage = (item) => item?.image || item?.images?.[0]?.image_url || item?.thumbnail || 'https://via.placeholder.com/96x96?text=SP';
const getItemName = (item) => item?.productName || item?.templateName || 'Sản phẩm tuỳ chỉnh';

const OrderTrackingPage = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [shipment, setShipment] = useState(null);
    const [payments, setPayments] = useState([]);
    const [cancelling, setCancelling] = useState(false);
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [complaintForm, setComplaintForm] = useState({ reason: '', evidenceImages: [] });
    const [complaintSubmitting, setComplaintSubmitting] = useState(false);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            const [orderRes, paymentRes, shipmentRes] = await Promise.all([
                getOrderById(orderId),
                paymentService.getPaymentsByOrder(orderId),
                shipmentService.getShipmentByOrderId(orderId),
            ]);

            if (cancelled) return;

            if (!orderRes.success) {
                appToast.error('Không tải được đơn hàng', orderRes.error || 'Vui lòng thử lại');
                setLoading(false);
                return;
            }

            setOrder(orderRes.data || null);
            setPayments(paymentRes.success ? (paymentRes.data || []) : []);
            setShipment(shipmentRes.success ? (shipmentRes.data || null) : null);
            setLoading(false);
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [orderId]);

    const allItems = useMemo(() => {
        const orderDetails = Array.isArray(order?.orderDetails) ? order.orderDetails : [];
        const templateDetails = Array.isArray(order?.templateDetails) ? order.templateDetails : [];
        return [...orderDetails, ...templateDetails];
    }, [order]);

    const latestPayment = useMemo(() => {
        if (!payments.length) return null;
        return [...payments].sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0))[0];
    }, [payments]);

    const statusMeta = useMemo(() => getStatusMeta(order?.status), [order?.status]);

    const handleCancelOrder = async () => {
        if (!order || cancelling) return;
        const accepted = window.confirm('Bạn có chắc chắn muốn huỷ đơn hàng này?');
        if (!accepted) return;

        setCancelling(true);
        const res = await updateOrderStatus(order.orderId, 'CANCELLED');
        setCancelling(false);

        if (!res.success) {
            appToast.error('Huỷ đơn thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Huỷ đơn thành công');
        const refreshed = await getOrderById(orderId);
        if (refreshed.success) setOrder(refreshed.data || null);
    };

    const openComplaintModal = () => {
        setComplaintForm({
            reason: '',
            evidenceImages: [],
        });
        setComplaintOpen(true);
    };

    const closeComplaintModal = () => {
        if (complaintSubmitting) return;
        setComplaintOpen(false);
    };

    const handleComplaintSubmit = async () => {
        if (complaintSubmitting) return;
        if (!complaintForm.reason.trim()) {
            appToast.error('Thiếu thông tin khiếu nại', 'Vui lòng nhập nội dung khiếu nại.');
            return;
        }

        const evidenceImages = Array.isArray(complaintForm.evidenceImages)
            ? complaintForm.evidenceImages.filter(Boolean).slice(0, 10)
            : [];

        const complaintPayload = {
            orderId: order?.orderId || orderId,
            customOrderId: order?.customOrderId || order?.id || order?.orderId || orderId,
            productId: order?.productId || order?.templateId || order?.orderDetails?.[0]?.productId || order?.templateDetails?.[0]?.templateId || null,
            reason: complaintForm.reason.trim(),
            evidenceImages,
        };

        setComplaintSubmitting(true);
        try {
            const res = await createComplaint(complaintPayload);
            if (!res.success) {
                appToast.error('Không gửi được khiếu nại', res.error || 'Vui lòng thử lại.');
                return;
            }

            appToast.success('Đã ghi nhận yêu cầu khiếu nại', 'Bộ phận CSKH sẽ liên hệ lại sớm nhất có thể.');
            setComplaintOpen(false);
            setComplaintForm({ reason: '', evidenceImages: [] });
        } catch {
            appToast.error('Không gửi được khiếu nại', 'Vui lòng thử lại.');
        } finally {
            setComplaintSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="order-tracking-page">
                <div className="tracking-skeleton hero" />
                <div className="tracking-skeleton content" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-tracking-page empty-state">
                <h2>Không tìm thấy đơn hàng</h2>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/orders')}>
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="order-tracking-page">
            <div className="tracking-shell">
                <button type="button" className="back-link" onClick={() => navigate('/orders')}>
                    <FiArrowLeft /> Quay lại đơn hàng
                </button>

                <section className="hero-card">
                    <div>
                        <div className={`status-pill ${statusMeta.className}`}>{statusMeta.label}</div>
                        <h1>#{order.orderId}</h1>
                        <p>Đơn hàng của <strong>{order.fullName || '—'}</strong> được tạo lúc {formatDateTime(order.orderDate || order.createAt)}</p>
                    </div>

                    <div className="hero-summary">
                        <div className="summary-chip"><FiPackage /><span>{allItems.length} sản phẩm</span></div>
                        <div className="summary-chip"><FiCreditCard /><span>{order.paymentMethod || '—'}</span></div>
                        <div className="summary-chip"><FiCalendar /><span>{formatDateTime(order.updateAt)}</span></div>
                    </div>
                </section>

                <div className="tracking-grid">
                    <main>
                        <section className="panel">
                            <div className="panel-head">
                                <h2>Sản phẩm đặt mua</h2>
                                <span>{formatCurrency(order.total)}</span>
                            </div>

                            <div className="items-list">
                                {allItems.length > 0 ? allItems.map((item, idx) => (
                                    <article key={`${item.id || idx}`} className="item-row">
                                        <img src={getItemImage(item)} alt={getItemName(item)} />
                                        <div className="item-info">
                                            <h3>{getItemName(item)}</h3>
                                            <p>x{item.quantity || 1} · Đơn giá: {formatCurrency(item.unitPrice)}</p>
                                            {item.customizations && typeof item.customizations === 'object' && (
                                                <div className="custom-tags">
                                                    {Object.entries(item.customizations).map(([key, value]) => (
                                                        <span key={key}>{key}: {String(value)}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <strong>{formatCurrency(item.subTotal ?? item.subtotal ?? 0)}</strong>
                                    </article>
                                )) : (
                                    <div className="empty-items">Đơn hàng chưa có sản phẩm chi tiết.</div>
                                )}
                            </div>
                        </section>

                        <section className="panel">
                            <div className="panel-head">
                                <h2>Thông tin giao hàng</h2>
                            </div>
                            <div className="info-grid">
                                <div><FiUser /><span>Người nhận</span><strong>{order.fullName || '—'}</strong></div>
                                <div><FiTruck /><span>Trạng thái</span><strong>{statusMeta.label}</strong></div>
                                <div className="full"><FiHash /><span>Mã đơn</span><strong>{order.orderId}</strong></div>
                                <div className="full"><FiTruck /><span>Địa chỉ</span><strong>{order.shippingAddress || '—'}</strong></div>
                            </div>
                        </section>

                        <section className="panel">
                            <div className="panel-head">
                                <h2>Thanh toán</h2>
                            </div>
                            {latestPayment ? (
                                <div className="payment-box">
                                    <p><span>Phương thức</span><strong>{latestPayment.paymentMethod || order.paymentMethod || '—'}</strong></p>
                                    <p><span>Mã giao dịch</span><strong>{latestPayment.transactionId || '—'}</strong></p>
                                    <p><span>Thời gian</span><strong>{formatDateTime(latestPayment.paidAt || latestPayment.createdAt)}</strong></p>
                                </div>
                            ) : (
                                <div className="empty-items">Chưa có dữ liệu thanh toán.</div>
                            )}
                        </section>
                    </main>

                    <aside>
                        <section className="panel">
                            <div className="panel-head">
                                <h2>Tóm tắt đơn hàng</h2>
                            </div>
                            <div className="summary-box">
                                <p><span>Tổng tiền</span><strong>{formatCurrency(order.total)}</strong></p>
                                <p><span>Phí vận chuyển</span><strong>{formatCurrency(shipment?.shippingFee || 0)}</strong></p>
                                <p><span>Khách hàng</span><strong>{order.fullName || '—'}</strong></p>
                                <p><span>Thanh toán</span><strong>{order.paymentMethod || '—'}</strong></p>
                            </div>
                        </section>

                        <section className="panel">
                            <div className="panel-head">
                                <h2>Vận chuyển</h2>
                            </div>
                            {shipment?.trackingNumber ? (
                                <div className="summary-box">
                                    <p><span>Mã vận đơn</span><strong>{shipment.trackingNumber}</strong></p>
                                    <p><span>Trạng thái</span><strong>{shipment.status || '—'}</strong></p>
                                </div>
                            ) : (
                                <div className="empty-items">Đơn hàng chưa có thông tin vận chuyển.</div>
                            )}
                        </section>

                        <div className="action-stack">
                            <button type="button" className="btn btn-outline btn-full" onClick={openComplaintModal}>
                                Khiếu nại đơn hàng
                            </button>
                            {String(order.status || '').toUpperCase() === 'PENDING' && (
                                <button type="button" className="btn btn-outline btn-full" onClick={handleCancelOrder} disabled={cancelling}>
                                    {cancelling ? 'Đang huỷ...' : 'Huỷ đơn'}
                                </button>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {complaintOpen && (
                <div className="modal-overlay" onClick={closeComplaintModal}>
                    <div className="complaint-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="complaint-title">
                        <div className="modal-header">
                            <div>
                                <p className="modal-kicker">Hỗ trợ khách hàng</p>
                                <h3 id="complaint-title">Gửi khiếu nại đơn hàng</h3>
                            </div>
                            <button type="button" className="modal-close" onClick={closeComplaintModal} disabled={complaintSubmitting}>
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <label>
                                <span>Nội dung khiếu nại</span>
                                <textarea
                                    rows="5"
                                    value={complaintForm.reason}
                                    onChange={(e) => setComplaintForm((prev) => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải"
                                />
                            </label>

                            <ImageUpload
                                label="Ảnh minh chứng"
                                helperText="Tải ảnh lên Supabase hoặc dán link ảnh có sẵn."
                                folder="complaints"
                                value={complaintForm.evidenceImages[0] || ''}
                                onChange={(nextValue) =>
                                    setComplaintForm((prev) => ({
                                        ...prev,
                                        evidenceImages: nextValue ? [nextValue] : [],
                                    }))
                                }
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn btn-outline" onClick={closeComplaintModal} disabled={complaintSubmitting}>
                                Huỷ
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleComplaintSubmit} disabled={complaintSubmitting}>
                                {complaintSubmitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderTrackingPage;

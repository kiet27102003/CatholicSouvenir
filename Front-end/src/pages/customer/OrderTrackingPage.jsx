import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import { getOrderById, updateOrderStatus } from '../../services/orderService';
import paymentService from '../../services/paymentService';
import shipmentService from '../../services/shipmentService';
import complaintService from '../../services/complaintService';
import ImageUpload from '../../components/ui/ImageUpload';
import './OrderTrackingPage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatDateTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

const STATUS_META = {
    PENDING: { label: 'Chờ thanh toán', className: 'badge-pending' },
    PAID: { label: 'Chờ lấy hàng', className: 'badge-paid' },
    SHIPPING: { label: 'Đang giao hàng', className: 'badge-shipping' },
    DELIVERED: { label: 'Hoàn thành', className: 'badge-delivered' },
    CANCELLED: { label: 'Đã huỷ', className: 'badge-cancelled' },
};

const getItemImage = (item) => item?.images?.[0]?.image_url || item?.thumbnail || 'https://via.placeholder.com/80x80?text=SP';

const normalizeTrackingText = (value) => String(value || '').toUpperCase();

const hasTrackKeyword = (trackingList, keywords) => {
    const normalizedKeywords = keywords.map((kw) => normalizeTrackingText(kw));
    return trackingList.some((track) => {
        const source = [track?.status, track?.description, track?.title, track?.event, track?.message]
            .map((v) => normalizeTrackingText(v))
            .join(' ');
        return normalizedKeywords.some((kw) => source.includes(kw));
    });
};

const findTrackingEvent = (trackingList, keywords) => {
    const normalizedKeywords = keywords.map((kw) => normalizeTrackingText(kw));
    return trackingList.find((track) => {
        const source = [track?.status, track?.description, track?.title, track?.event, track?.message]
            .map((v) => normalizeTrackingText(v))
            .join(' ');
        return normalizedKeywords.some((kw) => source.includes(kw));
    });
};

const normalizeTimeline = (timeline = []) => timeline.map((step) => ({
    key: step?.status || step?.key || step?.label,
    label: step?.label || step?.title || step?.status || '—',
    description: step?.description || step?.note || '',
    completed: Boolean(step?.completed),
    current: Boolean(step?.current),
    timestamp: step?.completedAt || step?.timestamp || step?.updatedAt || step?.createdAt,
}));

const OrderTrackingPage = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [shipment, setShipment] = useState(null);
    const [tracking, setTracking] = useState([]);
    const [payments, setPayments] = useState([]);
    const [cancelling, setCancelling] = useState(false);
    const [refunding, setRefunding] = useState(false);
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [complaintSubmitting, setComplaintSubmitting] = useState(false);
    const [complaintReason, setComplaintReason] = useState('');
    const [complaintEvidenceImages, setComplaintEvidenceImages] = useState(['']);
    const [timeline, setTimeline] = useState([]);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        const fetchAll = async () => {
            setLoading(true);

            const [orderRes, paymentRes, shipmentRes] = await Promise.all([
                getOrderById(orderId),
                paymentService.getPaymentsByOrder(orderId),
                shipmentService.getShipmentByOrderId(orderId),
            ]);

            if (cancelled) return;

            if (!orderRes.success) {
                appToast.error('Không tải được đơn hàng', orderRes.error || 'Vui lòng thử lại');
                setOrder(null);
                setLoading(false);
                return;
            }

            setOrder(orderRes.data || null);
            setPayments(paymentRes.success ? (paymentRes.data || []) : []);

            if (shipmentRes.success && shipmentRes.data) {
                setShipment(shipmentRes.data);
                const trackingNumber = shipmentRes.data.trackingNumber;
                if (trackingNumber) {
                    const trackingRes = await shipmentService.getTrackingByNumber(trackingNumber);
                    const timelineRes = await shipmentService.getShipmentTimeline(shipmentRes.data.shipmentId || shipmentRes.data.id);
                    if (!cancelled) {
                        setTracking(trackingRes.success ? (trackingRes.data || []) : []);
                        setTimeline(timelineRes.success ? normalizeTimeline(timelineRes.data?.timeline || []) : []);
                    }
                } else {
                    setTracking([]);
                    setTimeline([]);
                }
            } else {
                setShipment(null);
                setTracking([]);
                setTimeline([]);
            }

            setLoading(false);
        };

        fetchAll();
        return () => { cancelled = true; };
    }, [orderId]);

    const latestPayment = useMemo(() => {
        if (!payments.length) return null;
        return [...payments].sort((a, b) => {
            const ta = new Date(a.paidAt || a.createdAt || 0).getTime();
            const tb = new Date(b.paidAt || b.createdAt || 0).getTime();
            return tb - ta;
        })[0];
    }, [payments]);

    const allItems = useMemo(() => {
        const orderDetails = Array.isArray(order?.orderDetails) ? order.orderDetails : [];
        const templateDetails = Array.isArray(order?.templateDetails) ? order.templateDetails : [];
        return [...orderDetails, ...templateDetails];
    }, [order]);

    const subTotal = useMemo(() => allItems.reduce((sum, item) => sum + Number(item.subTotal || 0), 0), [allItems]);

    const trackingSteps = useMemo(() => {
        if (timeline.length) return timeline.map((step) => ({ ...step, state: step.completed ? 'done' : step.current ? 'active' : 'idle' }));
        const paidDone = String(latestPayment?.status || '').toUpperCase() === 'SUCCESS';
        const pickedEvent = findTrackingEvent(tracking, ['PICKED', 'PICKUP', 'LẤY HÀNG']);
        const inTransitEvent = findTrackingEvent(tracking, ['IN_TRANSIT', 'ĐANG VẬN CHUYỂN']);
        const deliveredEvent = findTrackingEvent(tracking, ['DELIVERED', 'GIAO THÀNH CÔNG']);

        return [
            { key: 'ORDERED', label: 'Đặt hàng thành công', state: 'done', time: order?.createAt || order?.createdAt || order?.orderDate, location: order?.shippingAddress },
            { key: 'PAID', label: 'Đã thanh toán', state: paidDone ? 'done' : 'idle', time: latestPayment?.paidAt || latestPayment?.createdAt, location: null },
            { key: 'PICKED', label: 'Đã lấy hàng', state: pickedEvent ? 'done' : 'idle', time: pickedEvent?.time || pickedEvent?.createdAt || pickedEvent?.updatedAt, location: pickedEvent?.location || pickedEvent?.hub },
            { key: 'TRANSIT', label: 'Đang vận chuyển', state: inTransitEvent ? 'active' : hasTrackKeyword(tracking, ['IN_TRANSIT', 'ĐANG VẬN CHUYỂN']) ? 'active' : 'idle', time: inTransitEvent?.time || inTransitEvent?.createdAt || inTransitEvent?.updatedAt, location: inTransitEvent?.location || inTransitEvent?.hub },
            { key: 'DELIVERED', label: 'Đã giao hàng', state: String(order?.status || '').toUpperCase() === 'DELIVERED' || deliveredEvent ? 'done' : 'idle', time: deliveredEvent?.time || deliveredEvent?.createdAt || deliveredEvent?.updatedAt, location: deliveredEvent?.location || deliveredEvent?.hub },
        ];
    }, [tracking, latestPayment, order, timeline]);

    const refreshOrderData = async () => {
        const [orderRes, paymentRes, shipmentRes] = await Promise.all([
            getOrderById(orderId),
            paymentService.getPaymentsByOrder(orderId),
            shipmentService.getShipmentByOrderId(orderId),
        ]);

        if (orderRes.success) setOrder(orderRes.data || null);
        if (paymentRes.success) setPayments(paymentRes.data || []);

        if (shipmentRes.success && shipmentRes.data?.trackingNumber) {
            setShipment(shipmentRes.data);
            const trackRes = await shipmentService.getTrackingByNumber(shipmentRes.data.trackingNumber);
            const timelineRes = await shipmentService.getShipmentTimeline(shipmentRes.data.shipmentId || shipmentRes.data.id);
            setTracking(trackRes.success ? (trackRes.data || []) : []);
            setTimeline(timelineRes.success ? normalizeTimeline(timelineRes.data?.timeline || []) : []);
        } else {
            setShipment(null);
            setTracking([]);
            setTimeline([]);
        }
    };

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
        await refreshOrderData();
    };

    const handleRefundRequest = async () => {
        if (!latestPayment?.paymentId || refunding) return;
        const reason = window.prompt('Nhập lý do hoàn tiền:');
        if (!reason || !reason.trim()) {
            appToast.info('Chưa gửi yêu cầu', 'Vui lòng nhập lý do hoàn tiền.');
            return;
        }

        setRefunding(true);
        const res = await paymentService.refundPayment(latestPayment.paymentId, reason.trim());
        setRefunding(false);

        if (!res.success) {
            appToast.error('Yêu cầu hoàn tiền thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Đã gửi yêu cầu hoàn tiền');
        await refreshOrderData();
    };

    const normalizeComplaintImages = () => complaintEvidenceImages.map((url) => String(url || '').trim()).filter(Boolean).slice(0, 5);

    const addComplaintImageField = () => {
        setComplaintEvidenceImages((prev) => (prev.length >= 5 ? prev : [...prev, '']));
    };

    const removeComplaintImageField = (index) => {
        setComplaintEvidenceImages((prev) => {
            if (prev.length <= 1) return [''];
            return prev.filter((_, idx) => idx !== index);
        });
    };

    const submitComplaint = async () => {
        if (!order?.orderId || complaintSubmitting) return;
        const reason = complaintReason.trim();
        if (reason.length < 20) {
            appToast.error('Lý do quá ngắn', 'Vui lòng nhập ít nhất 20 ký tự');
            return;
        }

        setComplaintSubmitting(true);
        const res = await complaintService.createComplaint({
            orderId: order.orderId,
            reason,
            evidenceImages: normalizeComplaintImages(),
        });
        setComplaintSubmitting(false);

        if (!res.success) {
            appToast.error('Gửi khiếu nại thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        setComplaintOpen(false);
        setComplaintReason('');
        setComplaintEvidenceImages(['']);
        appToast.success('Đã gửi khiếu nại');
    };

    if (loading) {
        return (<div className="order-detail-page"><div className="order-detail-skeleton" /><div className="order-detail-skeleton" /></div>);
    }

    if (!order) {
        return (<div className="order-detail-page"><div className="order-detail-empty"><h3>Không tìm thấy đơn hàng</h3><button type="button" className="btn btn-outline" onClick={() => navigate('/orders')}>Quay lại đơn hàng</button></div></div>);
    }

    const status = String(order.status || '').toUpperCase();
    const statusMeta = STATUS_META[status] || { label: status || 'Không xác định', className: '' };

    return (
        <div className="order-detail-page">
            <button type="button" className="order-back" onClick={() => navigate('/orders')}>← Quay lại đơn hàng</button>

            <header className="order-detail-header">
                <div>
                    <h1>#{String(order.orderId || '').replace(/\s+/g, '')}</h1>
                    <span className={`orders-v2-status ${statusMeta.className}`}>{statusMeta.label}</span>
                </div>
                {status === 'PENDING' && (
                    <button type="button" className="btn btn-outline" onClick={handleCancelOrder} disabled={cancelling}>{cancelling ? 'Đang huỷ...' : 'Huỷ đơn'}</button>
                )}
            </header>

            <div className="order-detail-grid">
                <section className="order-detail-main">
                    <article className="card-block">
                        <h2>Sản phẩm đặt mua</h2>
                        <div className="order-items-table">
                            {allItems.map((item, index) => (
                                <div key={`${item.id || index}`} className="order-row">
                                    <img src={getItemImage(item)} alt={item.productName || item.templateName || 'Sản phẩm'} />
                                    <div>
                                        <h4>{item.productName || item.templateName || 'Sản phẩm tuỳ chỉnh'}</h4>
                                        {item.customizations && typeof item.customizations === 'object' && (
                                            <div className="orders-v2-customize">
                                                {Object.entries(item.customizations).map(([key, value]) => (<span key={key}>{key}: {String(value)}</span>))}
                                            </div>
                                        )}
                                        <p>x{item.quantity || item.qty || 1} · Đơn giá: {formatCurrency(item.unitPrice)}</p>
                                    </div>
                                    <strong>{formatCurrency(item.subTotal)}</strong>
                                </div>
                            ))}
                        </div>
                        <div className="totals">
                            <p>Tạm tính <span>{formatCurrency(subTotal)}</span></p>
                            <p>Phí vận chuyển <span>{formatCurrency(shipment?.shippingFee || 0)}</span></p>
                            <p className="total">Tổng cộng <span>{formatCurrency(order.total)}</span></p>
                        </div>
                    </article>

                    <article className="card-block">
                        <h2>Thông tin giao hàng</h2>
                        <p><strong>Người nhận:</strong> {order.fullName || '—'}</p>
                        <p><strong>Số điện thoại:</strong> {order.phoneNumber || '—'}</p>
                        <p><strong>Địa chỉ:</strong> {order.shippingAddress || '—'}</p>
                        <p><strong>Ghi chú:</strong> {order.notes || '—'}</p>
                    </article>

                    <article className="card-block">
                        <h2>Thông tin thanh toán</h2>
                        {latestPayment ? (
                            <>
                                <p><strong>Phương thức:</strong> {latestPayment.paymentMethod || order.paymentMethod || '—'}</p>
                                <p><strong>Mã giao dịch:</strong> <code>{latestPayment.transactionId || '—'}</code></p>
                                <p><strong>Thời gian:</strong> {formatDateTime(latestPayment.paidAt || latestPayment.createdAt)}</p>
                                <span className={`orders-v2-status ${String(latestPayment.status || '').toUpperCase() === 'SUCCESS' ? 'badge-delivered' : 'badge-pending'}`}>{latestPayment.status || 'PENDING'}</span>
                            </>
                        ) : (<p>Chưa có dữ liệu thanh toán.</p>)}
                    </article>
                </section>

                <aside className="order-detail-side" id="tracking">
                    <article className="card-block">
                        <h2>Theo dõi vận chuyển</h2>
                        {shipment?.trackingNumber ? (
                            <>
                                <p>Mã vận đơn: <code>{shipment.trackingNumber}</code></p>
                                <div className="order-timeline-steps">
                                    {trackingSteps.map((step) => (
                                        <div key={step.key} className={`timeline-step ${step.state === 'done' ? 'completed' : step.state === 'active' ? 'active' : ''}`}>
                                            <span className="timeline-dot" />
                                            <div className="timeline-content">
                                                <h4>{step.label}</h4>
                                                {step.description ? <p>{step.description}</p> : null}
                                                <p>{formatDateTime(step.timestamp || step.time)}</p>
                                                {step.location ? <p>{step.location}</p> : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (<p>Đơn hàng đang được chuẩn bị</p>)}
                    </article>

                    <article className="card-block">
                        <h2>Hỗ trợ</h2>
                        <button type="button" className="btn btn-outline btn-full" onClick={() => appToast.info('Sắp ra mắt', 'Chức năng liên hệ nghệ nhân đang được phát triển.') }>
                            Liên hệ nghệ nhân
                        </button>
                        <button type="button" className="btn btn-outline btn-full" onClick={() => navigate('/complaint-history')}>
                            Xem lịch sử khiếu nại
                        </button>
                        <button type="button" className="btn btn-outline btn-full" onClick={() => setComplaintOpen(true)}>
                            Gửi khiếu nại
                        </button>
                        {status === 'DELIVERED' && latestPayment?.paymentId && (
                            <button type="button" className="btn btn-full" onClick={handleRefundRequest} disabled={refunding}>
                                {refunding ? 'Đang gửi...' : 'Yêu cầu hoàn tiền'}
                            </button>
                        )}
                    </article>
                </aside>
            </div>

            {complaintOpen && (
                <div className="complaint-modal-backdrop" onClick={() => setComplaintOpen(false)} role="presentation">
                    <div className="complaint-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="complaint-modal-title">
                        <div className="complaint-modal-hero">
                            <div className="complaint-modal-hero-badge">Complaint Center</div>
                            <h2 id="complaint-modal-title">Gửi khiếu nại</h2>
                            <p>Nhập lý do, bổ sung ảnh bằng chứng và gửi đến hệ thống để tiếp nhận xử lý.</p>
                        </div>

                        <button type="button" className="complaint-modal-close" onClick={() => setComplaintOpen(false)} aria-label="Đóng">
                            ×
                        </button>

                        <div className="complaint-modal-body">
                            <label className="complaint-field complaint-reason-field">
                                <span>Lý do khiếu nại</span>
                                <textarea
                                    value={complaintReason}
                                    onChange={(e) => setComplaintReason(e.target.value)}
                                    placeholder="Mô tả vấn đề bạn gặp phải, tối thiểu 20 ký tự"
                                    rows="5"
                                />
                            </label>

                            <section className="complaint-evidence-section">
                                <div className="complaint-evidence-head">
                                    <div>
                                        <span className="complaint-section-label">Ảnh bằng chứng</span>
                                        <p>Upload tối đa 5 ảnh bằng Supabase hoặc dán URL ảnh có sẵn.</p>
                                    </div>
                                    <button type="button" className="btn btn-outline btn-sm" onClick={addComplaintImageField} disabled={complaintEvidenceImages.length >= 5}>
                                        + Thêm ảnh
                                    </button>
                                </div>

                                <div className="complaint-evidence-list">
                                    {complaintEvidenceImages.map((url, index) => (
                                        <div key={`complaint-image-${index}`} className="complaint-evidence-item">
                                            <div className="complaint-evidence-item-head">
                                                <strong>Ảnh bằng chứng {index + 1}</strong>
                                                {complaintEvidenceImages.length > 1 && (
                                                    <button type="button" className="complaint-remove-btn" onClick={() => removeComplaintImageField(index)}>
                                                        Xoá
                                                    </button>
                                                )}
                                            </div>

                                            <ImageUpload
                                                value={url}
                                                onChange={(nextValue) => setComplaintEvidenceImages((prev) => prev.map((item, idx) => (idx === index ? nextValue : item)))}
                                                label=""
                                                helperText="Tải ảnh lên Supabase hoặc dán URL ảnh đã có"
                                                folder="complaints"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="complaint-modal-footer">
                            <button type="button" className="btn btn-outline" onClick={() => setComplaintOpen(false)} disabled={complaintSubmitting}>
                                Huỷ
                            </button>
                            <button type="button" className="btn btn-primary" onClick={submitComplaint} disabled={complaintSubmitting}>
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

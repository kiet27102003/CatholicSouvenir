import React, { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiCalendar, FiCreditCard, FiHash, FiPackage, FiShoppingBag, FiStar, FiTruck, FiUser } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { createFeedback, getOrderById } from '../../services/orderService';
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
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [complaintConfirmOpen, setComplaintConfirmOpen] = useState(false);

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
    const feedbackTarget = useMemo(() => {
        const customOrderItem = templateDetails[0] || orderDetails[0] || null;
        return {
            orderId: order?.orderId || order?.id || '',
            customOrderId:
                customOrderItem?.customOrderId ||
                customOrderItem?.orderDetailId ||
                customOrderItem?.id ||
                order?.customOrderId ||
                order?.orderDetails?.[0]?.customOrderId ||
                '',
        };
    }, [order?.customOrderId, order?.id, order?.orderDetails, order?.orderId, orderDetails, templateDetails]);

    const canSubmitFeedback = Boolean(feedbackTarget.orderId && feedbackTarget.customOrderId);

    if (loading) {
        return (
            <div className="order-detail-page">
                <div className="detail-skeleton header" />
                <div className="detail-skeleton content" />
            </div>
        );
    }

    const openFeedbackModal = () => {
        if (!canSubmitFeedback) {
            appToast.warning('Thiếu thông tin đánh giá', 'Không xác định được đơn custom để gửi đánh giá');
            return;
        }
        setFeedbackModalOpen(true);
    };

    const closeFeedbackModal = () => {
        if (feedbackSubmitting) return;
        setFeedbackModalOpen(false);
    };

    const handleSubmitFeedback = async () => {
        if (!canSubmitFeedback) {
            appToast.error('Không thể gửi đánh giá', 'Thiếu thông tin đơn hàng');
            return;
        }

        setFeedbackSubmitting(true);
        const res = await createFeedback({
            orderId: feedbackTarget.orderId,
            customOrderId: feedbackTarget.customOrderId,
            rating: feedbackRating,
            comment: feedbackComment,
        });
        setFeedbackSubmitting(false);

        if (!res.success) {
            appToast.error('Gửi đánh giá thất bại', res.error || 'Vui lòng thử lại sau');
            return;
        }

        setFeedbackModalOpen(false);
        appToast.success('Đánh giá thành công');
        if (Number(feedbackRating) === 1) {
            setComplaintConfirmOpen(true);
        }
    };

    const handleOpenComplaint = () => {
        setComplaintConfirmOpen(false);
        navigate('/complaints');
    };

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
                                <div className="panel-head-actions">
                                    <span>{items.length} mục</span>
                                    <button type="button" className="btn btn-outline btn-feedback" onClick={openFeedbackModal} disabled={!canSubmitFeedback}>
                                        <FiStar /> Đánh giá sản phẩm
                                    </button>
                                </div>
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

            {feedbackModalOpen && (
                <div className="modal-backdrop" onClick={closeFeedbackModal} role="presentation">
                    <div className="feedback-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title">
                        <h2 id="feedback-modal-title">Đánh giá sản phẩm</h2>
                        <p>Hãy chọn số sao và để lại nhận xét cho đơn hàng của bạn.</p>

                        <div className="rating-row" role="radiogroup" aria-label="Đánh giá sao">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`rating-star ${Number(feedbackRating) >= star ? 'active' : ''}`}
                                    onClick={() => setFeedbackRating(star)}
                                    aria-label={`${star} sao`}
                                >
                                    <FiStar />
                                </button>
                            ))}
                        </div>

                        <textarea
                            className="feedback-textarea"
                            placeholder="Chia sẻ cảm nhận của bạn..."
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            rows={4}
                        />

                        <div className="modal-actions">
                            <button type="button" className="btn btn-outline" onClick={closeFeedbackModal} disabled={feedbackSubmitting}>
                                Đóng
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleSubmitFeedback} disabled={feedbackSubmitting}>
                                {feedbackSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {complaintConfirmOpen && (
                <div className="modal-backdrop" onClick={() => setComplaintConfirmOpen(false)} role="presentation">
                    <div className="feedback-modal feedback-confirm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="complaint-confirm-title">
                        <h2 id="complaint-confirm-title">Bạn muốn khiếu nại đơn hàng không?</h2>
                        <p>Bạn vừa đánh giá 1 sao. Nếu muốn tạo khiếu nại, hệ thống sẽ đưa bạn đến trung tâm khiếu nại.</p>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setComplaintConfirmOpen(false)}>
                                Không
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleOpenComplaint}>
                                Có, khiếu nại
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default OrderDetailPage;

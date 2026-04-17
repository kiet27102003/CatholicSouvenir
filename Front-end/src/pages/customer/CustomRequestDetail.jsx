import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiCheckCircle, FiCreditCard, FiLoader, FiPackage, FiRefreshCw, FiUser } from 'react-icons/fi';
import { appToast } from '../../lib/appToast';
import { getCustomerCustomOrders, initiateStagePayment } from '../../services/customRequestService';
import './CustomRequestDetailPage.css';

const moneyFormatter = new Intl.NumberFormat('vi-VN');

const formatMoney = (value) => `${moneyFormatter.format(Number(value || 0))} đ`;

const formatDateTime = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
};

const getOrderStatusMeta = (status) => {
    switch (String(status || '').toUpperCase()) {
        case 'PENDING_PAYMENT':
            return { label: 'Chờ thanh toán', className: 'status-pending-payment', tone: 'warning' };
        case 'IN_PROGRESS':
            return { label: 'Đang thực hiện', className: 'status-in-progress', tone: 'info' };
        case 'COMPLETED':
            return { label: 'Hoàn thành', className: 'status-completed', tone: 'success' };
        case 'CANCELLED':
            return { label: 'Đã huỷ', className: 'status-cancelled', tone: 'danger' };
        case 'WAITING_ARTISAN':
            return { label: 'Chờ nghệ nhân', className: 'status-waiting', tone: 'neutral' };
        default:
            return { label: status || 'Không xác định', className: 'status-default', tone: 'neutral' };
    }
};

const getStageStatusMeta = (stage) => {
    if (stage?.isCompleted) return { label: 'Hoàn thành', className: 'stage-completed' };
    if (stage?.isPaid) return { label: 'Đã thanh toán', className: 'stage-paid' };
    if (stage?.canPay) return { label: 'Có thể thanh toán', className: 'stage-payable' };
    return { label: String(stage?.status || 'Chờ xử lý').toUpperCase(), className: 'stage-pending' };
};

const getStageProgress = (stages = []) => {
    if (!stages.length) return 0;
    const done = stages.filter((stage) => stage?.isCompleted || stage?.isPaid).length;
    return Math.round((done / stages.length) * 100);
};

const getCurrentStageIndex = (stages = []) => stages.findIndex((stage) => !stage?.isCompleted && !stage?.isPaid) + 1;

const CustomRequestDetail = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [status, setStatus] = useState('ALL');

    const pageSize = 10;

    const loadOrders = async ({ nextPage = page, nextStatus = status, append = false } = {}) => {
        const isInitial = !append && nextPage === 0;
        if (isInitial) setLoading(true); else setRefreshing(true);

        const res = await getCustomerCustomOrders({
            status: nextStatus === 'ALL' ? '' : nextStatus,
            page: nextPage,
            size: pageSize,
        });

        if (!res.success) {
            setLoading(false);
            setRefreshing(false);
            appToast.error('Không tải được tiến độ', res.error || 'Vui lòng thử lại');
            return;
        }

        const payload = res.data || {};
        const content = Array.isArray(payload.content) ? payload.content : [];
        setOrders(append ? [...orders, ...content] : content);
        setPage(Number(payload.number ?? nextPage));
        setTotalPages(Number(payload.totalPages ?? 0));
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        loadOrders({ nextPage: 0, nextStatus: status, append: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const activeOrders = useMemo(() => orders, [orders]);

    const handleRefresh = async () => {
        await loadOrders({ nextPage: 0, nextStatus: status, append: false });
    };

    const handleLoadMore = async () => {
        if (refreshing || loading || page + 1 >= totalPages) return;
        await loadOrders({ nextPage: page + 1, nextStatus: status, append: true });
    };

    const handlePayStage = async (stageId) => {
        if (!stageId) return;

        const res = await initiateStagePayment(stageId, {
            paymentMethod: 'VNPAY',
            returnUrl: `${window.location.origin}/payment/success`,
            cancelUrl: `${window.location.origin}/payment/failed`,
        });

        if (!res.success) {
            appToast.error('Không khởi tạo được thanh toán', res.error || 'Vui lòng thử lại');
            return;
        }

        const paymentUrl = res.data?.paymentUrl || res.data?.url;
        if (!paymentUrl) {
            appToast.error('Thiếu link thanh toán', 'Vui lòng thử lại sau');
            return;
        }

        window.location.href = paymentUrl;
    };

    return (
        <div className="custom-request-detail-shell custom-order-progress-shell">
            <div className="custom-request-detail-container custom-order-progress-container">
                <div className="custom-order-progress-hero">
                    <div>
                        <p className="custom-order-progress-eyebrow">Theo dõi tiến độ đơn đặt riêng</p>
                        <h1 className="custom-order-progress-title">Tiến độ yêu cầu đặt riêng của bạn</h1>
                        <p className="custom-order-progress-subtitle">
                            Xem trạng thái từng giai đoạn, khoản thanh toán và mức độ hoàn thành của mỗi custom order.
                        </p>
                    </div>

                    <div className="custom-order-progress-actions">
                        <button type="button" onClick={handleRefresh} className="custom-order-outline-button" disabled={refreshing || loading}>
                            {refreshing ? <FiLoader className="spin" /> : <FiRefreshCw />}
                            Làm mới
                        </button>
                        <button type="button" onClick={() => navigate('/custom-requests')} className="custom-order-primary-button">
                            Quay lại yêu cầu
                        </button>
                    </div>
                </div>

                <div className="custom-order-filter-bar">
                    {['ALL', 'PENDING_PAYMENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((item) => (
                        <button
                            key={item}
                            type="button"
                            className={`custom-order-filter-chip ${status === item ? 'active' : ''}`}
                            onClick={() => setStatus(item)}
                        >
                            {getOrderStatusMeta(item).label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="custom-order-loading-grid">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="custom-order-card custom-order-skeleton">
                                <div className="custom-order-skeleton-line w-1/2" />
                                <div className="custom-order-skeleton-line w-1/3" />
                                <div className="custom-order-skeleton-block" />
                            </div>
                        ))}
                    </div>
                ) : activeOrders.length === 0 ? (
                    <div className="custom-order-empty-state">
                        <FiPackage size={28} />
                        <h2>Chưa có custom order nào</h2>
                        <p>Hãy tạo một yêu cầu đặt riêng để bắt đầu theo dõi tiến độ tại đây.</p>
                        <button type="button" className="custom-order-primary-button" onClick={() => navigate('/custom-requests/new')}>
                            Tạo yêu cầu mới
                        </button>
                    </div>
                ) : (
                    <div className="custom-order-progress-list">
                        {activeOrders.map((order) => {
                            const stages = Array.isArray(order?.stages) ? order.stages : [];
                            const statusMeta = getOrderStatusMeta(order?.status);
                            const progress = getStageProgress(stages);
                            const currentStage = getCurrentStageIndex(stages);
                            const completedStages = stages.filter((stage) => stage?.isCompleted || stage?.isPaid).length;
                            const firstPayableStage = stages.find((stage) => stage?.canPay);

                            return (
                                <article key={order?.customOrderId || order?.orderId} className="custom-order-card custom-order-progress-card">
                                    <div className="custom-order-card-header">
                                        <div>
                                            <div className={`custom-order-status-pill ${statusMeta.className}`}>{statusMeta.label}</div>
                                            <h2 className="custom-order-card-title">{order?.requestId ? `Yêu cầu #${String(order.requestId).slice(0, 8)}` : 'Custom order'}</h2>
                                            <p className="custom-order-card-description">
                                                Nghệ nhân {order?.artisanName || 'đang cập nhật'} đang thực hiện đơn cho {order?.customerName || 'bạn'}.
                                            </p>
                                        </div>
                                        <div className="custom-order-price-box">
                                            <span>Tổng giá</span>
                                            <strong>{formatMoney(order?.totalPrice)}</strong>
                                        </div>
                                    </div>

                                    <div className="custom-order-meta-grid">
                                        <div className="custom-order-meta-item">
                                            <FiUser />
                                            <div>
                                                <span>Khách hàng</span>
                                                <strong>{order?.customerName || '—'}</strong>
                                            </div>
                                        </div>
                                        <div className="custom-order-meta-item">
                                            <FiPackage />
                                            <div>
                                                <span>Nghệ nhân</span>
                                                <strong>{order?.artisanName || '—'}</strong>
                                            </div>
                                        </div>
                                        <div className="custom-order-meta-item">
                                            <FiCalendar />
                                            <div>
                                                <span>Cập nhật lúc</span>
                                                <strong>{formatDateTime(order?.updatedAt || order?.createdAt)}</strong>
                                            </div>
                                        </div>
                                        <div className="custom-order-meta-item">
                                            <FiCreditCard />
                                            <div>
                                                <span>Đã hoàn thành</span>
                                                <strong>{completedStages}/{stages.length || 0} giai đoạn</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="custom-order-progress-summary">
                                        <div className="custom-order-progress-row">
                                            <span>Tiến độ tổng</span>
                                            <strong>{progress}%</strong>
                                        </div>
                                        <div className="custom-order-progress-track">
                                            <div className="custom-order-progress-fill" style={{ width: `${progress}%` }} />
                                        </div>
                                        <div className="custom-order-progress-footnote">
                                            <span>Giai đoạn hiện tại: {currentStage > 0 ? currentStage : 'Đã hoàn tất'}</span>
                                            <span>{firstPayableStage ? 'Có stage có thể thanh toán' : 'Chưa có stage thanh toán'}</span>
                                        </div>
                                    </div>

                                    <div className="custom-order-stage-list">
                                        {stages.map((stage, index) => {
                                            const stageMeta = getStageStatusMeta(stage);
                                            return (
                                                <div key={stage?.stageId || stage?.id || `${order?.customOrderId}-${index}`} className="custom-order-stage-item">
                                                    <div className="custom-order-stage-index">{index + 1}</div>
                                                    <div className="custom-order-stage-content">
                                                        <div className="custom-order-stage-head">
                                                            <div>
                                                                <h3>{stage?.stageName || `Giai đoạn ${index + 1}`}</h3>
                                                            </div>
                                                            <span className={`custom-order-stage-pill ${stageMeta.className}`}>{stageMeta.label}</span>
                                                        </div>
                                                        <div className="custom-order-stage-footer">
                                                            <span className="custom-order-stage-amount">{formatMoney(stage?.amount)}</span>
                                                            <span className="custom-order-stage-percentage">{Number(stage?.percentage || 0)}%</span>
                                                            {stage?.canPay ? (
                                                                <button type="button" className="custom-order-pay-button" onClick={() => handlePayStage(stage?.stageId || stage?.id)}>
                                                                    Thanh toán
                                                                </button>
                                                            ) : null}
                                                            {stage?.completionImageUrl ? (
                                                                <a href={stage.completionImageUrl} target="_blank" rel="noreferrer" className="custom-order-link">Xem ảnh bàn giao</a>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="custom-order-card-footer">
                                        <span className="custom-order-id">Mã đơn: {order?.customOrderId || '—'}</span>
                                        {order?.completed ? <span className="custom-order-complete-chip"><FiCheckCircle /> Đã hoàn thành</span> : null}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {!loading && totalPages > 1 && page + 1 < totalPages ? (
                    <div className="custom-order-load-more-wrap">
                        <button type="button" className="custom-order-outline-button" onClick={handleLoadMore} disabled={refreshing}>
                            {refreshing ? <FiLoader className="spin" /> : <FiArrowRight />}
                            Xem thêm
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default CustomRequestDetail;

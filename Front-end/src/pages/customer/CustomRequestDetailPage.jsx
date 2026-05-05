import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FiArrowLeft,
    FiCalendar,
    FiClock,
    FiFileText,
    FiImage,
    FiMessageSquare,
    FiPackage,
    FiRefreshCw,
    FiShield,
    FiStar,
    FiUser,
} from 'react-icons/fi';
import { appToast } from '../../lib/appToast';
import { getConversationsByRequest, startConversation } from '../../services/chatService';
import {
    cancelCustomOrder,
    confirmCustomOrder,
    getCustomOrderByRequest,
    getCustomOrderRefundEstimate,
    getCustomOrderStages,
    getCustomRequestDetail,
    getCustomerCustomOrders,
    getStageCanPay,
    initiateStagePayment,
    publishCustomRequest,
    regenerateCustomRequestImage,
    selectCustomRequestArtisan,
} from '../../services/customRequestService';
import './CustomRequestDetailPage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const formatDate = (value) => {
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

const truncate = (value, length) => {
    const text = String(value || '').trim();
    if (!text) return 'Yêu cầu custom';
    return text.length > length ? `${text.slice(0, length)}...` : text;
};

const getStatusMeta = (status) => {
    const s = String(status || '').toUpperCase();
    return ({
        DRAFT: { label: 'Bản nháp', className: 'status-draft', icon: FiFileText },
        OPEN: { label: 'Đang mở', className: 'status-open', icon: FiClock },
        PUBLISHED: { label: 'Đang mở', className: 'status-open', icon: FiClock },
        ARTISAN_SELECTED: { label: 'Đã chọn artisan', className: 'status-selected', icon: FiStar },
        PENDING_CONFIRMATION: { label: 'Chờ xác nhận', className: 'status-pending', icon: FiClock },
        PENDING_PAYMENT: { label: 'Chờ thanh toán', className: 'status-pending', icon: FiClock },
        IN_PROGRESS: { label: 'Đang thực hiện', className: 'status-in-progress', icon: FiShield },
        COMPLETED: { label: 'Hoàn thành', className: 'status-completed', icon: FiPackage },
        CANCELLED: { label: 'Đã huỷ', className: 'status-cancelled', icon: FiFileText },
    }[s]) || { label: status || 'Không xác định', className: 'status-open', icon: FiClock };
};

const getStageStatusMeta = (status) => {
    const s = String(status || '').toUpperCase();
    return ({
        PAID: { label: 'Đã thanh toán', className: 'stage-paid' },
        COMPLETED: { label: 'Hoàn thành', className: 'stage-completed' },
        PENDING: { label: 'Chờ thanh toán', className: 'stage-pending' },
    }[s]) || { label: 'Chờ thanh toán', className: 'stage-pending' };
};

const getStageId = (stage) => stage?.stageId ?? stage?.id;

const StatCard = ({ label, value, subtext }) => (
    <div className="detail-stat-card">
        <div>
            <span>{label}</span>
            <strong>{value}</strong>
            {subtext ? <p>{subtext}</p> : null}
        </div>
    </div>
);

const CustomRequestDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [stagesLoading, setStagesLoading] = useState(false);
    const [stages, setStages] = useState([]);
    const [interestedArtisans, setInterestedArtisans] = useState([]);
    const [startingConversationId, setStartingConversationId] = useState('');
    const [payingStageId, setPayingStageId] = useState('');
    const [regenerating, setRegenerating] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [selectingArtisanId, setSelectingArtisanId] = useState('');
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [pendingArtisan, setPendingArtisan] = useState(null);
    const [confirmingOrder, setConfirmingOrder] = useState(false);
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelEstimate, setCancelEstimate] = useState(null);
    const [cancelEstimateLoading, setCancelEstimateLoading] = useState(false);
    const [orderLookupLoading, setOrderLookupLoading] = useState(false);

    const requestStatus = String(request?.status || '').toUpperCase();
    const statusMeta = getStatusMeta(requestStatus);
    const StatusIcon = statusMeta.icon;
    const aiImageUrl = request?.aiGeneratedImageUrl || request?.aiImageUrl || request?.generatedImageUrl || '';
    const artisan = request?.artisan || request?.confirmedArtisan || request?.selectedArtisan || null;
    const totalPrice = Number(request?.totalPrice || stages.reduce((sum, stage) => sum + Number(stage?.amount || 0), 0));
    const paidAmount = useMemo(() => stages
        .filter((stage) => ['PAID', 'COMPLETED'].includes(String(stage?.status || '').toUpperCase()))
        .reduce((sum, stage) => sum + Number(stage?.amount || 0), 0), [stages]);
    const remainingAmount = Math.max(0, totalPrice - paidAmount);
    const paidPercent = totalPrice > 0 ? Math.min(100, Math.round((paidAmount / totalPrice) * 100)) : 0;
    const cancelTotalRefund = Number(cancelEstimate?.grossRefundAmount ?? stages
        .filter((stage) => ['PAID', 'COMPLETED'].includes(String(stage?.status || '').toUpperCase()))
        .reduce((sum, stage) => sum + Number(stage?.amount || 0), 0));
    const cancelPlatformFee = Number(cancelEstimate?.platformCommissionAmount ?? cancelEstimate?.platformCommission ?? Math.round(cancelTotalRefund * 0.05));
    const cancelNetRefund = Number(cancelEstimate?.netRefundAmount ?? Math.max(0, cancelTotalRefund - cancelPlatformFee));
    const selectedArtisanId = String(request?.selectedArtisanId || artisan?.artisanId || artisan?.id || '');
    const selectedArtisanName = request?.selectedArtisanName || request?.artisanName || artisan?.artisanName || artisan?.name || '';
    const hasStages = stages.length > 0;
    const customOrderId = request?.customOrderId || request?.orderId || request?.customOrder?.orderId || null;

    const displayInterestedArtisans = useMemo(() => {
        const list = Array.isArray(interestedArtisans) ? [...interestedArtisans] : [];
        const shouldShowSelectedArtisan = ['ARTISAN_SELECTED', 'PENDING_CONFIRMATION', 'PENDING_PAYMENT', 'IN_PROGRESS'].includes(requestStatus)
            && selectedArtisanId;

        if (shouldShowSelectedArtisan) {
            const exists = list.some((item) => String(item?.artisanId || item?.artisan?.id || '') === selectedArtisanId);
            if (!exists) {
                list.unshift({
                    artisanId: selectedArtisanId,
                    artisanName: selectedArtisanName || 'Nghệ nhân đã chọn',
                    artisanEmail: artisan?.artisanEmail || artisan?.email || request?.artisanEmail || '',
                    isSelectedArtisan: true,
                });
            }
        }

        return list;
    }, [artisan, interestedArtisans, request?.artisanEmail, requestStatus, selectedArtisanId, selectedArtisanName]);

    const refreshInterestedArtisans = async () => {
        const res = await getConversationsByRequest(id);
        if (res.success) setInterestedArtisans(Array.isArray(res.data) ? res.data : []);
    };

    const loadOrderStages = async (requestId) => {
        if (!requestId) {
            setStages([]);
            return;
        }

        setStagesLoading(true);
        const [pendingConfirmationRes, pendingRes, inProgressRes, completedRes] = await Promise.all([
            getCustomerCustomOrders({ status: 'PENDING_CONFIRMATION', page: 0, size: 10 }),
            getCustomerCustomOrders({ status: 'PENDING_PAYMENT', page: 0, size: 10 }),
            getCustomerCustomOrders({ status: 'IN_PROGRESS', page: 0, size: 10 }),
            getCustomerCustomOrders({ status: 'COMPLETED', page: 0, size: 10 }),
        ]);

        const pendingConfirmationOrders = pendingConfirmationRes.success ? (pendingConfirmationRes.data?.content || []) : [];
        const pendingOrders = pendingRes.success ? (pendingRes.data?.content || []) : [];
        const inProgressOrders = inProgressRes.success ? (inProgressRes.data?.content || []) : [];
        const completedOrders = completedRes.success ? (completedRes.data?.content || []) : [];
        const allOrders = [...pendingConfirmationOrders, ...pendingOrders, ...inProgressOrders, ...completedOrders];
        const matchedOrders = allOrders.filter((order) => String(order?.requestId || '') === String(requestId));

        const scoreOrder = (order) => {
            const stagesList = Array.isArray(order?.stages) ? order.stages : [];
            const completedCount = stagesList.filter((stage) => String(stage?.status || '').toUpperCase() === 'COMPLETED').length;
            const paidCount = stagesList.filter((stage) => String(stage?.status || '').toUpperCase() === 'PAID').length;
            return (stagesList.length * 10) + completedCount + paidCount + (String(order?.status || '').toUpperCase() === 'IN_PROGRESS' ? 5 : 0);
        };

        const bestOrder = matchedOrders.sort((a, b) => scoreOrder(b) - scoreOrder(a))[0] || null;
        const orderStages = Array.isArray(bestOrder?.stages) ? bestOrder.stages : [];

        setStages(orderStages);
        setRequest((prev) => ({
            ...(prev || {}),
            customOrderId: bestOrder?.customOrderId || bestOrder?.orderId || prev?.customOrderId || null,
        }));
        setStagesLoading(false);
    };

    const fetchOrderByRequest = async (requestId) => {
        if (!requestId) return null;

        setOrderLookupLoading(true);
        const res = await getCustomOrderByRequest(requestId);
        setOrderLookupLoading(false);

        if (!res.success) {
            return null;
        }

        const order = res.data || null;
        const orderId = order?.customOrderId || order?.orderId || null;

        if (order) {
            setRequest((prev) => ({
                ...(prev || {}),
                ...order,
                customOrderId: orderId,
            }));
            if (Array.isArray(order?.stages)) {
                setStages(order.stages);
            }
        }

        return order;
    };

    const refreshDetail = async () => {
        const detailRes = await getCustomRequestDetail(id);
        if (detailRes.success) setRequest(detailRes.data || null);
    };

    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            const detailRes = await getCustomRequestDetail(id);
            if (cancelled) return;

            if (!detailRes.success) {
                setLoading(false);
                appToast.error('Không tải được chi tiết', detailRes.error || 'Vui lòng thử lại');
                return;
            }

            setRequest(detailRes.data || null);
            setLoading(false);

            if (detailRes.data?.requestId || id) {
                await refreshInterestedArtisans();
            } else {
                setInterestedArtisans([]);
            }

            const nextOrder = await fetchOrderByRequest(detailRes.data?.requestId || id);
            const nextOrderId = nextOrder?.customOrderId ?? nextOrder?.orderId ?? detailRes.data?.customOrderId ?? detailRes.data?.orderId ?? detailRes.data?.customOrder?.orderId;

            if (nextOrderId) {
                setStagesLoading(true);
                const stagesRes = await getCustomOrderStages(nextOrderId);
                if (cancelled) return;
                setStagesLoading(false);

                if (stagesRes.success) {
                    setStages(Array.isArray(stagesRes.data) ? stagesRes.data : []);
                } else if (!nextOrder?.stages?.length) {
                    setStages([]);
                    await loadOrderStages(detailRes.data?.requestId || id);
                }
            } else if (['ARTISAN_SELECTED', 'PENDING_CONFIRMATION', 'PENDING_PAYMENT', 'IN_PROGRESS'].includes(String(detailRes.data?.status || '').toUpperCase())) {
                await loadOrderStages(detailRes.data?.requestId || id);
            } else {
                setStages([]);
            }
        };

        fetchData();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleRegenerateAi = async () => {
        if (!id || regenerating) return;
        setRegenerating(true);
        const res = await regenerateCustomRequestImage(id);
        setRegenerating(false);

        if (!res.success) {
            appToast.error('Tạo lại ảnh thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        const url = typeof res.data === 'string' ? res.data : '';
        if (url) setRequest((prev) => ({ ...prev, aiGeneratedImageUrl: url }));
        else await refreshDetail();
        appToast.success('Đã tạo lại ảnh AI');
    };

    const handlePublish = async () => {
        if (!id || publishing) return;
        setPublishing(true);
        const res = await publishCustomRequest(id);
        setPublishing(false);

        if (!res.success) {
            appToast.error('Publish thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Yêu cầu đã được publish');
        await refreshDetail();
        await refreshInterestedArtisans();
    };

    const handleStartConversation = async () => {
        if (!id || startingConversationId) return;
        setStartingConversationId(String(id));
        const res = await startConversation(id);
        setStartingConversationId('');

        if (!res.success) {
            appToast.error('Không thể bắt đầu trò chuyện', res.error || 'Vui lòng thử lại');
            return;
        }

        const conversationId = res.data?.conversationId || res.data?.id;
        appToast.success('Đã tạo cuộc trò chuyện');
        navigate(conversationId ? `/messages?conversationId=${conversationId}` : '/messages');
    };

    const handleViewConversation = () => {
        if (!id) return;
        navigate('/messages');
    };

    const handleSelectArtisanRequest = (artisanId, artisanName) => {
        if (!artisanId || selectingArtisanId) return;
        setPendingArtisan({ artisanId, artisanName });
        setConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        if (selectingArtisanId) return;
        setConfirmModalOpen(false);
        setPendingArtisan(null);
    };

    const confirmSelectArtisan = async () => {
        if (!id || !pendingArtisan?.artisanId || selectingArtisanId) return;

        setSelectingArtisanId(String(pendingArtisan.artisanId));
        const res = await selectCustomRequestArtisan(id, pendingArtisan.artisanId);
        setSelectingArtisanId('');

        if (!res.success) {
            appToast.error('Chọn nghệ nhân thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Đã chọn nghệ nhân');
        setConfirmModalOpen(false);
        setPendingArtisan(null);
        await refreshDetail();
        await refreshInterestedArtisans();
    };

    const handleConfirmOrder = async () => {
        const customOrderId = request?.customOrderId || request?.orderId || request?.customOrder?.orderId;
        if (!customOrderId || confirmingOrder) return;

        setConfirmingOrder(true);
        const res = await confirmCustomOrder(customOrderId);
        setConfirmingOrder(false);

        if (!res.success) {
            appToast.error('Không thể xác nhận đơn', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Xác nhận đơn hàng thành công. Bạn có thể bắt đầu thanh toán giai đoạn đầu tiên.');
        await refreshDetail();
        await loadOrderStages(request?.requestId || id);
    };

    const openCancelModal = async () => {
        const customOrderId = request?.customOrderId || request?.orderId || request?.customOrder?.orderId;
        if (!customOrderId || cancellingOrder || confirmingOrder || orderLookupLoading) return;

        setCancelModalOpen(true);
        setCancelReason('');
        setCancelEstimate(null);
        setCancelEstimateLoading(true);

        const res = await getCustomOrderRefundEstimate(customOrderId);
        setCancelEstimateLoading(false);

        if (!res.success) {
            setCancelEstimate(null);
            appToast.error('Không thể ước tính hoàn tiền', res.error || 'Vui lòng thử lại');
            return;
        }

        setCancelEstimate(res.data || null);
    };

    const closeCancelModal = () => {
        if (cancellingOrder) return;
        setCancelModalOpen(false);
        setCancelReason('');
        setCancelEstimate(null);
        setCancelEstimateLoading(false);
    };

    const handleCancelOrder = async () => {
        const customOrderId = request?.customOrderId || request?.orderId || request?.customOrder?.orderId;
        const reason = cancelReason.trim();

        if (!customOrderId || cancellingOrder) return;
        if (!reason) {
            appToast.warning('Vui lòng nhập lý do hủy đơn');
            return;
        }
        if (reason.length < 20) {
            appToast.warning('Lý do hủy phải có ít nhất 20 ký tự');
            return;
        }
        if (cancelEstimate?.canCancel === false) {
            appToast.warning('Đơn hàng này hiện chưa thể hủy');
            return;
        }

        setCancellingOrder(true);
        const res = await cancelCustomOrder(customOrderId, reason);
        setCancellingOrder(false);

        if (!res.success) {
            appToast.error('Không thể hủy đơn', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Đã hủy đơn hàng');
        setCancelModalOpen(false);
        setCancelReason('');
        setCancelEstimate(null);
        await refreshDetail();
        await loadOrderStages(request?.requestId || id);
    };

    const handlePayStage = async (stageId) => {
        if (!stageId || payingStageId) return;
        setPayingStageId(String(stageId));
        const canPayRes = await getStageCanPay(stageId);
        if (!canPayRes.success || !canPayRes.data) {
            setPayingStageId('');
            appToast.info('Chưa thể thanh toán', canPayRes.error || 'Chờ thanh toán giai đoạn trước');
            return;
        }

        const initiateRes = await initiateStagePayment(stageId, {
            paymentMethod: 'VNPAY',
            returnUrl: `${window.location.origin}/payment/success`,
            cancelUrl: `${window.location.origin}/payment/failed`,
        });
        setPayingStageId('');

        if (!initiateRes.success) {
            appToast.error('Không khởi tạo được thanh toán', initiateRes.error || 'Vui lòng thử lại');
            return;
        }

        const paymentUrl = initiateRes.data?.paymentUrl || initiateRes.data?.url;
        if (!paymentUrl) {
            appToast.error('Thiếu link thanh toán', 'Vui lòng thử lại sau');
            return;
        }

        window.location.href = paymentUrl;
    };

    if (loading) {
        return (
            <div className="custom-request-detail-page">
                <div className="detail-skeleton-hero" />
                <div className="detail-skeleton-grid">
                    <div className="detail-skeleton-card" />
                    <div className="detail-skeleton-card" />
                </div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="custom-request-detail-page">
                <div className="detail-empty-state">
                    <h2>Không tìm thấy yêu cầu</h2>
                    <p>Yêu cầu bạn đang xem không tồn tại hoặc đã bị xoá.</p>
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/custom-requests')}>
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="custom-request-detail-page">
            <main className="custom-request-detail-layout">
                <section className="detail-hero">
                    <div className="detail-hero-main">
                        <button type="button" className="detail-back-btn" onClick={() => navigate('/custom-requests')}>
                            <FiArrowLeft /> Quay lại danh sách
                        </button>

                        <div className="detail-hero-badges">
                            <span className={`detail-status-pill ${statusMeta.className}`}>
                                <StatusIcon /> {statusMeta.label}
                            </span>
                            <span className="detail-date-pill">
                                <FiCalendar /> {formatDate(request?.createdAt)}
                            </span>
                        </div>

                        <h1>{request?.title || truncate(request?.description, 120)}</h1>
                        <p className="detail-hero-description">{request?.description || '—'}</p>

                        <div className="detail-hero-actions">
                            <button type="button" className="btn btn-primary" onClick={handleStartConversation} disabled={startingConversationId === String(id)}>
                                <FiMessageSquare /> {startingConversationId === String(id) ? 'Đang tạo...' : 'Bắt đầu trò chuyện'}
                            </button>
                            {requestStatus === 'PENDING_CONFIRMATION' && customOrderId && (
                                <button type="button" className="btn btn-primary" onClick={handleConfirmOrder} disabled={confirmingOrder || orderLookupLoading}>
                                    <FiPackage /> {confirmingOrder ? 'Đang xác nhận...' : orderLookupLoading ? 'Đang tải đơn...' : 'Xác nhận đơn hàng'}
                                </button>
                            )}
                            {(requestStatus === 'PENDING_CONFIRMATION' || requestStatus === 'PENDING_PAYMENT' || requestStatus === 'IN_PROGRESS') && customOrderId && (
                                <button type="button" className="btn btn-outline" onClick={openCancelModal} disabled={cancellingOrder || confirmingOrder || orderLookupLoading}>
                                    <FiFileText /> Hủy đơn hàng
                                </button>
                            )}
                            {requestStatus === 'DRAFT' && (
                                <button type="button" className="btn btn-outline" onClick={handlePublish} disabled={publishing}>
                                    <FiRefreshCw /> {publishing ? 'Đang publish...' : 'Publish yêu cầu'}
                                </button>
                            )}
                            <button type="button" className="btn btn-outline" onClick={handleViewConversation}>
                                <FiUser /> Xem tin nhắn
                            </button>
                        </div>
                    </div>

                    <aside className="detail-hero-side">
                        <div className="detail-image-card">
                            {aiImageUrl ? <img src={aiImageUrl} alt="Ảnh AI gợi ý" /> : <div className="detail-image-placeholder"><FiImage /><span>Chưa có ảnh AI</span></div>}
                        </div>
                        <div className="detail-mini-summary">
                            <StatCard label="Ngân sách" value={`${formatCurrency(request?.minBudget)} - ${formatCurrency(request?.maxBudget)}`} />
                            <StatCard label="Nghệ nhân" value={request?.artisanName || 'Chưa có nghệ nhân'} />
                        </div>
                    </aside>
                </section>

                <section className="detail-content-grid">
                    <div className="detail-content-main">
                        <div className="detail-info-grid">
                            <article className="detail-card">
                                <div className="detail-card-header">
                                    <h3>Thông tin yêu cầu</h3>
                                </div>
                                <p>{request?.description || '—'}</p>
                                <div className="detail-meta-grid">
                                    <div><span>Trạng thái</span><strong>{statusMeta.label}</strong></div>
                                    <div><span>Tạo lúc</span><strong>{formatDate(request?.createdAt)}</strong></div>
                                    <div><span>Cập nhật</span><strong>{formatDate(request?.updatedAt)}</strong></div>
                                    <div><span>Nghệ nhân</span><strong>{artisan?.artisanName || 'Chưa có nghệ nhân'}</strong></div>
                                </div>
                            </article>

                            <article className="detail-card">
                                <div className="detail-card-header">
                                    <h3>Hình ảnh</h3>
                                </div>
                                <div className="detail-gallery">
                                    <div className="detail-gallery-item">
                                        <span className="detail-gallery-label">Ảnh AI</span>
                                        {aiImageUrl ? <img src={aiImageUrl} alt="AI gợi ý" /> : <div className="detail-gallery-placeholder">Không có ảnh</div>}
                                        <button type="button" className="btn btn-outline btn-sm" onClick={handleRegenerateAi} disabled={regenerating}>
                                            {regenerating ? 'Đang tạo...' : 'Tạo lại ảnh AI'}
                                        </button>
                                    </div>
                                    <div className="detail-gallery-item">
                                        <span className="detail-gallery-label">Ảnh tham khảo</span>
                                        {request?.referenceImages?.[0] ? <img src={request.referenceImages[0]} alt="Ảnh tham khảo" /> : <div className="detail-gallery-placeholder">Không có ảnh</div>}
                                    </div>
                                </div>
                            </article>
                        </div>

                        {(requestStatus === 'IN_PROGRESS' || requestStatus === 'ARTISAN_SELECTED' || requestStatus === 'PENDING_CONFIRMATION' || requestStatus === 'PENDING_PAYMENT') && (
                            <article className="detail-card detail-stages-card">
                                <div className="detail-card-header detail-card-header-row">
                                    <h3>Tiến độ thực hiện</h3>
                                    <span className="detail-progress-label">{paidPercent}% hoàn thành · Còn {formatCurrency(remainingAmount)}</span>
                                </div>
                                <div className="detail-progress-bar">
                                    <div className="detail-progress-fill" style={{ width: `${paidPercent}%` }} />
                                </div>

                                {requestStatus === 'PENDING_CONFIRMATION' && customOrderId && (
                                    <div className="detail-locked-payment-panel">
                                        <div className="detail-locked-payment-icon">
                                            <FiShield />
                                        </div>
                                        <div className="detail-locked-payment-body">
                                            <span className="detail-locked-payment-kicker">Thanh toán đang bị khóa</span>
                                            <h4>Yêu cầu xác nhận đơn hàng trước khi mở thanh toán</h4>
                                            <p>
                                                Đơn hàng này đang ở trạng thái chờ xác nhận. Sau khi bạn xác nhận, hệ thống sẽ mở khóa các giai đoạn thanh toán.
                                            </p>
                                            <div className="detail-locked-payment-actions">
                                                <button type="button" className="btn btn-primary" onClick={handleConfirmOrder} disabled={confirmingOrder || cancellingOrder || orderLookupLoading}>
                                                    {confirmingOrder ? 'Đang xác nhận...' : orderLookupLoading ? 'Đang tải đơn...' : 'Xác nhận để mở thanh toán'}
                                                </button>
                                                <button type="button" className="btn btn-outline" onClick={openCancelModal} disabled={cancellingOrder || confirmingOrder || orderLookupLoading}>
                                                    Từ chối
                                                </button>
                                                <span className="detail-locked-payment-hint">Sau khi xác nhận, bạn có thể thanh toán giai đoạn đầu tiên.</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="detail-stages-list">
                                    {stagesLoading ? (
                                        [1, 2, 3].map((item) => <div key={item} className="detail-stage-skeleton" />)
                                    ) : hasStages ? (
                                        stages.map((stage, index) => {
                                            const stageId = getStageId(stage);
                                            const stageStatus = String(stage?.status || '').toUpperCase();
                                            const stageMeta = getStageStatusMeta(stageStatus);
                                            const canPay = stage?.canPay === true;
                                            const isPending = stageStatus === 'PENDING';

                                            return (
                                                <div key={String(stageId)} className="detail-stage-item">
                                                    <div className="detail-stage-index">{index + 1}</div>
                                                    <div className="detail-stage-body">
                                                        <div className="detail-stage-head">
                                                            <h4>{stage?.stageName || `Giai đoạn ${index + 1}`}</h4>
                                                            <span className={`detail-stage-pill ${stageMeta.className}`}>{stageMeta.label}</span>
                                                        </div>
                                                        <p>{stage?.description || '—'}</p>
                                                        <div className="detail-stage-foot">
                                                            <strong>{formatCurrency(stage?.amount)}</strong>
                                                            {canPay && (
                                                                <button type="button" className="btn btn-primary btn-sm" onClick={() => handlePayStage(stageId)} disabled={payingStageId === String(stageId)}>
                                                                    {payingStageId === String(stageId) ? 'Đang chuyển...' : 'Thanh toán'}
                                                                </button>
                                                            )}
                                                            {stageStatus === 'PAID' && <span className="detail-muted-text">Đã thanh toán</span>}
                                                            {!canPay && isPending && <span className="detail-muted-text">Chờ giai đoạn trước</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="detail-empty-inline">Chưa có thông tin tiến độ cho yêu cầu này.</div>
                                    )}
                                </div>
                            </article>
                        )}
                    </div>

                    <aside className="detail-content-side">
                        <article className="detail-card">
                            <div className="detail-card-header detail-card-header-row">
                                <h3>Nghệ nhân quan tâm</h3>
                                <span className="detail-count-pill">{interestedArtisans.length}</span>
                            </div>

                            <div className="detail-artisan-list">
                                {displayInterestedArtisans.length === 0 ? (
                                    <div className="detail-empty-inline">Chưa có nghệ nhân nào bắt đầu trò chuyện.</div>
                                ) : (
                                    displayInterestedArtisans.map((item) => {
                                        const artisanId = item?.artisanId || item?.artisan?.id;
                                        const artisanName = item?.artisanName || item?.artisan?.name || 'Nghệ nhân';
                                        const isSelected = String(selectedArtisanId) === String(artisanId) || item?.isSelectedArtisan === true;

                                        return (
                                            <div key={String(artisanId)} className={`detail-artisan-item ${isSelected ? 'selected' : ''}`}>
                                                <div className="detail-artisan-avatar">{String(artisanName).trim().charAt(0).toUpperCase()}</div>
                                                <div className="detail-artisan-body">
                                                    <strong>{artisanName}</strong>
                                                    <small>{item?.artisanEmail || item?.artisan?.email || (isSelected ? 'Đã chọn nghệ nhân' : 'Đang trao đổi')}</small>
                                                </div>
                                                {isSelected ? (
                                                    <span className="detail-selected-chip">Đã chọn nghệ nhân này</span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => handleSelectArtisanRequest(artisanId, artisanName)}
                                                        disabled={selectingArtisanId === String(artisanId)}
                                                    >
                                                        {selectingArtisanId === String(artisanId) ? 'Đang chọn...' : 'Chọn nghệ nhân này'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <button type="button" className="btn btn-ghost detail-view-all-btn" onClick={() => navigate('/messages')}>
                                <FiUser /> Xem tất cả các nghệ nhân
                            </button>
                        </article>

                        <article className="detail-card detail-tip-card">
                            <div className="detail-card-header">
                                <h3>Gợi ý</h3>
                            </div>
                            <p>
                                Việc chọn nghệ nhân ngay khi có trao đổi phù hợp sẽ giúp bạn theo dõi tiến độ và thanh toán từng giai đoạn rõ ràng hơn.
                            </p>
                        </article>
                    </aside>
                </section>
            </main>

            {confirmModalOpen && (
                <div className="detail-confirm-overlay" onClick={closeConfirmModal} role="dialog" aria-modal="true" aria-labelledby="detail-confirm-title">
                    <div className="detail-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 id="detail-confirm-title">Xác nhận chọn nghệ nhân</h3>
                        <p>
                            Chọn nghệ nhân này? Các cuộc trò chuyện khác sẽ bị đóng.
                            {pendingArtisan?.artisanName ? `\nNghệ nhân: ${pendingArtisan.artisanName}` : ''}
                        </p>
                        <div className="detail-confirm-actions">
                            <button type="button" className="btn btn-outline" onClick={closeConfirmModal} disabled={Boolean(selectingArtisanId)}>
                                Hủy
                            </button>
                            <button type="button" className="btn btn-primary" onClick={confirmSelectArtisan} disabled={Boolean(selectingArtisanId)}>
                                {selectingArtisanId ? 'Đang chọn...' : 'Xác nhận chọn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {cancelModalOpen && (
                <div className="detail-confirm-overlay" onClick={closeCancelModal} role="dialog" aria-modal="true" aria-labelledby="detail-cancel-title">
                    <div className="detail-confirm-modal detail-cancel-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-cancel-header">
                            <div className="detail-cancel-title" id="detail-cancel-title">Hủy đơn hàng</div>
                            <button type="button" className="detail-cancel-close" onClick={closeCancelModal} aria-label="Đóng modal">×</button>
                        </div>

                        <div className="detail-cancel-body">
                            <div className="detail-cancel-info-box">
                                <span className="detail-cancel-info-icon">ℹ️</span>
                                <div className="detail-cancel-info-text">
                                    Hệ thống sẽ ước tính số tiền hoàn lại dựa trên tiến độ hiện tại. Vui lòng kiểm tra kỹ trước khi xác nhận hủy đơn.
                                </div>
                            </div>

                            <div className="detail-cancel-summary">
                                <div className="detail-cancel-summary-label">TỔNG KẾT HOÀN TIỀN</div>
                                <div className="detail-cancel-summary-row">
                                    <span>Tổng số tiền hoàn lại</span>
                                    <strong>{formatCurrency(cancelTotalRefund)}</strong>
                                </div>
                                <div className="detail-cancel-summary-row">
                                    <span>Phí nền tảng (5%)</span>
                                    <strong className="detail-negative-value">-{formatCurrency(cancelPlatformFee)}</strong>
                                </div>
                                <div className="detail-divider" />
                                <div className="detail-cancel-summary-row">
                                    <span><strong>Số tiền thực nhận</strong></span>
                                    <strong className="detail-positive-value">{formatCurrency(cancelNetRefund)}</strong>
                                </div>
                            </div>

                            <div>
                                <div className="detail-cancel-section-label">CHI TIẾT TIẾN ĐỘ</div>
                                {cancelEstimateLoading ? (
                                    <div className="detail-empty-inline">Đang tính ước tính hoàn tiền...</div>
                                ) : cancelEstimate?.stageBreakdown?.length ? (
                                    <div className="detail-cancel-breakdown-list">
                                        {cancelEstimate.stageBreakdown.map((stage) => {
                                            const stageStatus = String(stage.status || '').toUpperCase();
                                            const statusText = stageStatus === 'PENDING'
                                                ? 'Chưa bắt đầu thực hiện'
                                                : stageStatus === 'PAID'
                                                    ? 'Đã thanh toán'
                                                    : 'Đã hoàn thành';
                                            const rawRefundReason = stage.refundReason || stage.reason || '';
                                            const refundReasonMap = {
                                                'Stage completed - no refund': 'Stage đã hoàn thành - không hoàn tiền',
                                                'Stage not started - full refund': 'Stage chưa bắt đầu - hoàn 100%',
                                                'Stage in progress - customer cancel 50% refund': 'Stage đang thực hiện - Customer hủy hoàn 50%',
                                                'Stage in progress - customer cancel refund 50%': 'Stage đang thực hiện - Customer hủy hoàn 50%',
                                                'Stage in progress - refund 50%': 'Stage đang thực hiện - Customer hủy hoàn 50%',
                                            };
                                            const refundReason = refundReasonMap[rawRefundReason] || rawRefundReason;
                                            const refundStatusText = refundReason || (stageStatus === 'PENDING'
                                                ? 'Stage chưa bắt đầu - hoàn 100%'
                                                : stageStatus === 'PAID'
                                                    ? 'Stage đang thực hiện - Customer hủy hoàn 50%'
                                                    : 'Stage đã hoàn thành - không hoàn tiền');

                                            return (
                                                <div key={stage.stageId || stage.stageName} className="detail-cancel-breakdown-item">
                                                    <div className="detail-cancel-breakdown-head">
                                                        <div className="detail-cancel-stage-name-wrap">
                                                            <span className="detail-cancel-stage-dot" />
                                                            <strong>{stage.stageName || 'Stage'}</strong>
                                                        </div>
                                                        <span>{refundStatusText}</span>
                                                    </div>
                                                    <div className="detail-cancel-breakdown-sub">{statusText}</div>
                                                    <div className="detail-cancel-breakdown-meta">
                                                        <span>Đã thanh toán: {formatCurrency(stage.paidAmount)}</span>
                                                        <span>Hoàn gộp: {formatCurrency(stage.grossRefundAmount)}</span>
                                                        <span>Phí nền tảng: {formatCurrency(stage.platformCommission)}</span>
                                                        <span>Hoàn thực nhận: {formatCurrency(stage.netRefundAmount)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="detail-empty-inline">Không có dữ liệu hoàn tiền.</div>
                                )}
                            </div>

                            <div>
                                <label className="detail-cancel-label" htmlFor="cancel-reason-input">Lý do hủy đơn</label>
                                <textarea
                                    id="cancel-reason-input"
                                    className="detail-cancel-textarea"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Nhập lý do hủy đơn..."
                                    disabled={cancellingOrder}
                                />
                            </div>
                        </div>

                        <div className="detail-cancel-footer">
                            <button type="button" className="btn btn-outline" onClick={closeCancelModal} disabled={cancellingOrder} style={{ flex: 1 }}>
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleCancelOrder}
                                disabled={cancellingOrder || cancelEstimateLoading || cancelEstimate?.canCancel === false}
                                style={{ flex: 1 }}
                            >
                                {cancellingOrder ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomRequestDetailPage;

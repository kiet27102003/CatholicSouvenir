import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import {
    getCustomOrderStages,
    getCustomRequestDetail,
    getStageCanPay,
    initiateStagePayment,
    regenerateCustomRequestImage,
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
    const map = {
        DRAFT: { label: 'Bản nháp', className: 'status-draft' },
        OPEN: { label: 'Đang mở', className: 'status-open' },
        IN_PROGRESS: { label: 'Đang thực hiện', className: 'status-in-progress' },
        COMPLETED: { label: 'Hoàn thành', className: 'status-completed' },
    };
    return map[s] || { label: status || 'Không xác định', className: 'status-open' };
};

const getStageStatusMeta = (status) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
        case 'PAID':
            return { label: 'Đã thanh toán', className: 'stage-paid' };
        case 'COMPLETED':
            return { label: 'Hoàn thành', className: 'stage-completed' };
        case 'PENDING':
        default:
            return { label: 'Chờ thanh toán', className: 'stage-pending' };
    }
};

const getStageId = (stage) => stage?.stageId ?? stage?.id;

const CustomRequestDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [stagesLoading, setStagesLoading] = useState(false);
    const [stages, setStages] = useState([]);
    const [payingStageId, setPayingStageId] = useState('');
    const [regenerating, setRegenerating] = useState(false);

    const statusMeta = getStatusMeta(request?.status);

    const aiImageUrl = request?.aiGeneratedImageUrl || request?.aiImageUrl || request?.generatedImageUrl || '';

    const artisan = request?.artisan || request?.confirmedArtisan || request?.selectedArtisan || null;

    const orderId = request?.customOrderId ?? request?.orderId ?? request?.customOrder?.orderId;

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

            const nextOrderId = detailRes.data?.customOrderId ?? detailRes.data?.orderId ?? detailRes.data?.customOrder?.orderId;
            const nextStatus = String(detailRes.data?.status || '').toUpperCase();
            if (nextOrderId && nextStatus === 'IN_PROGRESS') {
                setStagesLoading(true);
                const stagesRes = await getCustomOrderStages(nextOrderId);
                if (cancelled) return;
                setStagesLoading(false);
                if (stagesRes.success) {
                    setStages(Array.isArray(stagesRes.data) ? stagesRes.data : []);
                } else {
                    setStages([]);
                    appToast.error('Không tải được tiến độ', stagesRes.error || 'Vui lòng thử lại');
                }
            } else {
                setStages([]);
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const totalPrice = Number(request?.totalPrice || stages.reduce((sum, stage) => sum + Number(stage?.amount || 0), 0));

    const paidAmount = useMemo(
        () => stages
            .filter((stage) => String(stage?.status || '').toUpperCase() === 'PAID')
            .reduce((sum, stage) => sum + Number(stage?.amount || 0), 0),
        [stages],
    );

    const remainingAmount = Math.max(0, totalPrice - paidAmount);

    const paidPercent = totalPrice > 0 ? Math.min(100, Math.round((paidAmount / totalPrice) * 100)) : 0;

    const refreshDetail = async () => {
        const detailRes = await getCustomRequestDetail(id);
        if (detailRes.success) {
            setRequest(detailRes.data || null);
        }
    };

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
        if (url) {
            setRequest((prev) => ({
                ...prev,
                aiGeneratedImageUrl: url,
            }));
        } else {
            await refreshDetail();
        }

        appToast.success('Đã tạo lại ảnh AI');
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
                <div className="custom-request-detail-skeleton" />
                <div className="custom-request-detail-skeleton" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="custom-request-detail-page">
                <button type="button" className="btn btn-outline" onClick={() => navigate('/custom-requests')}>
                    ← Quay lại danh sách
                </button>
                <div className="custom-request-detail-empty">Không tìm thấy yêu cầu.</div>
            </div>
        );
    }

    return (
        <div className="custom-request-detail-page">
            <header className="custom-request-detail-header">
                <button type="button" className="btn btn-outline" onClick={() => navigate('/custom-requests')}>
                    ← Quay lại danh sách
                </button>
                <div>
                    <h1>{truncate(request?.description, 60)}</h1>
                    <span className={`custom-request-detail-status ${statusMeta.className}`}>{statusMeta.label}</span>
                </div>
            </header>

            <div className="custom-request-detail-grid" id="stages">
                <section className="custom-request-detail-left">
                    <article className="custom-request-detail-card">
                        <h3>Thông tin yêu cầu</h3>
                        <p>{request?.description || '—'}</p>
                        <div className="custom-request-detail-meta-list">
                            <div><span>Ngân sách:</span> {formatCurrency(request?.minBudget)} - {formatCurrency(request?.maxBudget)}</div>
                            <div><span>Nghệ nhân:</span> {artisan?.artisanName || 'Chưa có nghệ nhân'}</div>
                            <div><span>Ngày tạo:</span> {formatDate(request?.createdAt)}</div>
                        </div>
                    </article>

                    {String(request?.status || '').toUpperCase() === 'IN_PROGRESS' && (
                        <article className="custom-request-detail-card">
                            <h3>Tiến độ thực hiện</h3>

                            {stagesLoading ? (
                                <div className="custom-request-stage-skeleton-list">
                                    {[1, 2, 3].map((item) => (
                                        <div key={item} className="custom-request-stage-skeleton" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="custom-request-progress">
                                        <div className="custom-request-progress-track">
                                            <div className="custom-request-progress-value" style={{ width: `${paidPercent}%` }} />
                                        </div>
                                        <p>Đã thanh toán: {formatCurrency(paidAmount)} / {formatCurrency(totalPrice)}</p>
                                    </div>

                                    <div className="custom-request-stages-list">
                                        {stages.map((stage, index) => {
                                            const stageId = getStageId(stage);
                                            const stageStatus = String(stage?.status || '').toUpperCase();
                                            const stageMeta = getStageStatusMeta(stageStatus);
                                            const canPay = stage?.canPay === true;
                                            const isPaid = stageStatus === 'PAID';
                                            const isPending = stageStatus === 'PENDING';
                                            const isBlockedPending = isPending && !canPay;

                                            return (
                                                <div key={String(stageId)} className={`custom-request-stage-item ${isBlockedPending ? 'is-blocked' : ''}`}>
                                                    <div className={`custom-request-stage-index ${isPaid ? 'done' : canPay ? 'active' : 'idle'}`}>
                                                        {index + 1}
                                                    </div>

                                                    <div className="custom-request-stage-content">
                                                        <div className="custom-request-stage-top">
                                                            <h4>{stage?.stageName || `Giai đoạn ${index + 1}`}</h4>
                                                            <span className={`custom-request-stage-badge ${stageMeta.className}`}>{stageMeta.label}</span>
                                                        </div>
                                                        <div className="custom-request-stage-sub">
                                                            <span>{formatDate(stage?.dueDate)}</span>
                                                            <strong>{formatCurrency(stage?.amount)}</strong>
                                                        </div>

                                                        {isPaid && stage?.completionImageUrl && (
                                                            <img src={stage.completionImageUrl} alt="Kết quả giai đoạn" className="custom-request-stage-thumb" />
                                                        )}

                                                        {canPay && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary btn-sm"
                                                                disabled={payingStageId === String(stageId)}
                                                                onClick={() => handlePayStage(stageId)}
                                                            >
                                                                {payingStageId === String(stageId)
                                                                    ? 'Đang chuyển hướng...'
                                                                    : 'Thanh toán giai đoạn này'}
                                                            </button>
                                                        )}

                                                        {!canPay && isPending && (
                                                            <p className="custom-request-stage-note">Chờ thanh toán giai đoạn trước</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </article>
                    )}
                </section>

                <aside className="custom-request-detail-right">
                    {(aiImageUrl || request?.generateAiImage) && (
                        <article className="custom-request-detail-card">
                            <h3>Ảnh AI gợi ý</h3>
                            {aiImageUrl ? (
                                <div className="custom-request-ai-wrap">
                                    <img src={aiImageUrl} alt="AI gợi ý" className={`custom-request-ai-image ${regenerating ? 'is-loading' : ''}`} />
                                    {regenerating && <div className="custom-request-ai-overlay">Đang tạo lại...</div>}
                                </div>
                            ) : (
                                <div className="custom-request-ai-empty">
                                    <div className="custom-request-detail-skeleton" />
                                    <p>Đang tạo ảnh AI...</p>
                                </div>
                            )}

                            <button type="button" className="btn btn-outline" onClick={handleRegenerateAi} disabled={regenerating}>
                                {regenerating ? 'Đang tạo lại...' : '↻ Tạo lại ảnh'}
                            </button>
                        </article>
                    )}

                    {artisan && (
                        <article className="custom-request-detail-card">
                            <h3>Thông tin nghệ nhân</h3>
                            <div className="custom-request-artisan-row">
                                <div className="custom-request-artisan-avatar">
                                    {String(artisan?.artisanName || artisan?.name || 'A').trim().charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="custom-request-artisan-name">{artisan?.artisanName || artisan?.name || 'Nghệ nhân'}</div>
                                    <div className="custom-request-artisan-email">{artisan?.email || '—'}</div>
                                </div>
                            </div>
                            <button type="button" className="btn btn-outline" onClick={() => appToast.info('Sắp ra mắt', 'Chức năng nhắn tin sẽ sớm khả dụng')}>
                                Nhắn tin
                            </button>
                        </article>
                    )}

                    {String(request?.status || '').toUpperCase() === 'IN_PROGRESS' && (
                        <article className="custom-request-detail-card">
                            <h3>Tóm tắt thanh toán</h3>
                            <div className="custom-request-payment-summary">
                                <p>Tổng đơn <strong>{formatCurrency(totalPrice)}</strong></p>
                                <p>Đã thanh toán <strong>{formatCurrency(paidAmount)}</strong></p>
                                <p>Còn lại <strong>{formatCurrency(remainingAmount)}</strong></p>
                            </div>
                        </article>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default CustomRequestDetailPage;

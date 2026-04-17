import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import { useAuth } from '../../context/AuthContext';
import { getConversationsByRequest, startConversation } from '../../services/chatService';
import {
    getCustomOrderStages,
    getCustomRequestDetail,
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
    try { return new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return value; }
};
const truncate = (value, length) => { const text = String(value || '').trim(); if (!text) return 'Yêu cầu custom'; return text.length > length ? `${text.slice(0, length)}...` : text; };
const getStatusMeta = (status) => { const s = String(status || '').toUpperCase(); return ({ DRAFT: { label: 'Bản nháp', className: 'status-draft' }, OPEN: { label: 'Đang mở', className: 'status-open' }, PUBLISHED: { label: 'Đang mở', className: 'status-open' }, ARTISAN_SELECTED: { label: 'Đã chọn artisan', className: 'status-selected' }, IN_PROGRESS: { label: 'Đang thực hiện', className: 'status-in-progress' }, COMPLETED: { label: 'Hoàn thành', className: 'status-completed' } }[s]) || { label: status || 'Không xác định', className: 'status-open' }; };
const getStageStatusMeta = (status) => { const s = String(status || '').toUpperCase(); return ({ PAID: { label: 'Đã thanh toán', className: 'stage-paid' }, COMPLETED: { label: 'Hoàn thành', className: 'stage-completed' }, PENDING: { label: 'Chờ thanh toán', className: 'stage-pending' } }[s]) || { label: 'Chờ thanh toán', className: 'stage-pending' }; };
const getStageId = (stage) => stage?.stageId ?? stage?.id;

const CustomRequestDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [stagesLoading, setStagesLoading] = useState(false);
    const [stages, setStages] = useState([]);
    const [interestedArtisans, setInterestedArtisans] = useState([]);
    const [requestUpdating, setRequestUpdating] = useState(false);
    const [selectingArtisanId, setSelectingArtisanId] = useState('');
    const [startingConversationId, setStartingConversationId] = useState('');
    const [payingStageId, setPayingStageId] = useState('');
    const [regenerating, setRegenerating] = useState(false);

    const requestStatus = String(request?.status || '').toUpperCase();
    const statusMeta = getStatusMeta(requestStatus);
    const aiImageUrl = request?.aiGeneratedImageUrl || request?.aiImageUrl || request?.generatedImageUrl || '';
    const artisan = request?.artisan || request?.confirmedArtisan || request?.selectedArtisan || null;
    const isCustomer = String(user?.role || '').toUpperCase() === 'CUSTOMER';
    const isDraft = requestStatus === 'DRAFT';
    const isOpen = requestStatus === 'OPEN' || requestStatus === 'PUBLISHED';
    const isArtisanSelected = requestStatus === 'ARTISAN_SELECTED';
    const canManageRequest = isCustomer && (isDraft || isOpen || isArtisanSelected);
    const totalPrice = Number(request?.totalPrice || stages.reduce((sum, stage) => sum + Number(stage?.amount || 0), 0));
    const paidAmount = useMemo(() => stages.filter((stage) => String(stage?.status || '').toUpperCase() === 'PAID').reduce((sum, stage) => sum + Number(stage?.amount || 0), 0), [stages]);
    const remainingAmount = Math.max(0, totalPrice - paidAmount);
    const paidPercent = totalPrice > 0 ? Math.min(100, Math.round((paidAmount / totalPrice) * 100)) : 0;
    const selectedArtisanId = String(request?.selectedArtisanId || artisan?.artisanId || artisan?.id || '');

    const refreshInterestedArtisans = async () => { const res = await getConversationsByRequest(id); if (res.success) setInterestedArtisans(Array.isArray(res.data) ? res.data : []); };
    const refreshDetail = async () => { const detailRes = await getCustomRequestDetail(id); if (detailRes.success) setRequest(detailRes.data || null); };

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        const fetchData = async () => {
            setLoading(true);
            const detailRes = await getCustomRequestDetail(id);
            if (cancelled) return;
            if (!detailRes.success) { setLoading(false); appToast.error('Không tải được chi tiết', detailRes.error || 'Vui lòng thử lại'); return; }
            setRequest(detailRes.data || null); setLoading(false);
            const nextStatus = String(detailRes.data?.status || '').toUpperCase();
            if (nextStatus === 'OPEN' || nextStatus === 'PUBLISHED' || nextStatus === 'ARTISAN_SELECTED') await refreshInterestedArtisans(); else setInterestedArtisans([]);
            const nextOrderId = detailRes.data?.customOrderId ?? detailRes.data?.orderId ?? detailRes.data?.customOrder?.orderId;
            if (nextOrderId && nextStatus === 'IN_PROGRESS') {
                setStagesLoading(true);
                const stagesRes = await getCustomOrderStages(nextOrderId);
                if (cancelled) return;
                setStagesLoading(false);
                if (stagesRes.success) setStages(Array.isArray(stagesRes.data) ? stagesRes.data : []); else { setStages([]); appToast.error('Không tải được tiến độ', stagesRes.error || 'Vui lòng thử lại'); }
            } else setStages([]);
        };
        fetchData(); return () => { cancelled = true; };
    }, [id]);

    const handleRegenerateAi = async () => { if (!id || regenerating) return; setRegenerating(true); const res = await regenerateCustomRequestImage(id); setRegenerating(false); if (!res.success) { appToast.error('Tạo lại ảnh thất bại', res.error || 'Vui lòng thử lại'); return; } const url = typeof res.data === 'string' ? res.data : ''; if (url) setRequest((prev) => ({ ...prev, aiGeneratedImageUrl: url })); else await refreshDetail(); appToast.success('Đã tạo lại ảnh AI'); };
    const handlePublish = async () => { if (!id || requestUpdating) return; setRequestUpdating(true); const res = await publishCustomRequest(id); setRequestUpdating(false); if (!res.success) { appToast.error('Publish thất bại', res.error || 'Vui lòng thử lại'); return; } appToast.success('Yêu cầu đã được publish'); await refreshDetail(); await refreshInterestedArtisans(); };
    const handleStartConversation = async () => { if (!id || startingConversationId) return; setStartingConversationId(String(id)); const res = await startConversation(id); setStartingConversationId(''); if (!res.success) { appToast.error('Không thể bắt đầu trò chuyện', res.error || 'Vui lòng thử lại'); return; } const conversationId = res.data?.conversationId || res.data?.id; appToast.success('Đã tạo cuộc trò chuyện'); navigate(conversationId ? `/messages?conversationId=${conversationId}` : '/messages'); };
    const handleSelectArtisan = async (artisanId) => { if (!id || !artisanId || selectingArtisanId) return; if (!window.confirm('Chọn nghệ nhân này? Các cuộc trò chuyện khác sẽ bị đóng.')) return; setSelectingArtisanId(String(artisanId)); const res = await selectCustomRequestArtisan(id, artisanId); setSelectingArtisanId(''); if (!res.success) { appToast.error('Chọn nghệ nhân thất bại', res.error || 'Vui lòng thử lại'); return; } appToast.success('Đã chọn nghệ nhân'); await refreshDetail(); await refreshInterestedArtisans(); };
    const handlePayStage = async (stageId) => { if (!stageId || payingStageId) return; setPayingStageId(String(stageId)); const canPayRes = await getStageCanPay(stageId); if (!canPayRes.success || !canPayRes.data) { setPayingStageId(''); appToast.info('Chưa thể thanh toán', canPayRes.error || 'Chờ thanh toán giai đoạn trước'); return; } const initiateRes = await initiateStagePayment(stageId, { paymentMethod: 'VNPAY', returnUrl: `${window.location.origin}/payment/success`, cancelUrl: `${window.location.origin}/payment/failed` }); setPayingStageId(''); if (!initiateRes.success) { appToast.error('Không khởi tạo được thanh toán', initiateRes.error || 'Vui lòng thử lại'); return; } const paymentUrl = initiateRes.data?.paymentUrl || initiateRes.data?.url; if (!paymentUrl) { appToast.error('Thiếu link thanh toán', 'Vui lòng thử lại sau'); return; } window.location.href = paymentUrl; };

    if (loading) return <div className="custom-request-detail-page"><div className="custom-request-detail-skeleton" /><div className="custom-request-detail-skeleton" /></div>;
    if (!request) return <div className="custom-request-detail-page"><button type="button" className="btn btn-outline" onClick={() => navigate('/custom-requests')}>← Quay lại danh sách</button><div className="custom-request-detail-empty">Không tìm thấy yêu cầu.</div></div>;

    return (
        <div className="custom-request-detail-page">
            <main className="custom-request-main">
                <header className="custom-request-topbar">
                    <button type="button" className="back-link" onClick={() => navigate('/custom-requests')}>← Quay lại danh sách</button>
                </header>

                <section className="hero-section">
                    <div className="hero-left">
                        <div className="hero-badges">
                            <span className={`custom-request-detail-status ${statusMeta.className}`}>{statusMeta.label}</span>
                            <span className="hero-date">Ngày tạo: {formatDate(request?.createdAt)}</span>
                        </div>
                        <h1>{truncate(request?.description, 120)}</h1>
                        <p className="hero-description">{request?.description}</p>
                    </div>

                    <div className="hero-cta">
                        <button type="button" className="btn btn-primary btn-block" onClick={handleStartConversation} disabled={startingConversationId === String(id)}>
                            {startingConversationId === String(id) ? 'Đang tạo...' : 'Bắt đầu trò chuyện'}
                        </button>
                    </div>
                </section>

                <section className="content-grid">
                    <div className="main-column">
                        <article className="info-card request-summary-card">
                            <div className="section-head"><h3>Thông tin yêu cầu</h3></div>
                            <p className="request-summary-text">{request?.description}</p>
                            <div className="request-summary-meta">
                                <div>
                                    <span className="meta-label">Ngân sách</span>
                                    <strong>{formatCurrency(request?.minBudget)} - {formatCurrency(request?.maxBudget)}</strong>
                                </div>
                                <div>
                                    <span className="meta-label">Nghệ nhân</span>
                                    <strong>{artisan?.artisanName || 'Chưa có nghệ nhân'}</strong>
                                </div>
                            </div>
                        </article>

                        <div className="gallery-row">
                            <div className="gallery-card">
                                {aiImageUrl ? <img src={aiImageUrl} alt="AI gợi ý" /> : <div className="gallery-placeholder">AI image</div>}
                            </div>
                            <div className="gallery-card dark">
                                {request?.referenceImages?.[0] ? <img src={request.referenceImages[0]} alt="Reference" /> : <div className="gallery-placeholder">Reference</div>}
                            </div>
                        </div>

                        {requestStatus === 'IN_PROGRESS' && (
                            <article className="info-card stages-card">
                                <div className="section-head"><h3>Tiến độ thực hiện</h3><span>{paidPercent}% đã thanh toán</span></div>
                                <div className="progress-track"><div className="progress-value" style={{ width: `${paidPercent}%` }} /></div>
                                <div className="stages-list">
                                    {stagesLoading ? [1, 2, 3].map((item) => <div key={item} className="custom-request-stage-skeleton" />) : stages.map((stage, index) => {
                                        const stageId = getStageId(stage); const stageStatus = String(stage?.status || '').toUpperCase(); const stageMeta = getStageStatusMeta(stageStatus); const canPay = stage?.canPay === true; const isPending = stageStatus === 'PENDING';
                                        return (<div key={String(stageId)} className="stage-row"><div className="stage-index">{index + 1}</div><div className="stage-body"><div className="section-head"><h4>{stage?.stageName || `Giai đoạn ${index + 1}`}</h4><span className={`custom-request-stage-badge ${stageMeta.className}`}>{stageMeta.label}</span></div><p>{stage?.description || '—'}</p><div className="stage-footer"><span>{formatCurrency(stage?.amount)}</span>{canPay && <button type="button" className="btn btn-primary btn-sm" onClick={() => handlePayStage(stageId)} disabled={payingStageId === String(stageId)}>{payingStageId === String(stageId) ? 'Đang chuyển hướng...' : 'Thanh toán'}</button>}{!canPay && isPending && <span className="muted">Chờ giai đoạn trước</span>}</div></div></div>);
                                    })}
                                </div>
                            </article>
                        )}
                    </div>

                    <aside className="right-column">
                        <article className="info-card interested-card">
                            <div className="section-head"><h3>Các nghệ nhân quan tâm</h3><span className="info-dot">{interestedArtisans.length}</span></div>
                            <div className="artisan-list">
                                {interestedArtisans.length === 0 ? <p className="muted">Chưa có nghệ nhân nào bắt đầu trò chuyện.</p> : interestedArtisans.map((item) => {
                                    const artisanId = item?.artisanId || item?.artisan?.id; const artisanName = item?.artisanName || item?.artisan?.name || 'Nghệ nhân'; const isSelected = String(selectedArtisanId) === String(artisanId);
                                    return (<div key={String(artisanId)} className="artisan-card"><div className="artisan-avatar">{String(artisanName).trim().charAt(0).toUpperCase()}</div><div className="artisan-card-body"><strong>{artisanName}</strong><small>{item?.artisanEmail || item?.artisan?.email || 'Đang trao đổi'}</small></div>{isSelected ? <span className="selected-chip">Đã chọn</span> : <button type="button" className="btn btn-outline btn-sm" onClick={() => handleSelectArtisan(artisanId)} disabled={selectingArtisanId === String(artisanId)}>{selectingArtisanId === String(artisanId) ? 'Đang chọn...' : 'Chọn artisan này'}</button>}</div>);
                                })}
                            </div>
                            <button type="button" className="btn btn-ghost view-all-link" onClick={() => navigate('/messages')}>Xem tất cả các nghệ nhân</button>
                        </article>

                        {aiImageUrl && (
                            <article className="info-card advice-card"><h3>Lời khuyên từ chuyên gia</h3><p>Các yêu cầu có mood board trực quan thường kết hợp ý tưởng tốt nhất khi bạn định hình văn phong rõ ràng ngay từ đầu.</p></article>
                        )}
                    </aside>
                </section>
            </main>
        </div>
    );
};

export default CustomRequestDetailPage;

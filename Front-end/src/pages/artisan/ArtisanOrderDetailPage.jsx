import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import Sidebar from './components/Sidebar';
import {
    cancelCustomOrder,
    completeStage,
    getCustomOrderDetail,
    getCustomOrderStages,
    uploadReferenceImage,
    uploadStageProof,
} from '../../services/customRequestService';
import './ArtisanDashboard.css';
import './ArtisanOrderDetailPage.css';

const moneyFormatter = new Intl.NumberFormat('vi-VN');
const formatCurrency = (value) => `${moneyFormatter.format(Number(value || 0))} đ`;
const formatDate = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString('vi-VN');
    } catch {
        return value;
    }
};

const getStatusLabel = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PENDING') return 'PENDING';
    if (s === 'IN_PROGRESS') return 'IN_PROGRESS';
    if (s === 'COMPLETED') return 'COMPLETED';
    if (s === 'CANCELLED') return 'CANCELLED';
    if (s === 'PENDING_PAYMENT') return 'PENDING_PAYMENT';
    return status || '—';
};

const getStatusClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PENDING') return 'bg-yellow-100 text-yellow-800';
    if (s === 'IN_PROGRESS') return 'bg-blue-100 text-blue-800';
    if (s === 'COMPLETED') return 'bg-green-100 text-green-800';
    if (s === 'CANCELLED') return 'bg-red-100 text-red-800';
    if (s === 'PENDING_PAYMENT') return 'bg-sky-100 text-sky-800';
    return 'bg-gray-100 text-gray-700';
};

const isCompleted = (stage) => String(stage?.status || '').toUpperCase() === 'COMPLETED';
const isActiveStage = (stage) => String(stage?.status || '').toUpperCase() === 'PAID' || String(stage?.status || '').toUpperCase() === 'IN_PROGRESS';

const ArtisanOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [stages, setStages] = useState([]);
    const [submittingStageId, setSubmittingStageId] = useState('');
    const [proofUploadingId, setProofUploadingId] = useState('');
    const [proofByStage, setProofByStage] = useState({});
    const [notesByStage, setNotesByStage] = useState({});

    const loadAll = async () => {
        setLoading(true);
        const [detailRes, stagesRes] = await Promise.all([
            getCustomOrderDetail(id),
            getCustomOrderStages(id),
        ]);
        setLoading(false);

        if (!detailRes.success) {
            appToast.error('Không tải được chi tiết đơn', detailRes.error || 'Vui lòng thử lại');
            return;
        }

        setOrder(detailRes.data || null);
        setStages(stagesRes.success ? (Array.isArray(stagesRes.data) ? stagesRes.data : []) : []);
    };

    useEffect(() => {
        loadAll();
    }, [id]);

    const progress = useMemo(() => {
        if (!stages.length) return 0;
        const done = stages.filter(isCompleted).length;
        return Math.round((done / stages.length) * 100);
    }, [stages]);

    const activeStage = useMemo(() => stages.find(isActiveStage) || null, [stages]);

    const revenueCurrent = Number(activeStage?.amount || 0) * 0.9;
    const completedRevenue = stages.filter(isCompleted).reduce((sum, stage) => sum + Number(stage?.amount || 0) * 0.9, 0);
    const expectedRemain = stages.filter((stage) => !isCompleted(stage)).reduce((sum, stage) => sum + Number(stage?.amount || 0) * 0.9, 0);

    const handleCancelOrder = async () => {
        if (!id) return;
        if (!window.confirm('Bạn có chắc muốn huỷ đơn này?')) return;

        const res = await cancelCustomOrder(id);
        if (!res.success) {
            appToast.error('Huỷ đơn thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Đã huỷ đơn thành công');
        navigate('/artisan/orders');
    };

    const handleUploadProof = async (stageId, file) => {
        if (!file || !stageId || proofUploadingId) return;

        setProofUploadingId(String(stageId));
        const uploadRes = await uploadReferenceImage(file);
        if (!uploadRes.success) {
            setProofUploadingId('');
            appToast.error('Upload ảnh thất bại', uploadRes.error || 'Vui lòng thử lại');
            return;
        }

        const proofUrl = uploadRes.data;
        const proofRes = await uploadStageProof(stageId, proofUrl);
        setProofUploadingId('');

        if (!proofRes.success) {
            appToast.error('Lưu ảnh bằng chứng thất bại', proofRes.error || 'Vui lòng thử lại');
            return;
        }

        setProofByStage((prev) => ({ ...prev, [String(stageId)]: proofUrl }));
        appToast.success('Đã upload ảnh bằng chứng');
    };

    const handleCompleteStage = async (stage) => {
        const stageId = stage?.stageId ?? stage?.id;
        if (!stageId || submittingStageId) return;

        const completionImageUrl = proofByStage[String(stageId)] || stage?.completionImageUrl || '';
        const notes = notesByStage[String(stageId)] || '';
        if (!completionImageUrl) {
            appToast.warning('Vui lòng upload ảnh kết quả trước khi hoàn thành');
            return;
        }

        setSubmittingStageId(String(stageId));
        const res = await completeStage(stageId, { completionImageUrl, notes });
        setSubmittingStageId('');

        if (!res.success) {
            appToast.error('Không thể hoàn thành stage', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success(`Đã hoàn thành giai đoạn ${stage?.stageName || ''}`);
        loadAll();
    };

    if (!id) return <div className="artisan-empty">Thiếu mã đơn hàng.</div>;
    if (loading) return <div className="artisan-skeleton-page" />;
    if (!order) return <div className="artisan-empty">Không tìm thấy đơn hàng.</div>;

    const status = String(order?.status || '').toUpperCase();
    const orderTitle = order?.requestDescription || order?.requestTitle || order?.description || 'Đơn tùy chỉnh';

    return (
        <div className="artisan-dashboard">
            <Sidebar
                user={user}
                activeView="customOrders"
                setActiveView={(view) => navigate(view === 'customOrders' ? '/artisan/orders' : `/artisan/${view}`)}
                onLogout={logout}
            />
            <main className="artisan-main">
                <div className="artisan-order-detail-page">
                    <header className="artisan-order-header">
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/artisan/orders')}>← Quay lại</button>
                        <div>
                            <h1>{orderTitle}</h1>
                            <span className={`status-badge ${getStatusClass(status)}`}>{getStatusLabel(status)}</span>
                        </div>
                        {status !== 'COMPLETED' && (
                            <button type="button" className="btn btn-outline" onClick={handleCancelOrder}>Huỷ đơn</button>
                        )}
                    </header>

                    <div className="artisan-order-grid">
                        <section className="left-col">
                            <article className="card-box">
                                <h3>Thông tin đơn</h3>
                                <p>Tên khách hàng: <strong>{order?.customerName || '—'}</strong></p>
                                <p>Tổng giá trị: <strong>{formatCurrency(order?.totalPrice)}</strong></p>
                                <p>Mô tả: <strong>{order?.description || '—'}</strong></p>
                            </article>

                            <article className="card-box">
                                <h3>Các giai đoạn</h3>
                                <div className="progress-wrap">
                                    <div className="progress-track"><div className="progress-value" style={{ width: `${progress}%` }} /></div>
                                    <small>{progress}% hoàn thành</small>
                                </div>

                                <div className="stages-list">
                                    {stages.map((stage, idx) => {
                                        const stageId = stage?.stageId ?? stage?.id;
                                        const completed = isCompleted(stage);
                                        const active = isActiveStage(stage);
                                        const pending = !completed && !active;
                                        const proofPreview = proofByStage[String(stageId)] || stage?.completionImageUrl || '';

                                        return (
                                            <div key={String(stageId || idx)} className={`stage-item ${completed ? 'completed' : active ? 'active' : 'pending'}`}>
                                                <div className="dot">{completed ? '✓' : idx + 1}</div>
                                                <div className="content">
                                                    <div className="top-row">
                                                        <h4>{stage?.stageName || `Giai đoạn ${idx + 1}`}</h4>
                                                        <span className="badge">{getStatusLabel(stage?.status)}</span>
                                                    </div>
                                                    <div className="sub-row">
                                                        <span>{completed ? `Hoàn thành: ${formatDate(stage?.completedAt)}` : `Hạn: ${formatDate(stage?.dueDate)}`}</span>
                                                        <strong>{formatCurrency(stage?.amount)}</strong>
                                                    </div>

                                                    {proofPreview && <img src={proofPreview} alt="completion" className="proof-thumb" />}
                                                    {completed && <p className="muted">Khách đã duyệt</p>}
                                                    {active && (
                                                        <div className="stage-complete-form">
                                                            <label className="upload-zone">
                                                                Upload ảnh kết quả
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    disabled={proofUploadingId === String(stageId)}
                                                                    onChange={(e) => handleUploadProof(stageId, e.target.files?.[0])}
                                                                />
                                                            </label>
                                                            <textarea
                                                                rows="3"
                                                                placeholder="Ghi chú hoàn thành"
                                                                value={notesByStage[String(stageId)] || ''}
                                                                onChange={(e) => setNotesByStage((prev) => ({ ...prev, [String(stageId)]: e.target.value }))}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary"
                                                                disabled={submittingStageId === String(stageId)}
                                                                onClick={() => handleCompleteStage(stage)}
                                                            >
                                                                {submittingStageId === String(stageId)
                                                                    ? 'Đang xử lý...'
                                                                    : `Đánh dấu hoàn thành giai đoạn ${idx + 1}`}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {pending && <p className="muted">Chờ giai đoạn trước hoàn thành</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                        </section>

                        <aside className="right-col">
                            <article className="card-box">
                                <h3>Thông tin khách hàng</h3>
                                <div className="customer-box">
                                    <div className="avatar">{String(order?.customerName || 'C').charAt(0).toUpperCase()}</div>
                                    <div>
                                        <strong>{order?.customerName || 'Khách hàng'}</strong>
                                        <p>{order?.customerEmail || '—'}</p>
                                    </div>
                                </div>
                            </article>

                            <article className="card-box">
                                <h3>Thông tin nghệ nhân</h3>
                                <p><strong>{order?.artisanName || '—'}</strong></p>
                                <p>{order?.artisanEmail || '—'}</p>
                                <p>{order?.artisanPhone || '—'}</p>
                            </article>

                            <article className="card-box">
                                <h3>Doanh thu đơn</h3>
                                <p>Tổng đơn: <strong>{formatCurrency(order?.totalPrice)}</strong></p>
                                <p>Đã thanh toán: <strong>{order?.fullyPaid ? 'Có' : 'Chưa'}</strong></p>
                                <p>Trạng thái: <strong>{order?.status || '—'}</strong></p>
                                <p>Đang xử lý: <strong>{activeStage?.stageName || '—'}</strong></p>
                                <p>Doanh thu hiện tại: <strong>{formatCurrency(revenueCurrent)}</strong></p>
                                <p>Đã nhận: <strong>{formatCurrency(completedRevenue)}</strong></p>
                                <p>Còn lại: <strong>{formatCurrency(expectedRemain)}</strong></p>
                            </article>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ArtisanOrderDetailPage;

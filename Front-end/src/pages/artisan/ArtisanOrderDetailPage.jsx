import React, { useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiCheckCircle, FiClock, FiDollarSign, FiFileText, FiMail, FiPhone, FiUser } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import ImageUpload from '../../components/ui/ImageUpload';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import {
    cancelCustomOrder,
    completeStage,
    getCustomOrderDetail,
    getCustomOrderStages,
} from '../../services/customRequestService';
import Sidebar from './components/Sidebar';
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
    if (s === 'PENDING') return 'Chờ xử lý';
    if (s === 'IN_PROGRESS') return 'Đang thực hiện';
    if (s === 'COMPLETED') return 'Hoàn thành';
    if (s === 'CANCELLED') return 'Đã huỷ';
    if (s === 'PENDING_PAYMENT') return 'Chờ thanh toán';
    if (s === 'PAID') return 'Đã thanh toán';
    return status || '—';
};

const getStatusClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED') return 'completed';
    if (s === 'CANCELLED') return 'cancelled';
    if (s === 'IN_PROGRESS' || s === 'PAID') return 'in-progress';
    return 'pending';
};

const isCompleted = (stage) => String(stage?.status || '').toUpperCase() === 'COMPLETED';
const isActiveStage = (stage) => {
    const s = String(stage?.status || '').toUpperCase();
    return s === 'PAID' || s === 'IN_PROGRESS';
};

const ArtisanOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [stages, setStages] = useState([]);
    const [submittingStageId, setSubmittingStageId] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelConfirmText, setCancelConfirmText] = useState('');
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

    const openCancelModal = () => {
        setCancelConfirmText('');
        setCancelModalOpen(true);
    };

    const handleCancelOrder = async () => {
        if (!id || cancelling) return;
        if (cancelConfirmText.trim() !== 'Hủy đơn') return;

        setCancelling(true);
        const res = await cancelCustomOrder(id);
        setCancelling(false);

        if (!res.success) {
            appToast.error('Huỷ đơn thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        setCancelModalOpen(false);
        appToast.success('Đã huỷ đơn thành công');
        navigate('/artisan/orders');
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
                <div className="artisan-order-detail-page modern-order-detail-page">
                    <header className="detail-page-header">
                        <button type="button" className="btn btn-outline back-btn-top" onClick={() => navigate('/artisan/orders')}>
                            ← Quay lại danh sách
                        </button>

                        <div className="header-main-row">
                            <h1>{orderTitle}</h1>
                        </div>
                    </header>

                    <section className="detail-summary-grid">
                        <article className="summary-card summary-status-card">
                            <span className="summary-icon"><FiCheckCircle /></span>
                            <div>
                                <p>Trạng thái đơn</p>
                                <strong><span className={`status-badge ${getStatusClass(status)}`}>{getStatusLabel(status)}</span></strong>
                            </div>
                        </article>
                        <article className="summary-card">
                            <span className="summary-icon"><FiDollarSign /></span>
                            <div>
                                <p>Tổng đơn</p>
                                <strong>{formatCurrency(order?.totalPrice)}</strong>
                            </div>
                        </article>
                        <article className="summary-card">
                            <span className="summary-icon icon-blue"><FiClock /></span>
                            <div>
                                <p>Đang xử lý</p>
                                <strong>{activeStage?.stageName || '—'}</strong>
                            </div>
                        </article>
                        <article className="summary-card">
                            <span className="summary-icon icon-green"><FiCheckCircle /></span>
                            <div>
                                <p>Tiến độ</p>
                                <strong>{progress}%</strong>
                            </div>
                        </article>
                        <article className="summary-card">
                            <span className="summary-icon icon-amber"><FiCalendar /></span>
                            <div>
                                <p>Ngày tạo</p>
                                <strong>{formatDate(order?.createdAt)}</strong>
                            </div>
                        </article>
                    </section>

                    <div className="detail-layout-grid">
                        <section className="left-col">
                            <article className="card-box info-card">
                                <h3>Thông tin đơn</h3>
                                <div className="info-grid">
                                    <div>
                                        <label>Khách hàng</label>
                                        <p>{order?.customerName || '—'}</p>
                                    </div>
                                    <div>
                                        <label>Tổng giá trị</label>
                                        <p>{formatCurrency(order?.totalPrice)}</p>
                                    </div>
                                    <div className="full-width">
                                        <label>Mô tả</label>
                                        <p>{order?.description || '—'}</p>
                                    </div>
                                </div>
                            </article>

                            <article className="card-box">
                                <div className="stage-card-header">
                                    <h3>Tiến độ các giai đoạn</h3>
                                    <span>{stages.length} giai đoạn</span>
                                </div>

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
                                                <div className="timeline-dot">{completed ? '✓' : idx + 1}</div>
                                                <div className="stage-content">
                                                    <div className="stage-top-row">
                                                        <h4>{stage?.stageName || `Giai đoạn ${idx + 1}`}</h4>
                                                        <span className={`mini-status ${getStatusClass(stage?.status)}`}>{getStatusLabel(stage?.status)}</span>
                                                    </div>

                                                    <div className="stage-sub-row">
                                                        <span>{completed ? `Hoàn thành: ${formatDate(stage?.completedAt)}` : `Hạn: ${formatDate(stage?.dueDate)}`}</span>
                                                        <strong>{formatCurrency(stage?.amount)}</strong>
                                                    </div>

                                                    {proofPreview && <img src={proofPreview} alt="completion" className="proof-thumb" />}

                                                    {completed && <p className="muted">Giai đoạn đã hoàn thành.</p>}

                                                    {active && (
                                                        <div className="stage-complete-form">
                                                            <ImageUpload
                                                                label="Ảnh kết quả"
                                                                helperText="Tải ảnh lên hoặc dán URL ảnh hoàn thành."
                                                                folder="stage-proofs"
                                                                value={proofByStage[String(stageId)] || stage?.completionImageUrl || ''}
                                                                onChange={(nextValue) => setProofByStage((prev) => ({ ...prev, [String(stageId)]: nextValue }))}
                                                                disabled={submittingStageId === String(stageId)}
                                                                nativeFileInputOnly
                                                            />
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

                                                    {pending && <p className="muted">Chờ giai đoạn trước hoàn thành.</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                        </section>

                        <aside className="right-col">
                            <article className="card-box side-card">
                                <h3>Thông tin khách hàng</h3>
                                <div className="person-row">
                                    <span className="person-icon"><FiUser /></span>
                                    <div>
                                        <strong>{order?.customerName || 'Khách hàng'}</strong>
                                        <p><FiMail /> {order?.customerEmail || '—'}</p>
                                    </div>
                                </div>
                            </article>

                            <article className="card-box side-card">
                                <h3>Thông tin nghệ nhân</h3>
                                <p><FiUser /> <strong>{order?.artisanName || '—'}</strong></p>
                                <p><FiMail /> {order?.artisanEmail || '—'}</p>
                                <p><FiPhone /> {order?.artisanPhone || '—'}</p>
                            </article>

                            <article className="card-box side-card">
                                <h3>Doanh thu dự kiến</h3>
                                <p><span>Tổng đơn:</span> <strong>{formatCurrency(order?.totalPrice)}</strong></p>
                                <p><span>Đã thanh toán:</span> <strong>{order?.fullyPaid ? 'Có' : 'Chưa'}</strong></p>
                                <p><span>Hiện tại:</span> <strong>{formatCurrency(revenueCurrent)}</strong></p>
                                <p><span>Đã nhận:</span> <strong>{formatCurrency(completedRevenue)}</strong></p>
                                <p><span>Còn lại:</span> <strong>{formatCurrency(expectedRemain)}</strong></p>
                            </article>

                            <article className="card-box side-card">
                                <h3>Ghi chú nhanh</h3>
                                <p className="muted"><FiFileText /> Khi hoàn thành giai đoạn, vui lòng cập nhật ảnh minh chứng rõ ràng để khách hàng duyệt nhanh hơn.</p>
                            </article>
                        </aside>
                    </div>

                    {status !== 'COMPLETED' && status !== 'CANCELLED' && (
                        <section className="danger-zone">
                            <div className="danger-copy">
                                <h3>Thao tác nguy hiểm</h3>
                                <p>Hủy đơn sẽ dừng toàn bộ quy trình của đơn tùy chỉnh này.</p>
                            </div>
                            <button type="button" className="btn btn-danger" onClick={openCancelModal}>Hủy đơn</button>
                        </section>
                    )}

                    {cancelModalOpen && (
                        <div className="cancel-modal-overlay" onClick={() => setCancelModalOpen(false)} aria-hidden="true">
                            <div className="cancel-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                                <h3>Xác nhận hủy đơn</h3>
                                <p>Để xác nhận, vui lòng nhập chính xác <strong>Hủy đơn</strong> vào ô bên dưới.</p>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nhập: Hủy đơn"
                                    value={cancelConfirmText}
                                    onChange={(e) => setCancelConfirmText(e.target.value)}
                                />
                                <div className="cancel-modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setCancelModalOpen(false)} disabled={cancelling}>Đóng</button>
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={handleCancelOrder}
                                        disabled={cancelConfirmText.trim() !== 'Hủy đơn' || cancelling}
                                    >
                                        {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ArtisanOrderDetailPage;

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import { createCustomOrder, getCustomRequestDetail } from '../../services/customRequestService';
import './ArtisanQuoteCreatePage.css';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
});

const formatCurrency = (value) => `${currencyFormatter.format(Number(value || 0))} đ`;
const formatDays = (value) => `${Number(value || 0)} ngày`;

const emptyStage = () => ({ stageName: '', description: '', paymentPercentage: '', estimatedDays: '' });

const ArtisanQuoteCreatePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [request, setRequest] = useState(null);
    const [totalPrice, setTotalPrice] = useState('');
    const [stages, setStages] = useState([emptyStage(), emptyStage()]);
    const [touchedPercentages, setTouchedPercentages] = useState({});
    const [showConceptImage, setShowConceptImage] = useState(false);

    useEffect(() => {
        let ignore = false;

        const fetchDetail = async () => {
            setLoading(true);
            const res = await getCustomRequestDetail(id);
            if (ignore) return;
            setLoading(false);

            if (!res.success) {
                appToast.error('Không tải được yêu cầu', res.error || 'Vui lòng thử lại');
                return;
            }

            setRequest(res.data || null);
            if (res.data?.totalPrice) {
                setTotalPrice(String(res.data.totalPrice));
            }
        };

        fetchDetail();
        return () => {
            ignore = true;
        };
    }, [id]);

    const totalAmount = Number(totalPrice || 0);

    const calculated = useMemo(() => {
        const parsedStages = stages.map((stage) => ({
            ...stage,
            paymentPercentage: Number(stage.paymentPercentage || 0),
            estimatedDays: Number(stage.estimatedDays || 0),
        }));

        const percentageTotal = parsedStages.reduce((sum, stage) => sum + stage.paymentPercentage, 0);
        const totalDays = parsedStages.reduce((sum, stage) => sum + stage.estimatedDays, 0);
        const hasInvalidRows = parsedStages.some(
            (stage) =>
                !stage.stageName.trim() ||
                !Number.isFinite(stage.paymentPercentage) ||
                stage.paymentPercentage <= 0 ||
                !Number.isInteger(stage.estimatedDays) ||
                stage.estimatedDays <= 0,
        );

        const validPercentage = totalAmount > 0 && percentageTotal === 100;
        const progress = totalAmount > 0 ? Math.min(100, Math.max(0, percentageTotal)) : 0;

        return {
            percentageTotal,
            totalDays,
            hasInvalidRows,
            validPercentage,
            progress,
        };
    }, [stages, totalAmount]);

    const stageCount = stages.length;
    const canSave = totalAmount > 0 && calculated.validPercentage && !calculated.hasInvalidRows && !submitting;

    const onStageChange = (index, key, value) => {
        setStages((prev) =>
            prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
        );
    };

    const onAddStage = () => setStages((prev) => [...prev, emptyStage()]);
    const onRemoveStage = (index) => {
        setStages((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
    };

    const autoSplitEvenly = () => {
        if (stages.length === 0) return;
        const base = Math.floor(100 / stages.length);
        const remainder = 100 - base * stages.length;
        setStages((prev) =>
            prev.map((stage, index) => ({
                ...stage,
                paymentPercentage: String(base + (index === prev.length - 1 ? remainder : 0)),
            })),
        );
        setTouchedPercentages({});
    };

    const handleSubmit = async () => {
        if (!canSave) {
            if (totalAmount <= 0) return appToast.warning('Vui lòng nhập tổng giá lớn hơn 0');
            if (calculated.hasInvalidRows) return appToast.warning('Vui lòng nhập đầy đủ các stage');
            if (!calculated.validPercentage) return appToast.warning('Tổng phần trăm phải bằng 100%');
            return;
        }

        setSubmitting(true);

        const payload = {
            requestId: String(id),
            totalPrice: totalAmount,
            stages: stages.map((stage) => ({
                name: stage.stageName.trim(),
                description: stage.description.trim(),
                paymentPercentage: Number(stage.paymentPercentage),
                amount: Math.round((totalAmount * Number(stage.paymentPercentage || 0)) / 100),
                estimatedDays: Number(stage.estimatedDays),
            })),
        };

        const res = await createCustomOrder(payload);
        setSubmitting(false);

        if (!res.success) {
            appToast.error('Tạo custom order thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Đã tạo custom order thành công');
        navigate('/artisan/orders');
    };

    const progressClassName = calculated.validPercentage && !calculated.hasInvalidRows ? 'progress-fill is-valid' : 'progress-fill';

    if (loading) {
        return <div className="artisan-skeleton-page" />;
    }

    return (
        <div className="artisan-quote-page">
            <div className="artisan-quote-shell">
                <header className="page-hero">
                    <button type="button" className="back-link" onClick={() => navigate('/artisan/requests')}>
                        ← Quay lại danh sách yêu cầu
                    </button>

                    <div className="hero-copy">
                        <p className="eyebrow">Báo giá cho</p>
                        <h1>{request?.id || id}</h1>
                        <p className="hero-description">{request?.description || 'Không có mô tả'}</p>
                    </div>

                    <div className="hero-meta">
                        <div className="meta-card">
                            <span>Tổng phân bổ hiện tại</span>
                            <strong>{calculated.percentageTotal}%</strong>
                        </div>
                        <div className="meta-card accent">
                            <span>Phần trăm hợp lệ</span>
                            <strong>{calculated.validPercentage ? 'Có' : 'Chưa'}</strong>
                        </div>
                    </div>
                </header>

                <div className="content-grid">
                    <div className="main-stack">
                        <section className="panel request-panel">
                            <div className="panel-head">
                                <h3>Chi tiết yêu cầu</h3>
                            </div>

                            <div className="detail-grid detail-grid-horizontal">
                                <div className="detail-item detail-item-span2">
                                    <span>Mô tả</span>
                                    <strong>{request?.description || 'Không có mô tả'}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>Ngân sách tối thiểu</span>
                                    <strong>{formatCurrency(request?.minBudget)}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>Ngân sách tối đa</span>
                                    <strong>{formatCurrency(request?.maxBudget)}</strong>
                                </div>
                                <div className="detail-item detail-item-span2">
                                    <span>Ảnh ý tưởng AI</span>
                                    {request?.aiConceptImageUrl ? (
                                        <button
                                            type="button"
                                            className="concept-image-btn"
                                            onClick={() => setShowConceptImage((prev) => !prev)}
                                        >
                                            {showConceptImage ? 'Ẩn ảnh ý tưởng AI' : 'Xem ảnh ý tưởng AI'}
                                        </button>
                                    ) : (
                                        <strong>Không có ảnh</strong>
                                    )}
                                    {showConceptImage && request?.aiConceptImageUrl ? (
                                        <img src={request.aiConceptImageUrl} alt="Ảnh ý tưởng AI" className="concept-image-preview" />
                                    ) : null}
                                </div>
                                <div className="detail-item detail-item-span2">
                                    <span>Tổng giá</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={totalPrice}
                                        onChange={(e) => setTotalPrice(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="panel distribution-panel">
                            <div className="panel-head">
                                <h3>Phân bổ thanh toán</h3>
                            </div>

                            <div className="progress-shell" aria-label="Tiến độ phân bổ thanh toán">
                                <div className={progressClassName} style={{ width: `${calculated.progress}%` }} />
                            </div>
                            <div className="distribution-row">
                                <strong>{calculated.percentageTotal}%</strong>
                                {!calculated.validPercentage ? (
                                    <span className="warning-text">⚠ Tổng phải bằng 100%</span>
                                ) : (
                                    <span className="success-text">Phân bổ hợp lệ</span>
                                )}
                            </div>
                        </section>

                        <section className="panel stages-panel">
                            <div className="panel-head panel-head-actions">
                                <div>
                                    <h3>Các giai đoạn</h3>
                                    <p>Dùng bảng nhập nhanh để thao tác gọn và rõ hơn.</p>
                                </div>
                                <button type="button" className="secondary-btn" onClick={autoSplitEvenly}>
                                    Chia đều tự động
                                </button>
                            </div>

                            <div className="table-wrap">
                                <div className="stages-table">
                                    <div className="table-row table-header">
                                        <span>Giai đoạn</span>
                                        <span>Tên</span>
                                        <span>Mô tả</span>
                                        <span>%</span>
                                        <span>Số ngày</span>
                                        <span>Thao tác</span>
                                    </div>

                                    {stages.map((stage, index) => {
                                        const percentageValue = Number(stage.paymentPercentage || 0);
                                        const dayValue = Number(stage.estimatedDays || 0);
                                        const percentInvalid = touchedPercentages[index] && (percentageValue <= 0 || percentageValue > 100);
                                        const rowInvalid = !stage.stageName.trim() || percentageValue <= 0 || dayValue <= 0;

                                        return (
                                            <div key={`stage-${index}`} className={`table-row stage-row ${rowInvalid ? 'row-invalid' : ''}`}>
                                                <div className="stage-badge">{index + 1}</div>
                                                <input
                                                    className="cell-input"
                                                    type="text"
                                                    placeholder="Thiết kế giao diện"
                                                    value={stage.stageName}
                                                    onChange={(e) => onStageChange(index, 'stageName', e.target.value)}
                                                />
                                                <input
                                                    className="cell-input"
                                                    type="text"
                                                    placeholder="Thiết kế các màn hình chính"
                                                    value={stage.description}
                                                    onChange={(e) => onStageChange(index, 'description', e.target.value)}
                                                />
                                                <input
                                                    className={`cell-input number-input ${percentInvalid ? 'input-error' : ''}`}
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="1"
                                                    value={stage.paymentPercentage}
                                                    onChange={(e) => {
                                                        setTouchedPercentages((prev) => ({ ...prev, [index]: true }));
                                                        onStageChange(index, 'paymentPercentage', e.target.value);
                                                    }}
                                                />
                                                <input
                                                    className="cell-input number-input"
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={stage.estimatedDays}
                                                    onChange={(e) => onStageChange(index, 'estimatedDays', e.target.value)}
                                                />
                                                <button type="button" className="icon-btn danger" onClick={() => onRemoveStage(index)}>
                                                    Delete
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button type="button" className="add-stage-btn" onClick={onAddStage}>
                                + Thêm giai đoạn
                            </button>
                        </section>

                        <div className="actions-row">
                            <button type="button" className="secondary-btn" onClick={() => navigate('/artisan/requests')}>
                                Hủy
                            </button>
                            <button type="button" className="primary-btn" disabled={!canSave} onClick={handleSubmit}>
                                {submitting ? 'Đang lưu...' : 'Lưu yêu cầu'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtisanQuoteCreatePage;

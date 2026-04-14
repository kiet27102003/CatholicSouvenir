import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import { createQuotation, getCustomRequestDetail } from '../../services/customRequestService';
import './ArtisanQuoteCreatePage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const emptyStage = () => ({ stageName: '', price: '', estimatedDays: '' });

const ArtisanQuoteCreatePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [request, setRequest] = useState(null);

    const [totalPrice, setTotalPrice] = useState('');
    const [estimatedDays, setEstimatedDays] = useState('');
    const [description, setDescription] = useState('');
    const [stages, setStages] = useState([emptyStage()]);

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
        };
        fetchDetail();

        return () => {
            ignore = true;
        };
    }, [id]);

    const stageTotal = useMemo(
        () => stages.reduce((sum, stage) => sum + Number(stage.price || 0), 0),
        [stages],
    );
    const targetTotal = Number(totalPrice || 0);
    const diff = targetTotal - stageTotal;
    const isMatch = targetTotal > 0 && diff === 0;

    const onStageChange = (index, key, value) => {
        setStages((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
    };

    const onAddStage = () => setStages((prev) => [...prev, emptyStage()]);
    const onRemoveStage = (index) => {
        setStages((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
    };

    const handleSubmit = async () => {
        if (submitting) return;

        const total = Number(totalPrice);
        const days = Number(estimatedDays);

        if (!total || total <= 0) return appToast.warning('Giá báo phải lớn hơn 0');
        if (!Number.isInteger(days) || days <= 0) return appToast.warning('Số ngày dự kiến phải là số nguyên > 0');
        if (!Array.isArray(stages) || stages.length === 0) return appToast.warning('Cần ít nhất 1 giai đoạn');

        const hasInvalid = stages.some((stage) => !stage.stageName.trim() || Number(stage.price) <= 0 || !Number.isInteger(Number(stage.estimatedDays)) || Number(stage.estimatedDays) <= 0);
        if (hasInvalid) return appToast.warning('Vui lòng nhập đầy đủ và hợp lệ cho từng giai đoạn');
        if (!isMatch) return appToast.warning('Tổng giá các giai đoạn chưa khớp tổng báo giá');

        setSubmitting(true);
        const stageAmounts = stages.map((stage) => Number(stage.price));
        const percentages = stageAmounts.map((amount) => Math.round((amount / total) * 100));
        const percentageSum = percentages.reduce((sum, value) => sum + value, 0);
        if (percentages.length > 0 && percentageSum !== 100) {
            const lastIndex = percentages.length - 1;
            percentages[lastIndex] += 100 - percentageSum;
        }

        const payload = {
            requestId: String(id),
            totalPrice: total,
            stages: stages.map((stage, index) => ({
                name: stage.stageName.trim(),
                description: String(description || '').trim(),
                paymentPercentage: percentages[index],
                amount: Number(stage.price),
                estimatedDays: Number(stage.estimatedDays),
            })),
        };

        const res = await createQuotation(payload);
        setSubmitting(false);

        if (!res.success) {
            appToast.error('Gửi báo giá thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Đã gửi báo giá thành công');
        navigate('/artisan/requests');
    };

    if (loading) {
        return <div className="artisan-skeleton-page" />;
    }

    return (
        <div className="artisan-quote-page">
            <header className="artisan-quote-header">
                <button type="button" className="btn btn-outline" onClick={() => navigate('/artisan/requests')}>← Quay lại</button>
                <h1>Báo giá: {String(request?.description || 'Yêu cầu').slice(0, 60)}</h1>
            </header>

            <div className="artisan-quote-grid">
                <section className="left-col">
                    <article className="card-box">
                        <h3>Thông tin báo giá</h3>
                        <label>
                            Tổng giá báo
                            <input type="number" min="1" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} />
                        </label>
                        <label>
                            Số ngày dự kiến
                            <input type="number" min="1" step="1" value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} />
                        </label>
                        <label>
                            Mô tả
                            <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </label>
                    </article>

                    <article className="card-box">
                        <h3>Các giai đoạn</h3>
                        {stages.map((stage, index) => (
                            <div key={`stage-${index}`} className="stage-row">
                                <input
                                    type="text"
                                    placeholder="Tên giai đoạn"
                                    value={stage.stageName}
                                    onChange={(e) => onStageChange(index, 'stageName', e.target.value)}
                                />
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Giá"
                                    value={stage.price}
                                    onChange={(e) => onStageChange(index, 'price', e.target.value)}
                                />
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Số ngày"
                                    value={stage.estimatedDays}
                                    onChange={(e) => onStageChange(index, 'estimatedDays', e.target.value)}
                                />
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => onRemoveStage(index)}>✕</button>
                            </div>
                        ))}

                        <button type="button" className="btn btn-outline" onClick={onAddStage}>+ Thêm giai đoạn</button>
                        <div className={`stage-total ${isMatch ? 'ok' : 'warn'}`}>
                            Tổng stages: {formatCurrency(stageTotal)} — {isMatch ? 'Khớp ✓' : `Chênh ${formatCurrency(Math.abs(diff))} ⚠`}
                        </div>
                    </article>
                </section>

                <aside className="right-col">
                    <article className="card-box">
                        <h3>Tóm tắt yêu cầu</h3>
                        <p>{request?.description || '—'}</p>
                        <p>Ngân sách: {formatCurrency(request?.minBudget)} - {formatCurrency(request?.maxBudget)}</p>
                    </article>
                    <article className="card-box">
                        <h3>Tổng stages</h3>
                        <p>{formatCurrency(stageTotal)}</p>
                        <button type="button" className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
                            {submitting ? 'Đang gửi...' : 'Gửi báo giá'}
                        </button>
                    </article>
                </aside>
            </div>
        </div>
    );
};

export default ArtisanQuoteCreatePage;

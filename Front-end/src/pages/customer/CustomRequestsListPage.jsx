import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import {
    getCustomerCustomRequests,
    publishCustomRequest,
    regenerateCustomRequestImage,
} from '../../services/customRequestService';
import './CustomRequestsListPage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const formatDateTime = (value) => {
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

const truncate = (value, maxLength) => {
    const text = String(value || '').trim();
    if (!text) return 'Yêu cầu đặt làm riêng';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const getRequestId = (item) => item?.requestId ?? item?.id ?? item?.customRequestId;

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

const tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'DRAFT', label: 'Bản nháp' },
    { key: 'OPEN', label: 'Đang mở' },
    { key: 'IN_PROGRESS', label: 'Đang thực hiện' },
    { key: 'COMPLETED', label: 'Hoàn thành' },
];

const CustomRequestsListPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('ALL');
    const [publishingId, setPublishingId] = useState('');
    const [regeneratingId, setRegeneratingId] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        const res = await getCustomerCustomRequests();
        setLoading(false);

        if (!res.success) {
            setRequests([]);
            appToast.error('Không tải được yêu cầu', res.error || 'Vui lòng thử lại');
            return;
        }

        setRequests(Array.isArray(res.data) ? res.data : []);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const filteredRequests = useMemo(() => {
        if (activeTab === 'ALL') return requests;
        return requests.filter((item) => String(item?.status || '').toUpperCase() === activeTab);
    }, [activeTab, requests]);

    const handlePublish = async (requestId) => {
        if (!requestId || publishingId) return;
        setPublishingId(String(requestId));
        const res = await publishCustomRequest(requestId);
        setPublishingId('');

        if (!res.success) {
            appToast.error('Publish thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Publish thành công');
        fetchRequests();
    };

    const handleRegenerate = async (requestId) => {
        if (!requestId || regeneratingId) return;
        setRegeneratingId(String(requestId));

        const res = await regenerateCustomRequestImage(requestId);
        setRegeneratingId('');

        if (!res.success) {
            appToast.error('Tạo lại ảnh thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        const newUrl = typeof res.data === 'string' ? res.data : '';
        if (newUrl) {
            setRequests((prev) => prev.map((item) => {
                const id = String(getRequestId(item));
                if (id !== String(requestId)) return item;
                return {
                    ...item,
                    aiGeneratedImageUrl: newUrl,
                };
            }));
        } else {
            fetchRequests();
        }

        appToast.success('Đã tạo lại ảnh AI');
    };

    return (
        <div className="custom-requests-list-page">
            <div className="custom-requests-list-header">
                <div>
                    <h1>Yêu cầu đặt làm riêng</h1>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/custom-requests/new')}>
                    + Tạo yêu cầu mới
                </button>
            </div>

            <div className="custom-requests-tabs" role="tablist" aria-label="Lọc trạng thái yêu cầu">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        className={`custom-requests-tab ${activeTab === tab.key ? 'active' : ''}`}
                        aria-selected={activeTab === tab.key}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="custom-requests-loading-grid">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="custom-requests-card-skeleton" />
                    ))}
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="custom-requests-empty">
                    <div className="custom-requests-empty-icon">◌</div>
                    <h3>Chưa có yêu cầu nào</h3>
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/custom-requests/new')}>
                        Tạo yêu cầu đầu tiên
                    </button>
                </div>
            ) : (
                <div className="custom-requests-list-grid">
                    {filteredRequests.map((item) => {
                        const requestId = getRequestId(item);
                        const status = String(item?.status || '').toUpperCase();
                        const statusMeta = getStatusMeta(status);
                        const aiImageUrl = item?.aiGeneratedImageUrl || item?.aiImageUrl || item?.generatedImageUrl || '';
                        const artisanName = item?.artisan?.artisanName || item?.confirmedArtisan?.artisanName || item?.selectedArtisan?.artisanName || '';

                        return (
                            <article key={String(requestId)} className="custom-requests-card">
                                <header className="custom-requests-card-header">
                                    <div>
                                        <h3>{truncate(item?.description, 50)}</h3>
                                        <p>
                                            {formatDateTime(item?.createdAt)} · {formatCurrency(item?.minBudget)} - {formatCurrency(item?.maxBudget)}
                                        </p>
                                    </div>
                                    <span className={`custom-requests-status ${statusMeta.className}`}>{statusMeta.label}</span>
                                </header>

                                <div className="custom-requests-card-body">
                                    <p>{truncate(item?.description, 200)}</p>
                                    {aiImageUrl ? (
                                        <img src={aiImageUrl} alt="Ảnh AI" className="custom-requests-ai-thumb" />
                                    ) : null}

                                    {status === 'DRAFT' && aiImageUrl && (
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            disabled={regeneratingId === String(requestId)}
                                            onClick={() => handleRegenerate(requestId)}
                                        >
                                            {regeneratingId === String(requestId) ? 'Đang tạo...' : '↻ Tạo lại ảnh AI'}
                                        </button>
                                    )}
                                </div>

                                <footer className="custom-requests-card-footer">
                                    <span>{artisanName || 'Chưa có nghệ nhân'}</span>
                                    <div className="custom-requests-card-actions">
                                        {status === 'IN_PROGRESS' && (
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-sm"
                                                onClick={() => navigate(`/custom-requests/${requestId}#stages`)}
                                            >
                                                Xem tiến độ
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={() => navigate(`/custom-requests/${requestId}`)}
                                        >
                                            Chi tiết
                                        </button>
                                        {status === 'DRAFT' && (
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                disabled={publishingId === String(requestId)}
                                                onClick={() => handlePublish(requestId)}
                                            >
                                                {publishingId === String(requestId) ? 'Đang publish...' : 'Publish →'}
                                            </button>
                                        )}
                                    </div>
                                </footer>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CustomRequestsListPage;

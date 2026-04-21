import React, { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiClock, FiEdit3, FiEye, FiFilter, FiImage, FiLayers, FiPlus, FiRefreshCw, FiSearch, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { appToast } from '../../lib/appToast';
import { getCustomerCustomRequests, publishCustomRequest, regenerateCustomRequestImage } from '../../services/customRequestService';
import './CustomRequestsManagePage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const truncate = (value, maxLength) => {
    const text = String(value || '').trim();
    if (!text) return 'Yêu cầu đặt làm riêng';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

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

const getRequestId = (item) => item?.requestId ?? item?.id ?? item?.customRequestId ?? null;

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

const CustomRequestsManagePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('ALL');
    const [publishingId, setPublishingId] = useState('');
    const [regeneratingId, setRegeneratingId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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
        const load = async () => {
            await fetchRequests();
        };

        load();
    }, []);

    const filteredRequests = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return requests.filter((item) => {
            const status = String(item?.status || '').toUpperCase();
            const matchesTab = activeTab === 'ALL' || status === activeTab;
            const haystack = [item?.title, item?.description, item?.artisan?.artisanName, item?.confirmedArtisan?.artisanName, item?.selectedArtisan?.artisanName].join(' ').toLowerCase();
            return matchesTab && (!term || haystack.includes(term));
        });
    }, [activeTab, requests, searchTerm]);

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
            setRequests((prev) => prev.map((item) => (String(getRequestId(item)) === String(requestId) ? { ...item, aiGeneratedImageUrl: newUrl } : item)));
        } else {
            fetchRequests();
        }

        appToast.success('Đã tạo lại ảnh AI');
    };

    const totalCount = requests.length;
    const draftCount = requests.filter((item) => String(item?.status || '').toUpperCase() === 'DRAFT').length;
    const openCount = requests.filter((item) => String(item?.status || '').toUpperCase() === 'OPEN').length;
    const progressCount = requests.filter((item) => String(item?.status || '').toUpperCase() === 'IN_PROGRESS').length;

    return (
        <div className="custom-requests-manage-page">
            <Header />
            <main className="custom-requests-manage-main">
                <section className="manage-hero">
                    <div className="manage-hero-copy">
                        <div className="manage-badge-row">
                            <button type="button" className="btn btn-outline manage-back-btn" onClick={() => navigate('/custom-order')}>
                                <FiArrowLeft /> Quay lại đặt hàng riêng
                            </button>
                        </div>
                        <h1>Toàn bộ yêu cầu đặt riêng của bạn trong một nơi</h1>
                        <p>Theo dõi bản nháp, yêu cầu đang mở, tiến độ thực hiện và cập nhật ảnh AI ngay trên một màn hình quản lý riêng.</p>
                        <div className="manage-hero-actions">
                            <button type="button" className="btn btn-primary" onClick={() => navigate('/custom-order')}>
                                <FiPlus /> Tạo yêu cầu mới
                            </button>
                            <button type="button" className="btn btn-outline" onClick={fetchRequests}>
                                <FiRefreshCw /> Làm mới
                            </button>
                        </div>
                        <div className="manage-summary-grid">
                            <div className="summary-card"><FiLayers /><strong>{totalCount}</strong><span>Tổng yêu cầu</span></div>
                            <div className="summary-card"><FiEdit3 /><strong>{draftCount}</strong><span>Bản nháp</span></div>
                            <div className="summary-card"><FiClock /><strong>{openCount}</strong><span>Đang mở</span></div>
                            <div className="summary-card"><FiShield /><strong>{progressCount}</strong><span>Đang thực hiện</span></div>
                        </div>
                    </div>
                    <div className="manage-hero-panel">
                        <div className="panel-card">
                            <div className="panel-card-icon"><FiImage /></div>
                            <h3>Tạo, sửa, publish</h3>
                            <p>Quản lý bản nháp và ảnh AI mà không cần rời khỏi trang.</p>
                        </div>
                        <div className="panel-card muted">
                            <div className="panel-card-icon"><FiEye /></div>
                            <h3>Xem chi tiết trên trang riêng</h3>
                            <p>Bấm vào từng thẻ để mở trang chi tiết, theo dõi tiến độ và trao đổi tiếp.</p>
                        </div>
                    </div>
                </section>

                <section className="manage-toolbar">
                    <div className="manage-toolbar-top">
                        <div>
                            <h2>Danh sách yêu cầu</h2>
                            <p>Chọn tab để lọc theo trạng thái hoặc tìm nhanh theo tiêu đề/nội dung.</p>
                        </div>
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/custom-order')}>
                            Tạo yêu cầu mới
                        </button>
                    </div>
                    <div className="manage-search-row">
                        <div className="manage-search-box">
                            <FiSearch />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm theo tiêu đề, mô tả, nghệ nhân..."
                                aria-label="Tìm kiếm custom request"
                            />
                        </div>
                        <button type="button" className="btn btn-outline manage-filter-button" onClick={() => setActiveTab('ALL')}>
                            <FiFilter /> Bỏ lọc
                        </button>
                    </div>
                    <div className="manage-tabs" role="tablist" aria-label="Lọc trạng thái yêu cầu">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                className={`manage-tab ${activeTab === tab.key ? 'active' : ''}`}
                                aria-selected={activeTab === tab.key}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </section>

                {loading ? (
                    <div className="manage-loading-grid">
                        {[1, 2, 3].map((item) => <div key={item} className="manage-card-skeleton" />)}
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="manage-empty">
                        <div className="manage-empty-icon">◌</div>
                        <h3>Chưa có yêu cầu nào</h3>
                        <p>Hãy tạo yêu cầu đầu tiên ở trang đặt hàng riêng.</p>
                        <button type="button" className="btn btn-primary" onClick={() => navigate('/custom-order')}>
                            Tạo yêu cầu đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="manage-list-grid">
                        {filteredRequests.map((item) => {
                            const requestId = getRequestId(item);
                            const status = String(item?.status || '').toUpperCase();
                            const statusMeta = getStatusMeta(status);
                            const aiImageUrl = item?.aiGeneratedImageUrl || item?.aiImageUrl || item?.generatedImageUrl || '';
                            const artisanName = item?.artisan?.artisanName || item?.confirmedArtisan?.artisanName || item?.selectedArtisan?.artisanName || '';

                            return (
                                <article key={String(requestId)} className="manage-card">
                                    <header className="manage-card-header">
                                        <div>
                                            <h3>{truncate(item?.description, 50)}</h3>
                                            <p>{formatDateTime(item?.createdAt)} · {formatCurrency(item?.minBudget)} - {formatCurrency(item?.maxBudget)}</p>
                                        </div>
                                        <span className={`manage-status ${statusMeta.className}`}>{statusMeta.label}</span>
                                    </header>

                                    <div className="manage-card-body">
                                        <p>{truncate(item?.description, 200)}</p>
                                        {aiImageUrl ? <img src={aiImageUrl} alt="Ảnh AI" className="manage-ai-thumb" /> : null}

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

                                    <footer className="manage-card-footer">
                                        <span className="manage-card-meta">{artisanName || 'Chưa có nghệ nhân'}</span>
                                        <div className="manage-card-actions">
                                            {status === 'IN_PROGRESS' && (
                                                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(`/custom-requests/${requestId}#stages`)}>
                                                    Xem tiến độ
                                                </button>
                                            )}
                                            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(`/custom-requests/${requestId}`)}>
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
            </main>
        </div>
    );
};

export default CustomRequestsManagePage;

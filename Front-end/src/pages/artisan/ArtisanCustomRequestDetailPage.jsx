import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiCheckCircle, FiClock, FiMessageSquare, FiUser } from 'react-icons/fi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import { getConversationsByRequest, startConversation } from '../../services/chatService';
import { getCustomRequestDetail, selectCustomRequestArtisan } from '../../services/customRequestService';
import Sidebar from './components/Sidebar';
import './ArtisanDashboard.css';
import './ArtisanCustomRequestDetailPage.css';

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

const getStatusLabel = (status) => {
    const s = String(status || '').toUpperCase();
    return ({
        OPEN: 'Đang mở',
        ARTISAN_SELECTED: 'Đã chọn nghệ nhân',
        IN_PROGRESS: 'Đang thực hiện',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã huỷ',
        CLOSED: 'Đã đóng',
    }[s]) || s || 'Không xác định';
};

const getViewFromPath = (pathname) => {
    if (pathname === '/artisan/profile') return 'profile';
    if (pathname === '/artisan/templates') return 'templates';
    if (pathname === '/artisan/portfolio') return 'portfolio';
    if (pathname === '/artisan/requests') return 'requests';
    if (/^\/artisan\/requests\/[^/]+\/custom-order$/.test(pathname)) return 'customOrderCreate';
    if (pathname === '/artisan/orders') return 'customOrders';
    if (pathname === '/artisan/ready-orders') return 'readyOrders';
    if (pathname === '/artisan/complaints') return 'complaints';
    if (pathname === '/artisan/wallet') return 'wallet';
    if (pathname === '/artisan/shipments') return 'shipments';
    if (pathname === '/artisan/messages') return 'messages';
    return 'dashboard';
};

const viewToPath = (view) => {
    if (view === 'profile') return '/artisan/profile';
    if (view === 'templates') return '/artisan/templates';
    if (view === 'portfolio') return '/artisan/portfolio';
    if (view === 'requests') return '/artisan/requests';
    if (view === 'customOrders') return '/artisan/orders';
    if (view === 'readyOrders') return '/artisan/ready-orders';
    if (view === 'complaints') return '/artisan/complaints';
    if (view === 'wallet') return '/artisan/wallet';
    if (view === 'shipments') return '/artisan/shipments';
    if (view === 'messages') return '/artisan/messages';
    return '/artisan';
};

const ArtisanCustomRequestDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [conversationId, setConversationId] = useState('');
    const [startingChat, setStartingChat] = useState(false);
    const [selecting, setSelecting] = useState(false);
    const [previewImage, setPreviewImage] = useState('');

    const requestStatus = String(request?.status || '').toUpperCase();
    const activeView = getViewFromPath(location.pathname);

    const load = useCallback(async () => {
        setLoading(true);
        const [detailRes, convoRes] = await Promise.all([
            getCustomRequestDetail(id),
            getConversationsByRequest(id),
        ]);
        setLoading(false);

        if (!detailRes.success) {
            appToast.error('Không tải được chi tiết yêu cầu', detailRes.error || 'Vui lòng thử lại');
            return;
        }

        setRequest(detailRes.data || null);
        if (convoRes.success) {
            const firstConversation = Array.isArray(convoRes.data) ? convoRes.data[0] : convoRes.data;
            setConversationId(firstConversation?.id ?? firstConversation?.conversationId ?? '');
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const handleChangeView = useCallback((view) => {
        const nextPath = viewToPath(view);
        if (location.pathname !== nextPath) navigate(nextPath);
    }, [location.pathname, navigate]);

    const handleChat = useCallback(async () => {
        if (conversationId) {
            navigate(`/artisan/messages?conversationId=${conversationId}`);
            return;
        }

        setStartingChat(true);
        const res = await startConversation(id);
        setStartingChat(false);

        if (!res.success) {
            appToast.error('Không thể bắt đầu trò chuyện', res.error || 'Vui lòng thử lại');
            return;
        }

        const nextConversationId = res?.data?.id ?? res?.data?.conversationId;
        if (nextConversationId) navigate(`/artisan/messages?conversationId=${nextConversationId}`);
    }, [conversationId, id, navigate]);

    const handleAccept = useCallback(async () => {
        const artisanId = user?.id;
        if (!artisanId) {
            appToast.error('Không tìm thấy thông tin nghệ nhân');
            return;
        }

        setSelecting(true);
        const res = await selectCustomRequestArtisan(id, artisanId);
        setSelecting(false);

        if (!res.success) {
            appToast.error('Không thể nhận đơn', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Đã nhận đơn thành công');
        load();
    }, [id, load, user?.id]);

    const description = useMemo(() => String(request?.description || '').trim(), [request]);
    const references = useMemo(() => (Array.isArray(request?.referenceImages) ? request.referenceImages.slice(0, 6) : []), [request]);
    const conceptImageUrl = request?.aiConceptImageUrl || request?.aiGeneratedImageUrl || request?.aiImageUrl || request?.generatedImageUrl || '';

    if (!user || String(user.role || '').toUpperCase() !== 'ARTISAN') return null;

    return (
        <div className="artisan-dashboard">
            <Sidebar
                user={user}
                activeView={activeView}
                setActiveView={handleChangeView}
                onLogout={logout}
            />
            <main className="artisan-main">
                <div className="artisan-main-inner">
                    {loading ? (
                        <div className="artisan-custom-request-detail loading">Đang tải chi tiết...</div>
                    ) : !request ? (
                        <div className="artisan-custom-request-detail empty">Không tìm thấy yêu cầu.</div>
                    ) : (
                        <div className="artisan-custom-request-detail">
                            <div className="artisan-detail-topbar">
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/artisan/requests')}>
                                    <FiArrowLeft /> Quay lại
                                </button>
                                <span className="detail-status-badge">{getStatusLabel(requestStatus)}</span>
                            </div>

                            <section className="detail-hero-card">
                                <div className="detail-hero-main">
                                    <p className="detail-eyebrow">Yêu cầu đặt làm riêng</p>
                                    <h1>{request?.title || 'Yêu cầu chưa có tiêu đề'}</h1>
                                    <p className="detail-description">{description || '—'}</p>
                                </div>
                                <div className="detail-hero-actions">
                                    <button type="button" className="btn btn-primary" onClick={handleChat} disabled={startingChat}>
                                        <FiMessageSquare /> {startingChat ? 'Đang mở chat...' : 'Nhắn tin'}
                                    </button>
                                </div>
                            </section>

                            <section className="detail-grid">
                                <article className="detail-card">
                                    <h2>Thông tin chính</h2>
                                    <div className="detail-meta-list">
                                        <div><FiUser /> <span>Khách hàng</span><strong>{request?.customerName || request?.customer?.fullName || '—'}</strong></div>
                                        <div><FiClock /> <span>Ngày tạo</span><strong>{formatDate(request?.createdAt)}</strong></div>
                                        <div><FiCheckCircle /> <span>Trạng thái</span><strong>{getStatusLabel(requestStatus)}</strong></div>
                                        <div><FiClock /> <span>Ngân sách</span><strong>{formatCurrency(request?.minBudget)} – {formatCurrency(request?.maxBudget)}</strong></div>
                                    </div>
                                </article>

                                <article className="detail-card">
                                    <h2>Ảnh tham khảo</h2>
                                    <div className="detail-images">
                                        {conceptImageUrl ? (
                                            <button type="button" className="image-preview-trigger" onClick={() => setPreviewImage(conceptImageUrl)}>
                                                <img src={conceptImageUrl} alt="AI concept" />
                                            </button>
                                        ) : null}
                                        {references.map((url) => (
                                            <button key={url} type="button" className="image-preview-trigger" onClick={() => setPreviewImage(url)}>
                                                <img src={url} alt="reference" />
                                            </button>
                                        ))}
                                    </div>
                                </article>
                            </section>

                            {previewImage ? (
                                <div className="image-modal-backdrop" role="presentation" onClick={() => setPreviewImage('')}>
                                    <div className="image-modal" role="dialog" aria-modal="true" aria-label="Phóng to ảnh" onClick={(e) => e.stopPropagation()}>
                                        <button type="button" className="image-modal-close" onClick={() => setPreviewImage('')}>×</button>
                                        <img src={previewImage} alt="preview" />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ArtisanCustomRequestDetailPage;

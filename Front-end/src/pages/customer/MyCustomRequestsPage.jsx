import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyCustomRequests, getCustomRequestById } from '../../services/orderService';
import { appToast } from '../../lib/appToast';
import './MyCustomRequestsPage.css';

const getStatusLabel = (status) => {
    const s = (status || '').toUpperCase();
    const map = {
        PENDING: 'Chờ xử lý',
        ARTISAN_SELECTED: 'Đã chọn nghệ nhân',
        IN_PROGRESS: 'Đang thực hiện',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã hủy',
    };
    return map[s] || status || '—';
};

const getStatusStyle = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
        case 'COMPLETED':
            return 'status-completed';
        case 'ARTISAN_SELECTED':
        case 'IN_PROGRESS':
            return 'status-in-progress';
        case 'PENDING':
            return 'status-pending';
        case 'CANCELLED':
            return 'status-cancelled';
        default:
            return '';
    }
};

const formatDate = (iso) => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
};

const getRequestId = (req) => req?.requestId ?? req?.id ?? req?.customRequestId ?? null;

const MyCustomRequestsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listLoadOk, setListLoadOk] = useState(true);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailRequest, setDetailRequest] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const openDetailModal = async (requestId) => {
        setDetailModalOpen(true);
        setDetailRequest(null);
        setDetailLoading(true);
        const result = await getCustomRequestById(requestId);
        setDetailLoading(false);
        if (result.success) {
            setDetailRequest(result.data);
        } else {
            const msg = result.error != null ? String(result.error) : 'Vui lòng thử lại';
            appToast.error('Không tải được', msg);
            setDetailModalOpen(false);
        }
    };

    const closeDetailModal = () => {
        setDetailModalOpen(false);
        setDetailRequest(null);
    };

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        getMyCustomRequests()
            .then((res) => {
                if (cancelled) return;
                if (res.success && Array.isArray(res.data)) {
                    setRequests(res.data);
                    setListLoadOk(true);
                } else {
                    setRequests([]);
                    setListLoadOk(false);
                    const msg = res.error != null ? String(res.error) : 'Kiểm tra kết nối mạng';
                    appToast.error('Không tải được', msg);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setRequests([]);
                    setListLoadOk(false);
                    appToast.error('Không tải được', 'Kiểm tra kết nối mạng');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [user?.id]);

    return (
        <div className="my-custom-requests-page">
            <div className="my-requests-header">
                <h1 className="my-requests-title">Quản lý yêu cầu</h1>
                <p className="my-requests-subtitle">Xem và theo dõi các yêu cầu đặt hàng theo ý của bạn.</p>
                <Link to="/custom-requests" className="btn btn-primary btn-new-request">
                    Tạo yêu cầu mới
                </Link>
            </div>

            {loading ? (
                <div className="my-requests-loading">
                    <div className="spinner"></div>
                    <p>Đang tải danh sách yêu cầu...</p>
                </div>
            ) : requests.length === 0 && !listLoadOk ? (
                <div className="my-requests-empty">
                    <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                        Thử lại
                    </button>
                </div>
            ) : requests.length === 0 ? (
                <div className="my-requests-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <h3>Chưa có yêu cầu nào</h3>
                    <p>Bạn có thể tạo yêu cầu đặt hàng theo ý để nghệ nhân báo giá.</p>
                    <Link to="/custom-requests" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        Tạo yêu cầu theo ý
                    </Link>
                </div>
            ) : (
                <div className="my-requests-list">
                    {requests.map((req) => (
                        <div key={req.requestId} className="my-request-card">
                            <div className="my-request-card-header">
                                <div className="my-request-meta">
                                    <h3 className="my-request-title">{req.title || 'Không có tiêu đề'}</h3>
                                    <div className="my-request-date">
                                        Tạo lúc {formatDate(req.createdAt)}
                                    </div>
                                </div>
                                <div className={`my-request-status ${getStatusStyle(req.status)}`}>
                                    {getStatusLabel(req.status)}
                                </div>
                            </div>

                            {req.description && (
                                <div className="my-request-description">
                                    <span className="label">Mô tả:</span> {req.description}
                                </div>
                            )}

                            <div className="my-request-images">
                                {(req.referenceImageUrl || req.aiGeneratedImageUrl) && (
                                    <div className="my-request-image-row">
                                        {req.referenceImageUrl && (
                                            <div className="my-request-image-wrap">
                                                <span className="image-label">Ảnh tham khảo</span>
                                                <img src={req.referenceImageUrl} alt="Tham khảo" className="my-request-thumb" />
                                            </div>
                                        )}
                                        {req.aiGeneratedImageUrl && (
                                            <div className="my-request-image-wrap">
                                                <span className="image-label">Ảnh AI</span>
                                                <img src={req.aiGeneratedImageUrl} alt="AI gợi ý" className="my-request-thumb" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {req.confirmedArtisan && (
                                <div className="my-request-confirmed">
                                    <span className="label">Nghệ nhân phụ trách:</span>{' '}
                                    {req.confirmedArtisan.artisanName}
                                    {req.confirmedArtisan.specialization && ` — ${req.confirmedArtisan.specialization}`}
                                </div>
                            )}

                            {(req.selectedArtisans && req.selectedArtisans.length > 0) && !req.confirmedArtisan && (
                                <div className="my-request-artisans">
                                    <span className="label">Nghệ nhân đã chọn:</span>{' '}
                                    {req.selectedArtisans.map((a) => a.artisanName).join(', ')}
                                </div>
                            )}

                            <div className="my-request-footer">
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => openDetailModal(req.requestId)}>
                                    Xem chi tiết
                                </button>
                                <Link to="/messages" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
                                    Nhắn tin
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {detailModalOpen && (
                <div className="my-request-detail-overlay" onClick={closeDetailModal} role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
                    <div className="my-request-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="my-request-detail-header">
                            <h2 id="detail-modal-title">Chi tiết yêu cầu</h2>
                            <button type="button" className="my-request-detail-close" onClick={closeDetailModal} aria-label="Đóng">×</button>
                        </div>
                        <div className="my-request-detail-body">
                            {detailLoading && (
                                <div className="my-request-detail-loading">
                                    <div className="spinner"></div>
                                    <p>Đang tải...</p>
                                </div>
                            )}
                            {!detailLoading && detailRequest && (
                                <>
                                    <div className="my-request-detail-row">
                                        <span className="detail-label">Tiêu đề</span>
                                        <span className="detail-value">{detailRequest.title || '—'}</span>
                                    </div>
                                    <div className="my-request-detail-row">
                                        <span className="detail-label">Trạng thái</span>
                                        <span className={`detail-value my-request-status ${getStatusStyle(detailRequest.status)}`}>
                                            {getStatusLabel(detailRequest.status)}
                                        </span>
                                    </div>
                                    <div className="my-request-detail-row">
                                        <span className="detail-label">Người yêu cầu</span>
                                        <span className="detail-value">{detailRequest.customerName || '—'}</span>
                                    </div>
                                    <div className="my-request-detail-row">
                                        <span className="detail-label">Tạo lúc</span>
                                        <span className="detail-value">{formatDate(detailRequest.createdAt)}</span>
                                    </div>
                                    <div className="my-request-detail-row">
                                        <span className="detail-label">Cập nhật</span>
                                        <span className="detail-value">{formatDate(detailRequest.updatedAt)}</span>
                                    </div>
                                    {detailRequest.description && (
                                        <div className="my-request-detail-row my-request-detail-desc">
                                            <span className="detail-label">Mô tả</span>
                                            <span className="detail-value">{detailRequest.description}</span>
                                        </div>
                                    )}
                                    {(detailRequest.referenceImageUrl || detailRequest.aiGeneratedImageUrl) && (
                                        <div className="my-request-detail-images">
                                            <span className="detail-label">Hình ảnh</span>
                                            <div className="my-request-detail-image-row">
                                                {detailRequest.referenceImageUrl && (
                                                    <div className="my-request-detail-image-wrap">
                                                        <span className="image-label">Ảnh tham khảo</span>
                                                        <img src={detailRequest.referenceImageUrl} alt="Tham khảo" />
                                                    </div>
                                                )}
                                                {detailRequest.aiGeneratedImageUrl && (
                                                    <div className="my-request-detail-image-wrap">
                                                        <span className="image-label">Ảnh AI gợi ý</span>
                                                        <img src={detailRequest.aiGeneratedImageUrl} alt="AI gợi ý" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {detailRequest.confirmedArtisan && (
                                        <div className="my-request-detail-row">
                                            <span className="detail-label">Nghệ nhân phụ trách</span>
                                            <span className="detail-value">
                                                {detailRequest.confirmedArtisan.artisanName}
                                                {detailRequest.confirmedArtisan.specialization && ` — ${detailRequest.confirmedArtisan.specialization}`}
                                            </span>
                                        </div>
                                    )}
                                    {detailRequest.selectedArtisans && detailRequest.selectedArtisans.length > 0 && (
                                        <div className="my-request-detail-artisans">
                                            <span className="detail-label">Nghệ nhân đã chọn</span>
                                            <ul className="detail-value">
                                                {detailRequest.selectedArtisans.map((a) => (
                                                    <li key={a.artisanId}>
                                                        {a.artisanName}{a.specialization ? ` — ${a.specialization}` : ''}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="my-request-detail-footer">
                            <button type="button" className="btn btn-primary" onClick={closeDetailModal}>Đóng</button>
                            {(() => {
                                const reqId = getRequestId(detailRequest);
                                const artisansToChat = detailRequest.confirmedArtisan
                                    ? [detailRequest.confirmedArtisan]
                                    : (detailRequest.selectedArtisans || []);
                                return artisansToChat.map((a) => (
                                    <button
                                        key={a.artisanId}
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => {
                                            if (!reqId || !a.artisanId) return;
                                            closeDetailModal();
                                            navigate(`/messages/chat/${reqId}/${a.artisanId}`, {
                                                state: {
                                                    otherPartyName: a.artisanName || 'Nghệ nhân',
                                                    requestTitle: detailRequest.title || 'Yêu cầu custom',
                                                },
                                            });
                                        }}
                                    >
                                        Nhắn tin {a.artisanName ? `(${a.artisanName})` : ''}
                                    </button>
                                ));
                            })()}
                            {!detailRequest.confirmedArtisan && (!detailRequest.selectedArtisans || detailRequest.selectedArtisans.length === 0) && (
                                <Link to="/messages" className="btn btn-outline" style={{ textDecoration: 'none' }}>Tin nhắn</Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyCustomRequestsPage;

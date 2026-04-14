import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import { getOpenCustomRequests } from '../../services/customRequestService';
import { getMyConversations, startConversation } from '../../services/chatService';
import './ArtisanRequestsPage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const formatDate = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString('vi-VN');
    } catch {
        return value;
    }
};

const truncate = (value, max = 120) => {
    const text = String(value || '').trim();
    if (!text) return 'Yêu cầu đặt làm riêng';
    return text.length > max ? `${text.slice(0, max)}...` : text;
};

const getRequestId = (item) => item?.requestId ?? item?.id ?? item?.customRequestId;

const budgetOptions = [
    { key: 'ALL', label: 'Mọi ngân sách' },
    { key: 'UNDER_2M', label: 'Dưới 2.000.000 đ' },
    { key: '2M_5M', label: '2.000.000 - 5.000.000 đ' },
    { key: 'ABOVE_5M', label: 'Trên 5.000.000 đ' },
];

const ArtisanRequestsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [search, setSearch] = useState('');
    const [budgetFilter, setBudgetFilter] = useState('ALL');
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [conversationByRequest, setConversationByRequest] = useState({});

    useEffect(() => {
        let ignore = false;
        const fetchOpenRequests = async () => {
            setLoading(true);
            const [res, convRes] = await Promise.all([
                getOpenCustomRequests({ page, size }),
                getMyConversations(),
            ]);
            if (ignore) return;
            setLoading(false);

            if (!res.success) {
                setRequests([]);
                setTotalPages(0);
                appToast.error('Không tải được yêu cầu', res.error || 'Vui lòng thử lại');
                return;
            }

            setRequests(Array.isArray(res.data?.content) ? res.data.content : []);
            setTotalPages(Number(res.data?.totalPages || 0));

            if (convRes.success) {
                const map = (convRes.data || []).reduce((acc, item) => {
                    const key = item?.requestId ?? item?.customRequestId;
                    if (key) acc[String(key)] = item?.id ?? item?.conversationId;
                    return acc;
                }, {});
                setConversationByRequest(map);
            }
        };

        fetchOpenRequests();
        return () => {
            ignore = true;
        };
    }, [page, size]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return requests.filter((item) => {
            const description = String(item?.description || '').toLowerCase();
            const inSearch = !q || description.includes(q);
            if (!inSearch) return false;

            const min = Number(item?.minBudget || 0);
            const max = Number(item?.maxBudget || 0);

            if (budgetFilter === 'UNDER_2M') return max > 0 && max < 2000000;
            if (budgetFilter === '2M_5M') return min >= 2000000 && max <= 5000000;
            if (budgetFilter === 'ABOVE_5M') return max >= 5000000;
            return true;
        });
    }, [budgetFilter, requests, search]);

    return (
        <div className="artisan-requests-page">
            <header className="artisan-page-header">
                <div>
                    <h1>Yêu cầu đặt làm riêng</h1>
                    <p>Các yêu cầu từ khách hàng đang tìm nghệ nhân</p>
                </div>
                <div className="artisan-requests-filters">
                    <input
                        type="search"
                        placeholder="Tìm theo mô tả yêu cầu..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select value={budgetFilter} onChange={(e) => setBudgetFilter(e.target.value)}>
                        {budgetOptions.map((option) => (
                            <option key={option.key} value={option.key}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </header>

            {loading ? (
                <div className="artisan-requests-grid">
                    {[1, 2, 3].map((item) => <div key={item} className="artisan-skeleton-card" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="artisan-empty">Chưa có yêu cầu nào đang mở</div>
            ) : (
                <div className="artisan-requests-grid">
                    {filtered.map((item) => {
                        const id = getRequestId(item);
                        const refs = Array.isArray(item?.referenceImages) ? item.referenceImages : [];
                        const quoteCount = Number(item?.quotationCount ?? item?.quotesCount ?? item?.totalQuotations ?? 0);
                        const customerName = item?.customerName || item?.customer?.fullName || item?.customer?.name || 'Khách hàng';

                        return (
                            <article key={String(id)} className="artisan-request-card">
                                <header>
                                    <h3>{truncate(item?.description, 70)}</h3>
                                    <p>{formatDate(item?.createdAt)} · {formatCurrency(item?.minBudget)} – {formatCurrency(item?.maxBudget)}</p>
                                    <span className="status-open">Đang mở</span>
                                </header>
                                <div className="body">
                                    <p>{truncate(item?.description, 140)}</p>
                                    <div className="thumbs">
                                        {item?.aiGeneratedImageUrl && <img src={item.aiGeneratedImageUrl} alt="AI" />}
                                        {refs.slice(0, 3).map((url) => <img key={url} src={url} alt="ref" />)}
                                    </div>
                                    <small>{quoteCount} báo giá đã nhận</small>
                                </div>
                                <footer>
                                    <span>{customerName}</span>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={async () => {
                                            const existingConversationId = conversationByRequest[String(id)];
                                            if (existingConversationId) {
                                                navigate(`/artisan/messages?conversationId=${existingConversationId}`);
                                                return;
                                            }

                                            const startRes = await startConversation(id);
                                            if (!startRes.success) {
                                                appToast.error('Không thể bắt đầu trò chuyện', startRes.error || 'Vui lòng thử lại');
                                                return;
                                            }

                                            appToast.success('Đã bắt đầu cuộc trò chuyện');
                                            const conversationId = startRes?.data?.id ?? startRes?.data?.conversationId;
                                            if (conversationId) navigate(`/artisan/messages?conversationId=${conversationId}`);
                                            else navigate('/artisan/messages');
                                        }}
                                    >
                                        {conversationByRequest[String(id)] ? 'Tiếp tục trò chuyện' : 'Bắt đầu trò chuyện'}
                                    </button>
                                </footer>
                            </article>
                        );
                    })}
                </div>
            )}

            <div className="artisan-pagination">
                <button type="button" className="btn btn-outline btn-sm" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                    Trang trước
                </button>
                <span>Trang {page + 1} / {Math.max(1, totalPages || 1)}</span>
                <button type="button" className="btn btn-outline btn-sm" disabled={totalPages > 0 && page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Trang sau
                </button>
            </div>
        </div>
    );
};

export default ArtisanRequestsPage;

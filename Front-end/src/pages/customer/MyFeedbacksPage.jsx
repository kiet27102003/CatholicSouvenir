import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { FiEdit3, FiStar, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import { deleteFeedback, getMyFeedbacks } from '../../services/feedbackApi';
import './MyFeedbacksPage.css';

const PAGE_SIZE = 10;

const formatDateTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY · HH:mm') : '—');

const clampRating = (value) => Math.max(0, Math.min(5, Number(value || 0)));

const MyFeedbacksPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0, pageSize: PAGE_SIZE, pageNumber: 0 });

    useEffect(() => {
        let cancelled = false;

        const fetchFeedbacks = async () => {
            setLoading(true);
            const res = await getMyFeedbacks({ page, size: PAGE_SIZE });
            if (cancelled) return;

            if (!res.success) {
                setFeedbacks([]);
                appToast.error('Không tải được đánh giá', res.error || 'Vui lòng thử lại sau');
                setLoading(false);
                return;
            }

            setFeedbacks(Array.isArray(res.data?.content) ? res.data.content : []);
            setPageInfo({
                totalElements: Number(res.data?.totalElements || 0),
                totalPages: Number(res.data?.totalPages || 0),
                pageSize: Number(res.data?.pageSize || PAGE_SIZE),
                pageNumber: Number(res.data?.pageNumber || 0),
            });
            setLoading(false);
        };

        fetchFeedbacks();
        return () => {
            cancelled = true;
        };
    }, [page]);

    const paginationText = useMemo(() => {
        if (pageInfo.totalElements <= 0) return 'Hiển thị 0–0 trong tổng 0 đánh giá';
        const from = pageInfo.pageNumber * pageInfo.pageSize + 1;
        const to = Math.min((pageInfo.pageNumber + 1) * pageInfo.pageSize, pageInfo.totalElements);
        return `Hiển thị ${from}–${to} trong tổng ${pageInfo.totalElements} đánh giá`;
    }, [pageInfo]);

    const handleDelete = async (feedbackId) => {
        const ok = window.confirm('Bạn có chắc muốn xoá đánh giá này?');
        if (!ok) return;

        const res = await deleteFeedback(feedbackId);
        if (!res.success) {
            appToast.error('Không xoá được đánh giá', res.error || 'Vui lòng thử lại sau');
            return;
        }

        appToast.success('Đã xoá đánh giá', 'Đánh giá của bạn đã được cập nhật.');
        setFeedbacks((prev) => prev.filter((item) => item.feedbackId !== feedbackId));
    };

    const renderStars = (rating) => {
        const value = clampRating(rating);
        return (
            <span className="my-feedback-rating" aria-label={`Đánh giá ${value} trên 5`}>
                {Array.from({ length: 5 }).map((_, idx) => (
                    <FiStar key={idx} size={16} className={idx < value ? 'filled' : ''} />
                ))}
                <strong>{value.toFixed(1).replace('.0', '')}</strong>
            </span>
        );
    };

    return (
        <div className="my-feedbacks-page">
            <header className="my-feedbacks-header">
                <div>
                    <h1>Đánh giá của tôi</h1>
                    <p>Xem và quản lý các đánh giá đã gửi cho nghệ nhân / đơn hàng của bạn.</p>
                </div>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/orders')}>
                    <FiEdit3 size={16} />
                    Quay lại đơn hàng
                </button>
            </header>

            {loading ? (
                <div className="my-feedbacks-list">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={`skeleton-${idx}`} className="my-feedback-card skeleton" />
                    ))}
                </div>
            ) : feedbacks.length === 0 ? (
                <div className="my-feedbacks-empty">
                    <div className="my-feedbacks-empty-icon">★</div>
                    <h3>Bạn chưa có đánh giá nào</h3>
                    <p>Khi bạn gửi đánh giá cho một đơn hàng, nó sẽ xuất hiện ở đây.</p>
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/orders')}>
                        Đi tới đơn hàng của tôi
                    </button>
                </div>
            ) : (
                <>
                    <div className="my-feedbacks-list">
                        {feedbacks.map((item) => (
                            <article key={item.feedbackId} className="my-feedback-card">
                                <div className="my-feedback-card-head">
                                    <div>
                                        <h2>{item.artisanName || 'Nghệ nhân'}</h2>
                                        <p>Mã đơn: {item.orderId || item.customOrderId || '—'}</p>
                                    </div>
                                    <div className="my-feedback-card-meta">{formatDateTime(item.createdAt)}</div>
                                </div>

                                <div className="my-feedback-card-body">
                                    {renderStars(item.rating)}
                                    <p>{item.comment?.trim() ? item.comment : 'Không có nhận xét.'}</p>
                                </div>

                                <div className="my-feedback-card-foot">
                                    <div />
                                    <div className="my-feedback-actions">
                                        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(`/orders/${item.orderId}`)}>
                                            Xem đơn hàng
                                        </button>
                                        <button type="button" className="btn btn-outline btn-sm" onClick={() => handleDelete(item.feedbackId)}>
                                            <FiTrash2 size={16} />
                                            Xoá
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="my-feedbacks-pagination">
                        <span>{paginationText}</span>
                        <div>
                            <button type="button" className="btn btn-outline btn-sm" disabled={page <= 0} onClick={() => setPage((prev) => prev - 1)}>
                                Trước
                            </button>
                            <button type="button" className="btn btn-outline btn-sm" disabled={page + 1 >= pageInfo.totalPages} onClick={() => setPage((prev) => prev + 1)}>
                                Sau
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MyFeedbacksPage;

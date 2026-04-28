import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import ProductCard from '../components/ProductGrid/ProductCard';
import { getArtisanById, getArtisanFeedbacks, getArtisanRating } from '../services/artisanService';
import { getProductsByArtisan } from '../services/productService';
import './ArtisanProfilePage.css';

const PLACEHOLDER_AVATAR = 'https://ui-avatars.com/api/?name=Artisan&background=6b7280&color=fff';

const truncate = (value, max) => {
    const text = String(value || '').trim();
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max).trim()}...` : text;
};

const formatText = (value, fallback = '—') => {
    const text = String(value || '').trim();
    return text || fallback;
};

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const renderStars = (rating = 0) => {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    return Array.from({ length: 5 }, (_, index) => (
        <span key={`star-${index}`} className={index < Math.round(value) ? 'profile-star profile-star--active' : 'profile-star'}>★</span>
    ));
};

const getSortConfig = (sortBy) => {
    switch (sortBy) {
        case 'rating-desc':
            return { sort: 'rating,DESC' };
        case 'rating-asc':
            return { sort: 'rating,ASC' };
        case 'date-asc':
            return { sort: 'createdAt,ASC' };
        case 'date-desc':
        default:
            return { sort: 'createdAt,DESC' };
    }
};

const FEEDBACK_PAGE_SIZE = 6;

const ArtisanProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artisan, setArtisan] = useState(null);
    const [products, setProducts] = useState([]);
    const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, totalFeedbacks: 0 });
    const [feedbackPage, setFeedbackPage] = useState(0);
    const [feedbackSortBy, setFeedbackSortBy] = useState('date-desc');
    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbackTotalPages, setFeedbackTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!id) {
            setArtisan(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        getArtisanById(id).then((result) => {
            if (cancelled) return;
            setArtisan(result.success && result.data ? result.data : null);
            setLoading(false);
        });

        return () => { cancelled = true; };
    }, [id]);

    useEffect(() => {
        const artisanId = artisan?.artisanId ?? id;
        if (!artisanId) return;

        let cancelled = false;
        setProductsLoading(true);
        getProductsByArtisan(artisanId, {
            status: 'APPROVED',
            page: 0,
            size: 10,
            sort: 'createdAt,DESC',
        }).then((result) => {
            if (cancelled) return;
            const list = result.success && result.data && Array.isArray(result.data.content)
                ? result.data.content
                : [];
            setProducts(list);
            setProductsLoading(false);
        });

        return () => { cancelled = true; };
    }, [id, artisan?.artisanId]);

    useEffect(() => {
        const artisanId = artisan?.artisanId ?? id;
        if (!artisanId) return;

        let cancelled = false;
        setFeedbackLoading(true);
        const { sort } = getSortConfig(feedbackSortBy);
        Promise.all([
            getArtisanRating(artisanId),
            getArtisanFeedbacks(artisanId, feedbackPage, FEEDBACK_PAGE_SIZE, sort),
        ]).then(([ratingResult, feedbackResult]) => {
            if (cancelled) return;

            setRatingSummary(ratingResult.success ? ratingResult.data : { averageRating: 0, totalFeedbacks: 0 });
            setFeedbacks(feedbackResult.success ? feedbackResult.data.content ?? [] : []);
            setFeedbackTotalPages(feedbackResult.success ? feedbackResult.data.totalPages ?? 0 : 0);
            setFeedbackLoading(false);
        });

        return () => { cancelled = true; };
    }, [id, artisan?.artisanId, feedbackPage, feedbackSortBy]);

    const handleCustomRequest = () => {
        if (!artisan) return;
        navigate('/custom-requests', { state: { artisanId: artisan.artisanId, artisanName: artisan.artisanName } });
    };

    const profileImage = artisan?.profileImageUrl || PLACEHOLDER_AVATAR;

    const artisanName = formatText(artisan?.artisanName, 'Nghệ nhân');
    const specialty = formatText(artisan?.specialization, '');
    const experienceYears = Number(artisan?.experienceYears || 0);
    const bio = formatText(artisan?.bio, 'Chưa có mô tả.');
    const ratingValue = Number(ratingSummary?.averageRating ?? 0);
    const ratingCount = Number(ratingSummary?.totalFeedbacks ?? 0);

    const infoCards = useMemo(() => ([
        { label: 'Kinh nghiệm', value: experienceYears > 0 ? `${experienceYears} năm` : 'Chưa có' },
        { label: 'Chuyên môn', value: specialty || '—' },
        { label: 'Liên hệ', value: formatText(artisan?.phoneNumber, '—') },
    ]), [specialty, experienceYears, artisan?.phoneNumber]);

    const profileStats = useMemo(() => ([
        { label: 'Sản phẩm', value: `${products.length}` },
        { label: 'Đánh giá', value: ratingValue.toFixed(1) },
        { label: 'Lượt đánh giá', value: `${ratingCount}` },
    ]), [products.length, ratingValue, ratingCount]);

    const ratingDistribution = useMemo(() => {
        const counts = [0, 0, 0, 0, 0];
        feedbacks.forEach((item) => {
            const rating = Math.max(1, Math.min(5, Math.round(Number(item?.rating || 0))));
            if (rating) counts[5 - rating] += 1;
        });
        return counts;
    }, [feedbacks]);

    if (loading) {
        return (
            <div className="artisan-profile-page">
                <Header />
                <div className="artisan-loading">
                    <div className="spinner" />
                    <p>Đang tải hồ sơ nghệ nhân...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!artisan) {
        return (
            <div className="artisan-profile-page">
                <Header />
                <main className="artisan-main">
                    <div className="artisan-content-wrapper">
                        <div className="artisan-loading artisan-empty-state">
                            <h2>Artisan not found</h2>
                            <p>Không tìm thấy hồ sơ nghệ nhân này.</p>
                            <button className="btn btn-primary" onClick={() => navigate('/artisans')}>Quay lại danh sách</button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const getProductImage = (product) => {
        if (product.images && product.images.length > 0) {
            return product.images[0].imageUrl || product.images[0].image_url;
        }
        if (product.productImages && product.productImages.length > 0) {
            const img = product.productImages[0];
            return img.imageUrl || img.image_url || img.image;
        }
        return product.imageUrl || product.image_url;
    };

    return (
        <div className="artisan-profile-page">
            <Header />

            <main className="artisan-main">
                <div className="artisan-content-wrapper">
                    <button className="back-link" onClick={() => navigate('/artisans')}>
                        &larr; Quay lại
                    </button>

                    <section className="artisan-profile-shell">
                        <header className="artisan-profile-header">
                            <div className="profile-image-container">
                                <img src={profileImage} alt={artisanName} />
                            </div>

                            <div className="profile-info">
                                <div className="profile-title-row">
                                    <div>
                                        <p className="profile-kicker">Nghệ nhân</p>
                                        <h1 title={artisanName}>{artisanName}</h1>
                                    </div>

                                    <button className="btn btn-primary btn-custom-order" onClick={handleCustomRequest}>
                                        Đặt làm riêng
                                    </button>
                                </div>

                                <div className="profile-meta-grid profile-meta-grid--centered">
                                    {profileStats.map((item) => (
                                        <div key={item.label} className="profile-meta-card profile-meta-card--centered">
                                            {item.label === 'Đánh giá' ? (
                                                <>
                                                    <span className="profile-meta-card__value-row">
                                                        <strong className="profile-meta-card__rating" title={item.value}>{item.value}</strong>
                                                        <svg className="profile-star-icon" viewBox="0 0 24 24" aria-hidden="true">
                                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                        </svg>
                                                    </span>
                                                    <span className="profile-meta-card__label-below">{item.label}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <strong title={item.value}>{item.value}</strong>
                                                    <span>{item.label}</span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </header>

                        <div className="artisan-profile-layout">
                            <aside className="artisan-profile-sidebar">
                                <article className="artisan-side-card">
                                    <h2>Giới thiệu</h2>
                                    <p>{bio}</p>
                                </article>

                                <article className="artisan-side-card artisan-side-card--accent artisan-side-card--spaced">
                                    <h2>Thông tin nhanh</h2>
                                    <div className="quick-info-list">
                                        <div>
                                            <span>Kinh nghiệm</span>
                                            <strong>{experienceYears > 0 ? `${experienceYears} năm` : '—'}</strong>
                                        </div>
                                        <div>
                                            <span>Chuyên môn</span>
                                            <strong>{specialty || '—'}</strong>
                                        </div>
                                        <div>
                                            <span>Liên hệ</span>
                                            <strong>{formatText(artisan?.phoneNumber, '—')}</strong>
                                        </div>
                                    </div>
                                </article>
                            </aside>

                            <section className="artisan-profile-main-panel">
                                <div className="artisan-products-section-header">
                                    <div>
                                        <p className="section-kicker">Hồ sơ</p>
                                        <h2>Sản phẩm của {artisanName}</h2>
                                    </div>
                                    <span className="section-count">{products.length} sản phẩm</span>
                                </div>

                                {productsLoading ? (
                                    <div className="artisan-products-loading">
                                        <div className="spinner" />
                                        <p>Đang tải sản phẩm...</p>
                                    </div>
                                ) : products.length > 0 ? (
                                    <div className="artisan-products-grid">
                                        {products.map((product) => (
                                            <ProductCard
                                                key={product.productId}
                                                id={product.productId}
                                                image={getProductImage(product)}
                                                title={truncate(product.productName, 48)}
                                                price={product.productPrice}
                                                salePrice={product.salePrice}
                                                onSale={product.onSale || false}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-products-message">
                                        <p>This artisan doesn't have any ready-made products available right now.</p>
                                        <button className="btn btn-outline" onClick={handleCustomRequest}>
                                            Request a Custom Piece
                                        </button>
                                    </div>
                                )}

                                <div className="artisan-feedback-section">
                                    <div className="artisan-feedback-header">
                                        <div>
                                            <p className="section-kicker">Đánh giá</p>
                                            <h2>Phản hồi từ khách hàng</h2>
                                        </div>
                                        <div className="feedback-toolbar">
                                            <span className="section-count">{ratingCount} lượt đánh giá</span>
                                            <select
                                                className="feedback-sort-select"
                                                value={feedbackSortBy}
                                                onChange={(e) => {
                                                    setFeedbackPage(0);
                                                    setFeedbackSortBy(e.target.value);
                                                }}
                                            >
                                                <option value="date-desc">Mới nhất</option>
                                                <option value="date-asc">Cũ nhất</option>
                                                <option value="rating-desc">Sao cao → thấp</option>
                                                <option value="rating-asc">Sao thấp → cao</option>
                                            </select>
                                        </div>
                                    </div>

                                    {feedbackLoading ? (
                                        <div className="artisan-feedback-loading">
                                            <div className="spinner" />
                                            <p>Đang tải đánh giá...</p>
                                        </div>
                                    ) : feedbacks.length > 0 ? (
                                        <div className="artisan-feedback-list">
                                            {feedbacks.map((feedback) => (
                                                <article key={feedback.feedbackId} className="feedback-card">
                                                    <div className="feedback-card__header">
                                                        <div className="feedback-avatar">
                                                            <img src={feedback.customerAvatar || PLACEHOLDER_AVATAR} alt={feedback.customerName || 'Khách hàng'} />
                                                        </div>
                                                        <div className="feedback-card__meta">
                                                            <h3>{formatText(feedback.customerName, 'Khách hàng')}</h3>
                                                            <div className="feedback-card__submeta">
                                                                <span>{formatDate(feedback.createdAt)}</span>
                                                                <span className="feedback-rating">{renderStars(feedback.rating)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="feedback-card__comment">{formatText(feedback.comment, 'Khách hàng chưa để lại bình luận.')}</p>
                                                </article>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-products-message">
                                            <p>Chưa có đánh giá nào cho nghệ nhân này.</p>
                                        </div>
                                    )}

                                    {feedbackTotalPages > 1 && (
                                        <div className="feedback-pagination">
                                            <button className="btn btn-outline" type="button" disabled={feedbackPage === 0} onClick={() => setFeedbackPage((page) => Math.max(0, page - 1))}>
                                                Trước
                                            </button>
                                            <span className="section-count">Trang {feedbackPage + 1} / {feedbackTotalPages}</span>
                                            <button className="btn btn-outline" type="button" disabled={feedbackPage >= feedbackTotalPages - 1} onClick={() => setFeedbackPage((page) => Math.min(feedbackTotalPages - 1, page + 1))}>
                                                Sau
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ArtisanProfilePage;

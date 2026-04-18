import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import ArtisanCard from '../components/FeaturedArtisans/ArtisanCard';
import { getArtisans } from '../services/artisanService';
import './ArtisanDirectoryPage.css';

const PAGE_SIZE = 20;
const PLACEHOLDER_AVATAR = 'https://ui-avatars.com/api/?name=Artisan&background=6b7280&color=fff';
const PLACEHOLDER_PORTFOLIO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" rx="16" fill="%23eef2ff"/><text x="150" y="104" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="%234f46e5">Portfolio</text></svg>';

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const ArtisanDirectoryPage = () => {
    const [artisans, setArtisans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const allSpecialties = useMemo(() => ['All', ...new Set(artisans.map((a) => a.specialization).filter(Boolean))], [artisans]);

    useEffect(() => {
        window.scrollTo(0, 0);
        let cancelled = false;
        queueMicrotask(() => setLoading(true));
        getArtisans(page, PAGE_SIZE).then((result) => {
            if (cancelled) return;
            setLoading(false);
            if (result.success && result.data) {
                setArtisans(result.data.content ?? []);
                setTotalPages(result.data.totalPages ?? 0);
                setTotalElements(result.data.totalElements ?? 0);
            } else {
                setArtisans([]);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [page]);

    const filteredArtisans = artisans.filter((artisan) => {
        const name = (artisan.artisanName || '').toLowerCase();
        const spec = (artisan.specialization || '').toLowerCase();
        const bio = (artisan.bio || '').toLowerCase();
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = !term || name.includes(term) || spec.includes(term) || bio.includes(term);
        const matchesFilter = filter === 'All' || (artisan.specialization || '') === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="artisan-directory-page">
            <Header />

            <main className="directory-main">
                <section className="directory-hero">
                    <div className="container directory-hero-inner">
                        <div className="directory-hero-copy">
                            <p className="directory-kicker">Khám phá nghệ nhân</p>
                            <h1>Gặp gỡ những nghệ nhân của chúng tôi</h1>
                            <p>Chọn đúng người thợ cho sản phẩm của bạn với hồ sơ, chuyên môn và bộ sưu tập thực tế ngay trên một màn hình.</p>
                        </div>
                    </div>
                </section>

                <div className="container directory-content">
                    <div className="directory-split-layout">
                        <aside className="directory-side-panel">
                            <div className="side-panel-card">
                                <div className="side-panel-head">
                                    <p className="side-panel-kicker">Bộ lọc</p>
                                    <h2>Tìm nghệ nhân phù hợp</h2>
                                </div>

                                <div className="search-bar search-bar--stacked">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Tìm theo tên, chuyên môn hoặc mô tả..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="side-panel-summary">
                                    <div>
                                        <span>Tổng nghệ nhân</span>
                                        <strong>{formatNumber(totalElements)}</strong>
                                    </div>
                                    <div>
                                        <span>Kết quả hiện tại</span>
                                        <strong>{formatNumber(filteredArtisans.length)}</strong>
                                    </div>
                                </div>

                                <div className="side-panel-actions">
                                    <button type="button" className="reset-btn reset-btn--block" onClick={() => { setSearchTerm(''); setFilter('All'); setPage(0); }}>
                                        Đặt lại bộ lọc
                                    </button>
                                </div>

                                <div className="side-panel-divider" />

                                <p className="side-panel-label">Chuyên môn</p>
                                <div className="specialty-filters specialty-filters--column" aria-label="Lọc theo chuyên môn">
                                    {allSpecialties.map((specialty) => (
                                        <button
                                            key={specialty}
                                            className={`filter-btn filter-btn--stacked ${filter === specialty ? 'active' : ''}`}
                                            onClick={() => setFilter(specialty)}
                                            type="button"
                                        >
                                            <span>{specialty}</span>
                                            <span className="filter-count">{specialty === 'All' ? totalElements : artisans.filter((item) => (item.specialization || '') === specialty).length}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        <section className="directory-main-panel">
                            <div className="directory-toolbar directory-toolbar--dense">
                                <div>
                                    <p className="directory-toolbar-kicker">Danh sách nghệ nhân</p>
                                    <h2>{filteredArtisans.length} kết quả phù hợp</h2>
                                </div>
                                <div className="directory-toolbar-meta">
                                    <span className="result-chip">Trang {page + 1}/{Math.max(totalPages, 1)}</span>
                                </div>
                            </div>

                            {loading ? (
                                <div className="directory-loading">
                                    <div className="spinner" />
                                    <p>Đang tải danh sách nghệ nhân...</p>
                                </div>
                            ) : filteredArtisans.length === 0 ? (
                                <div className="directory-empty">
                                    <div className="empty-illustration">✦</div>
                                    <h3>Không tìm thấy nghệ nhân phù hợp</h3>
                                    <p>Hãy thử đổi từ khóa tìm kiếm hoặc bỏ bộ lọc chuyên môn.</p>
                                    <button
                                        className="btn btn-outline"
                                        type="button"
                                        onClick={() => { setSearchTerm(''); setFilter('All'); }}
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="artisans-grid-full">
                                        {filteredArtisans.map((artisan) => (
                                            <ArtisanCard
                                                key={artisan.artisanId}
                                                id={artisan.artisanId}
                                                name={artisan.artisanName || 'Nghệ nhân'}
                                                location={artisan.specialization || ''}
                                                description={artisan.bio || ''}
                                                profileImage={artisan.profileImageUrl || PLACEHOLDER_AVATAR}
                                                productImage={artisan.portfolioUrl || PLACEHOLDER_PORTFOLIO}
                                            />
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="directory-pagination">
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                disabled={page === 0}
                                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                            >
                                                Trang trước
                                            </button>
                                            <span className="pagination-info">
                                                Trang {page + 1} / {totalPages} · {totalElements} nghệ nhân
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                disabled={page >= totalPages - 1}
                                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                            >
                                                Trang sau
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ArtisanDirectoryPage;

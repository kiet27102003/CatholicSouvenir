import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import ArtisanCard from '../components/FeaturedArtisans/ArtisanCard';
import { getArtisans } from '../services/artisanService';
import './ArtisanDirectoryPage.css';

const PAGE_SIZE = 20;
const PLACEHOLDER_AVATAR = 'https://ui-avatars.com/api/?name=Artisan&background=6b7280&color=fff';
const PLACEHOLDER_PORTFOLIO = 'https://via.placeholder.com/300x200?text=Portfolio';

const ArtisanDirectoryPage = () => {
    const [artisans, setArtisans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const allSpecialties = ['All', ...new Set(artisans.map(a => a.specialization).filter(Boolean))];

    useEffect(() => {
        window.scrollTo(0, 0);
        let cancelled = false;
        setLoading(true);
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
        return () => { cancelled = true; };
    }, [page]);

    const filteredArtisans = artisans.filter(artisan => {
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
                <div className="directory-hero">
                    <div className="container">
                        <h1>Meet Our Artisans</h1>
                        <p>Discover the talented creators who craft our sacred items with prayer and devotion.</p>
                    </div>
                </div>

                <div className="container directory-content">
                    <div className="directory-filters">
                        <div className="search-bar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by name or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="specialty-filters">
                            {allSpecialties.map(specialty => (
                                <button
                                    key={specialty}
                                    className={`filter-btn ${filter === specialty ? 'active' : ''}`}
                                    onClick={() => setFilter(specialty)}
                                >
                                    {specialty}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="directory-loading">
                            <div className="spinner"></div>
                            <p>Loading artisans...</p>
                        </div>
                    ) : filteredArtisans.length === 0 ? (
                        <div className="directory-empty">
                            <p>No artisans found matching your criteria.</p>
                            <button className="btn btn-outline" onClick={() => { setSearchTerm(''); setFilter('All'); }}>
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="artisans-grid-full">
                                {filteredArtisans.map(artisan => (
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
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                    >
                                        Previous
                                    </button>
                                    <span className="pagination-info">
                                        Page {page + 1} of {totalPages} ({totalElements} artisans)
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ArtisanDirectoryPage;

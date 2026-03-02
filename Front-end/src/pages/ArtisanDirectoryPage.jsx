import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import ArtisanCard from '../components/FeaturedArtisans/ArtisanCard';
import './ArtisanDirectoryPage.css';

const ArtisanDirectoryPage = () => {
    const [artisans, setArtisans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');

    const allSpecialties = ['All', ...new Set(artisans.flatMap(a => a.specialties || []))];

    useEffect(() => {
        window.scrollTo(0, 0);
        // TODO: fetch artisans from API when endpoint is available
        setArtisans([]);
        setLoading(false);
    }, []);

    const filteredArtisans = artisans.filter(artisan => {
        const matchesSearch = artisan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            artisan.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'All' || artisan.specialties.includes(filter);

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
                        <div className="artisans-grid-full">
                            {filteredArtisans.map(artisan => (
                                <ArtisanCard
                                    key={artisan.id}
                                    id={artisan.id}
                                    name={artisan.name}
                                    location={artisan.location}
                                    description={artisan.description}
                                    profileImage={artisan.profileImage}
                                    productImage={artisan.productImage}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ArtisanDirectoryPage;

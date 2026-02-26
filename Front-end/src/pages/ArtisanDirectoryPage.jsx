import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import ArtisanCard from '../components/FeaturedArtisans/ArtisanCard';
import './ArtisanDirectoryPage.css';

const MOCK_ARTISANS = [
    {
        id: '1',
        name: 'Marco V.',
        location: 'Bethlehem, Pennsylvania',
        description: 'A carpentry master who carves purely crafted wood items by hand.',
        profileImage: 'https://i.pravatar.cc/150?img=12',
        productImage: '/src/assets/wooden-bowl.png',
        specialties: ['Woodworking', 'Carving']
    },
    {
        id: '2',
        name: 'Elena S.',
        location: 'Santa Fe, New Mexico',
        description: 'Traditional woodcarver, forensically crafted with prayer and delicacy.',
        profileImage: 'https://i.pravatar.cc/150?img=47',
        productImage: '/src/assets/carved-wood.png',
        specialties: ['Woodworking', 'Sculpture']
    },
    {
        id: '3',
        name: 'Clara M.',
        location: 'Rome, Italy',
        description: 'Hand-weaves rosaries using age-old techniques and holy intent.',
        profileImage: 'https://i.pravatar.cc/150?img=32',
        productImage: '/src/assets/rosary-beads.png',
        specialties: ['Jewelry', 'Weaving']
    },
    {
        id: '4',
        name: 'David O.',
        location: 'Monastery of Christ in the Desert',
        description: 'Brewer and candle maker focusing on ethically sourced goods.',
        profileImage: 'https://i.pravatar.cc/150?img=11',
        productImage: '/src/assets/beeswax-candle.png',
        specialties: ['Candles', 'Wax']
    },
    {
        id: '5',
        name: 'Sister Mary Grace',
        location: 'Avila, Spain',
        description: 'Illuminated manuscripts and traditional calligraphy.',
        profileImage: 'https://i.pravatar.cc/150?img=43',
        productImage: '/src/assets/leather-journal.png',
        specialties: ['Calligraphy', 'Leatherwork']
    },
    {
        id: '6',
        name: 'John Paul Metalworks',
        location: 'Krakow, Poland',
        description: 'Master silversmiths specializing in crucifixes and medals.',
        profileImage: 'https://i.pravatar.cc/150?img=53',
        productImage: '/src/assets/silver-crucifix.png',
        specialties: ['Metalworking', 'Jewelry']
    }
];

const ArtisanDirectoryPage = () => {
    const [artisans, setArtisans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');

    const allSpecialties = ['All', ...new Set(MOCK_ARTISANS.flatMap(a => a.specialties))];

    useEffect(() => {
        window.scrollTo(0, 0);
        setTimeout(() => {
            setArtisans(MOCK_ARTISANS);
            setLoading(false);
        }, 500);
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

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import ProductCard from '../components/ProductGrid/ProductCard';
import './ArtisanProfilePage.css';

const ArtisanProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artisan, setArtisan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        // TODO: fetch artisan by id from API when endpoint is available
        setArtisan(null);
        setLoading(false);
    }, [id]);

    const handleCustomRequest = () => {
        navigate('/custom-requests', { state: { artisanId: artisan.id, artisanName: artisan.name } });
    };

    if (loading) {
        return (
            <div className="artisan-profile-page">
                <Header />
                <div className="artisan-loading">
                    <div className="spinner"></div>
                    <p>Loading artisan profile...</p>
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
                    <div className="container artisan-content-wrapper">
                        <button className="back-link" onClick={() => navigate('/artisans')}>&larr; Back to Directory</button>
                        <div className="artisan-loading">
                            <h2>Artisan not found</h2>
                            <p>We couldn't find this artisan profile.</p>
                            <button className="btn btn-primary" onClick={() => navigate('/artisans')}>Back to Directory</button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="artisan-profile-page">
            <Header />

            <main className="artisan-main">
                {/* Cover Image */}
                <div
                    className="artisan-cover"
                    style={{
                        backgroundImage: artisan.coverImage ? `url(${artisan.coverImage})` : 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)'
                    }}
                ></div>

                <div className="container artisan-content-wrapper">
                    <button className="back-link" onClick={() => navigate('/artisans')}>
                        &larr; Back to Directory
                    </button>

                    <div className="artisan-profile-header">
                        <div className="profile-image-container">
                            <img src={artisan.profileImage} alt={artisan.name} />
                        </div>

                        <div className="profile-info">
                            <div className="profile-title-row">
                                <h1>{artisan.name}</h1>
                                <button className="btn btn-primary btn-custom-order" onClick={handleCustomRequest}>
                                    Request Custom Order
                                </button>
                            </div>

                            <div className="profile-meta">
                                <span className="meta-location">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    {artisan.location}
                                </span>
                                <span className="meta-rating">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" xmlns="http://www.w3.org/2000/svg">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                    {artisan.rating} ({artisan.reviews} reviews)
                                </span>
                            </div>

                            <div className="profile-specialties">
                                {(artisan.specialties || []).map(spec => (
                                    <span key={spec} className="badge badge-outline">{spec}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="artisan-profile-body">
                        <div className="artisan-about-section">
                            <h2>About the Artisan</h2>
                            <p>{artisan.about}</p>
                        </div>
                    </div>

                    <div className="artisan-products-section">
                        <h2>Crafted by {artisan.name}</h2>

                        {artisan.products && artisan.products.length > 0 ? (
                            <div className="artisan-products-grid">
                                {artisan.products.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        id={product.id}
                                        image={product.image}
                                        title={product.title}
                                        artisan={artisan.name}
                                        price={product.price}
                                        salePrice={product.salePrice}
                                        onSale={product.onSale}
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
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ArtisanProfilePage;

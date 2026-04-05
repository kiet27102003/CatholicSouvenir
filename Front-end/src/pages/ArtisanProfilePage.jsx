import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import ProductCard from '../components/ProductGrid/ProductCard';
import { getArtisanById } from '../services/artisanService';
import { getProductsByArtisan } from '../services/productService';
import './ArtisanProfilePage.css';

const PLACEHOLDER_AVATAR = 'https://ui-avatars.com/api/?name=Artisan&background=6b7280&color=fff';

const ArtisanProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artisan, setArtisan] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);

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
            if (result.success && result.data) {
                setArtisan(result.data);
            } else {
                setArtisan(null);
            }
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [id]);

    // GET /api/product/artisan/{artisanId}?status=APPROVED&page=0&size=10&sort=createdAt,DESC
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

    const handleCustomRequest = () => {
        if (!artisan) return;
        navigate('/custom-requests', { state: { artisanId: artisan.artisanId, artisanName: artisan.artisanName } });
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

    const profileImage = artisan.profileImageUrl || PLACEHOLDER_AVATAR;
    const coverImage = artisan.portfolioUrl || null;

    return (
        <div className="artisan-profile-page">
            <Header />

            <main className="artisan-main">
                <div
                    className="artisan-cover"
                    style={{
                        backgroundImage: coverImage ? `url(${coverImage})` : 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)'
                    }}
                ></div>

                <div className="container artisan-content-wrapper">
                    <button className="back-link" onClick={() => navigate('/artisans')}>
                        &larr; Back to Directory
                    </button>

                    <div className="artisan-profile-header">
                        <div className="profile-image-container">
                            <img src={profileImage} alt={artisan.artisanName} />
                        </div>

                        <div className="profile-info">
                            <div className="profile-title-row">
                                <h1>{artisan.artisanName || 'Nghệ nhân'}</h1>
                                <button className="btn btn-primary btn-custom-order" onClick={handleCustomRequest}>
                                    Request Custom Order
                                </button>
                            </div>

                            <div className="profile-meta">
                                {artisan.specialization && (
                                    <span className="meta-location">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" />
                                            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                        {artisan.specialization}
                                    </span>
                                )}
                                {artisan.experienceYears != null && artisan.experienceYears > 0 && (
                                    <span className="meta-rating">
                                        {artisan.experienceYears} năm kinh nghiệm
                                    </span>
                                )}
                                {artisan.phoneNumber && (
                                    <span className="meta-phone">{artisan.phoneNumber}</span>
                                )}
                            </div>

                            {(artisan.specialization || artisan.portfolioUrl) && (
                                <div className="profile-specialties">
                                    {artisan.specialization && (
                                        <span className="badge badge-outline">{artisan.specialization}</span>
                                    )}
                                    {artisan.portfolioUrl && (
                                        <a href={artisan.portfolioUrl} target="_blank" rel="noopener noreferrer" className="badge badge-outline">Portfolio</a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="artisan-profile-body">
                        {artisan.bio && (
                            <div className="artisan-about-section">
                                <h2>About the Artisan</h2>
                                <p>{artisan.bio}</p>
                            </div>
                        )}
                    </div>

                    <div className="artisan-products-section">
                        <h2>Crafted by {artisan.artisanName || 'Nghệ nhân'}</h2>

                        {productsLoading ? (
                            <div className="artisan-products-loading">
                                <div className="spinner"></div>
                                <p>Đang tải sản phẩm...</p>
                            </div>
                        ) : products.length > 0 ? (
                            <div className="artisan-products-grid">
                                {products.map(product => (
                                    <ProductCard
                                        key={product.productId}
                                        id={product.productId}
                                        image={getProductImage(product)}
                                        title={product.productName}
                                        artisan={artisan.artisanName || 'Nghệ nhân'}
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
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ArtisanProfilePage;

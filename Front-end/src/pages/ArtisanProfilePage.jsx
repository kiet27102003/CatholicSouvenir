import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import ProductCard from '../components/ProductGrid/ProductCard';
import { getArtisanById } from '../services/artisanService';
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

    const handleCustomRequest = () => {
        if (!artisan) return;
        navigate('/custom-requests', { state: { artisanId: artisan.artisanId, artisanName: artisan.artisanName } });
    };

    const profileImage = artisan?.profileImageUrl || PLACEHOLDER_AVATAR;
    const coverImage = artisan?.portfolioUrl || null;

    const artisanName = formatText(artisan?.artisanName, 'Nghệ nhân');
    const specialty = formatText(artisan?.specialization, '');
    const experienceYears = Number(artisan?.experienceYears || 0);
    const bio = truncate(artisan?.bio, 420);

    const infoCards = useMemo(() => ([
        { label: 'Chuyên môn', value: specialty },
        { label: 'Kinh nghiệm', value: experienceYears > 0 ? `${experienceYears} năm` : 'Chưa có' },
        { label: 'Liên hệ', value: formatText(artisan?.phoneNumber, '—') },
    ]), [specialty, experienceYears, artisan?.phoneNumber]);

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
                                        {specialty ? <p className="profile-subtitle" title={specialty}>{specialty}</p> : null}
                                    </div>

                                    <button className="btn btn-primary btn-custom-order" onClick={handleCustomRequest}>
                                        Đặt làm riêng
                                    </button>
                                </div>

                                <div className="profile-meta-grid">
                                    {infoCards.map((item) => (
                                        <div key={item.label} className="profile-meta-card">
                                            <span>{item.label}</span>
                                            <strong title={item.value}>{item.value}</strong>
                                        </div>
                                    ))}
                                </div>

                                <div className="profile-specialties">
                                    {specialty && <span className="badge badge-outline">{specialty}</span>}
                                    {artisan?.portfolioUrl && (
                                        <a href={artisan.portfolioUrl} target="_blank" rel="noopener noreferrer" className="badge badge-outline">Portfolio</a>
                                    )}
                                </div>
                            </div>
                        </header>

                        <div className="artisan-profile-layout">
                            <aside className="artisan-profile-sidebar">
                                <article className="artisan-side-card">
                                    <h2>Giới thiệu</h2>
                                    <p title={artisan?.bio || '—'}>{bio || 'Chưa có mô tả.'}</p>
                                </article>

                                <article className="artisan-side-card artisan-side-card--accent">
                                    <h2>Thông tin nhanh</h2>
                                    <div className="quick-info-list">
                                        <div>
                                            <span>Tên hiển thị</span>
                                            <strong>{artisanName}</strong>
                                        </div>
                                        {specialty && (
                                            <div>
                                                <span>Chuyên môn</span>
                                                <strong>{specialty}</strong>
                                            </div>
                                        )}
                                        <div>
                                            <span>Kinh nghiệm</span>
                                            <strong>{experienceYears > 0 ? `${experienceYears} năm` : '—'}</strong>
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
                                                artisan={artisanName}
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

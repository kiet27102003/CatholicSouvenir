import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowRight, FiStar, FiGrid, FiLayers, FiFeather, FiHeart, FiChevronRight, FiShoppingCart, FiPackage } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './HomePage.css';

const fallbackImages = [
    '/src/assets/rosary.png',
    '/src/assets/silver-crucifix.png',
    '/src/assets/statue.png',
    '/src/assets/textile.png',
];

const categoryIcons = [FiGrid, FiLayers, FiFeather, FiHeart, FiPackage];

const formatCurrency = (value) => {
    if (value == null || Number.isNaN(Number(value))) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(Number(value));
};

const getInitials = (name = '') => name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'A';

const useScrollAnimation = () => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;

        if (isVisible) return undefined;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [isVisible]);

    return [ref, isVisible];
};

const HomePage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [artisans, setArtisans] = useState([]);
    const [loading, setLoading] = useState(true);

    const [heroRef, heroVisible] = useScrollAnimation();
    const [categoriesRef, categoriesVisible] = useScrollAnimation();
    const [productsRef, productsVisible] = useScrollAnimation();
    const [artisansRef, artisansVisible] = useScrollAnimation();
    const [ctaRef, ctaVisible] = useScrollAnimation();

    useEffect(() => {
        let ignore = false;

        const loadData = async () => {
            setLoading(true);
            try {
                const [categoriesRes, productsRes, artisansRes] = await Promise.all([
                    fetch('/api/categories/root'),
                    fetch('/api/products?page=0&size=8'),
                    fetch('/api/users?role=ARTISAN&page=0&size=3'),
                ]);

                const [categoriesData, productsData, artisansData] = await Promise.all([
                    categoriesRes.ok ? categoriesRes.json() : Promise.resolve([]),
                    productsRes.ok ? productsRes.json() : Promise.resolve({ content: [] }),
                    artisansRes.ok ? artisansRes.json() : Promise.resolve({ content: [] }),
                ]);

                if (ignore) return;

                setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData?.content || categoriesData?.data || []));
                setProducts(Array.isArray(productsData) ? productsData : (productsData?.content || productsData?.data || []));
                setArtisans(Array.isArray(artisansData) ? artisansData : (artisansData?.content || artisansData?.data || []));
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        loadData();
        return () => {
            ignore = true;
        };
    }, []);

    const featuredProducts = useMemo(() => products.slice(0, 8), [products]);
    const imageFor = (index) => fallbackImages[index % fallbackImages.length];

    return (
        <div className="homepage luxury-homepage">
            <Header />
            <main className="homepage-main">
                <section className="hero-section">
                    <div className="container hero-layout">
                        <div ref={heroRef} className={`hero-copy fade-up ${heroVisible ? 'animate-in' : ''}`}>
                            <span className={`hero-pill fade-up stagger-1 ${heroVisible ? 'animate-in' : ''}`}>Thủ công truyền thống Việt Nam</span>
                            <h1 className={`hero-title fade-up stagger-2 ${heroVisible ? 'animate-in' : ''}`}>
                                Nghệ thuật <span className="accent">thủ công</span> từ bàn tay người thợ
                            </h1>
                            <p className={`hero-description fade-up stagger-3 ${heroVisible ? 'animate-in' : ''}`}>
                                Khám phá những tác phẩm thủ công cao cấp được tạo nên từ sự tỉ mỉ, tinh tế và niềm tin vào giá trị bền vững.
                                Mỗi sản phẩm là một câu chuyện về kỹ nghệ, văn hoá và tâm huyết của nghệ nhân Việt.
                            </p>
                            <div className={`hero-actions fade-up stagger-4 ${heroVisible ? 'animate-in' : ''}`}>
                                <button type="button" className="btn btn-primary" onClick={() => navigate('/shop')}>Khám phá ngay</button>
                                <button type="button" className="btn btn-outline" onClick={() => navigate('/custom-requests')}>Đặt làm riêng</button>
                            </div>
                            <div className={`hero-stats fade-up stagger-4 ${heroVisible ? 'animate-in' : ''}`}>
                                <div><strong>500+</strong><span>sản phẩm</span></div>
                                <div><strong>120+</strong><span>nghệ nhân</span></div>
                                <div><strong>2.000+</strong><span>khách hàng</span></div>
                            </div>
                        </div>

                        <div className={`hero-gallery fade-in ${heroVisible ? 'animate-in' : ''}`}>
                            <div className="gallery-grid">
                                {[0, 1, 2, 3].map((index) => (
                                    <div key={index} className={`gallery-item ${index === 0 ? 'tall' : ''}`}>
                                        <img src={imageFor(index)} alt="Tác phẩm thủ công" loading="lazy" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section ref={categoriesRef} className={`section categories-section fade-up ${categoriesVisible ? 'animate-in' : ''}`}>
                    <div className="container">
                        <div className="section-header">
                            <span className="section-kicker">Danh mục</span>
                            <h2>Khám phá bộ sưu tập theo chủ đề</h2>
                            <p>Những dòng sản phẩm tiêu biểu được tuyển chọn theo tinh thần thủ công cao cấp.</p>
                        </div>
                        <div className="categories-grid">
                            {(loading ? Array.from({ length: 5 }) : categories.slice(0, 5)).map((category, index) => {
                                const Icon = categoryIcons[index % categoryIcons.length];
                                return (
                                    <div key={category?.categoryId || category?.id || index} className="category-card fade-up animate-in">
                                        {loading ? <div className="skeleton skeleton-square" /> : <Icon size={22} />}
                                        <div>
                                            <h3>{loading ? 'Đang tải...' : category?.name || category?.categoryName || 'Danh mục'}</h3>
                                            <p>{loading ? ' ' : `${category?.productCount ?? category?.productsCount ?? 0} sản phẩm`}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section ref={productsRef} className={`section products-section fade-up ${productsVisible ? 'animate-in' : ''}`}>
                    <div className="container">
                        <div className="section-header section-header-row">
                            <div>
                                <span className="section-kicker">Sản phẩm nổi bật</span>
                                <h2>Lựa chọn tinh xảo dành cho không gian trang trọng</h2>
                            </div>
                            <button type="button" className="section-link" onClick={() => navigate('/shop')}>
                                Xem tất cả <FiChevronRight />
                            </button>
                        </div>
                        <div className="products-grid">
                            {(loading ? Array.from({ length: 8 }) : featuredProducts).map((product, index) => {
                                const image = product?.images?.[0]?.image_url || product?.image || imageFor(index);
                                const artisanName = product?.artisanName || product?.artisan?.name || product?.artisan?.fullName || 'Nghệ nhân';
                                const categoryName = product?.categoryName || product?.category?.name || 'Thủ công';
                                return (
                                    <article key={product?.productId || product?.id || index} className={`product-card fade-up animate-in ${index === 0 ? 'featured' : ''}`}>
                                        {loading ? (
                                            <div className="skeleton skeleton-product-image" />
                                        ) : (
                                            <div className="product-media">
                                                <img src={image} alt={product?.name || product?.title || 'Sản phẩm'} loading="lazy" />
                                                {index === 0 && <span className="badge">Nổi bật</span>}
                                            </div>
                                        )}
                                        <div className="product-body">
                                            <span className="product-category">{loading ? ' ' : String(categoryName).toUpperCase()}</span>
                                            <h3>{loading ? ' ' : (product?.name || product?.title || 'Sản phẩm thủ công')}</h3>
                                            <p className="product-artisan">{loading ? ' ' : artisanName}</p>
                                            <div className="product-meta">
                                                <strong>{loading ? ' ' : formatCurrency(product?.price || product?.salePrice || product?.basePrice)}</strong>
                                                <span><FiStar />{loading ? '4.9' : (product?.rating || product?.averageRating || 4.9)}</span>
                                                <button type="button" className="cart-btn" aria-label="Thêm vào giỏ hàng"><FiShoppingCart /></button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section ref={artisansRef} className={`section artisans-section fade-up ${artisansVisible ? 'animate-in' : ''}`}>
                    <div className="container">
                        <div className="section-header">
                            <span className="section-kicker">Nghệ nhân</span>
                            <h2>Những bàn tay tạo nên giá trị bền lâu</h2>
                            <p>Gặp gỡ các xưởng thủ công mang đến dấu ấn tinh tế cho từng tác phẩm.</p>
                        </div>
                        <div className="artisans-grid">
                            {(loading ? Array.from({ length: 3 }) : artisans.slice(0, 3)).map((artisan, index) => (
                                <article key={artisan?.userId || artisan?.id || index} className="artisan-card fade-up animate-in">
                                    {loading ? (
                                        <div className="artisan-skeleton-row">
                                            <div className="skeleton skeleton-avatar" />
                                            <div className="artisan-skeleton-copy">
                                                <div className="skeleton skeleton-line" />
                                                <div className="skeleton skeleton-line tiny" />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="artisan-avatar">{getInitials(artisan?.name || artisan?.fullName || artisan?.shopName)}</div>
                                            <div className="artisan-info">
                                                <h3>{artisan?.shopName || artisan?.name || artisan?.fullName || 'Xưởng nghệ nhân'}</h3>
                                                <p>{artisan?.specialty || artisan?.craft || 'Thủ công mỹ nghệ'}</p>
                                                <div className="artisan-stats">
                                                    <span>{artisan?.productCount ?? 0} sản phẩm</span>
                                                    <span><FiStar />{artisan?.rating ?? 4.8}</span>
                                                    <span>{artisan?.orderCount ?? 0} đơn</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section ref={ctaRef} className={`cta-banner fade-up ${ctaVisible ? 'animate-in' : ''}`}>
                    <div className="container cta-layout">
                        <div>
                            <span className="cta-pill">Đặt làm riêng</span>
                            <h2>Muốn có sản phẩm theo ý riêng của bạn?</h2>
                            <p>Từ vật phẩm phụng vụ đến quà tặng cao cấp, chúng tôi hỗ trợ thiết kế theo mong muốn với quy trình rõ ràng, tinh gọn.</p>
                        </div>
                        <div className="cta-actions">
                            <button type="button" className="btn btn-cta" onClick={() => navigate('/custom-requests')}>
                                Bắt đầu đặt hàng <FiArrowRight />
                            </button>
                            <small>Miễn phí · Không cần đặt cọc trước</small>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default HomePage;

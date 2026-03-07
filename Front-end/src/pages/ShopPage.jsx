import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import ProductCard from '../components/ProductGrid/ProductCard';
import productService from '../services/productService';
import { useLanguage } from '../context/LanguageContext';
import './ShopPage.css';

const ShopPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await productService.getProducts();
                if (result.success && Array.isArray(result.data)) {
                    const approved = result.data.filter(
                        (p) => (p.status || '').toUpperCase() === 'APPROVED'
                    );
                    setProducts(approved);
                } else {
                    setProducts([]);
                    if (result.error) setError(result.error);
                }
            } catch (err) {
                setError(err.message || 'Không tải được danh sách sản phẩm.');
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

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
        <div className="shop-page">
            <Header />
            <main className="shop-main">
                <div className="container">
                    <h1 className="shop-page-title">
                        {t('shop.title') || 'Cửa hàng'}
                    </h1>
                    <p className="shop-page-subtitle">
                        {t('shop.subtitle') || 'Khám phá các sản phẩm thánh được duyệt từ nghệ nhân'}
                    </p>

                    {loading ? (
                        <div className="shop-loading">
                            <div className="spinner" />
                            <p>{t('shop.loading') || 'Đang tải sản phẩm...'}</p>
                        </div>
                    ) : error ? (
                        <div className="shop-error">
                            <p>{error}</p>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => window.location.reload()}
                            >
                                {t('shop.retry') || 'Thử lại'}
                            </button>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="shop-empty">
                            <p>{t('shop.empty') || 'Chưa có sản phẩm nào được duyệt.'}</p>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => navigate('/')}
                            >
                                {t('shop.backHome') || 'Về trang chủ'}
                            </button>
                        </div>
                    ) : (
                        <div className="shop-grid">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.productId}
                                    id={product.productId}
                                    image={getProductImage(product)}
                                    title={product.productName || '—'}
                                    artisan={product.artisanName || '—'}
                                    price={product.productPrice}
                                    onSale={false}
                                    currency="VND"
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

export default ShopPage;

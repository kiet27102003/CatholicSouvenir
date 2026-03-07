import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useCart } from '../context/CartContext';
import productService from '../services/productService';
import './ProductDetailsPage.css';

const getProductImage = (p) => {
    if (p?.images?.length > 0) return p.images[0].imageUrl || p.images[0].image_url;
    if (p?.productImages?.length > 0) {
        const img = p.productImages[0];
        return img.imageUrl || img.image_url || img.image;
    }
    return p?.imageUrl || p?.image_url || p?.image;
};

const ProductDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (!id) {
            setProduct(null);
            setLoading(false);
            return;
        }
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await productService.getProductById(id);
                if (result.success && result.data) {
                    setProduct(result.data);
                } else {
                    setProduct(null);
                    setError(result.error || 'Không tìm thấy sản phẩm.');
                }
            } catch (err) {
                setProduct(null);
                setError(err.message || 'Không tải được thông tin sản phẩm.');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        if (!product) return;
        const productId = product.productId ?? product.id;
        const price = product.productPrice ?? product.price;
        const title = product.productName ?? product.title ?? '—';
        const image = getProductImage(product);
        const artisan = product.artisanName ?? product.artisan ?? '';
        addToCart({
            id: productId,
            productId,
            title,
            price,
            image,
            artisan,
        }, quantity);
    };

    if (loading) {
        return (
            <div className="product-details-page">
                <Header />
                <div className="product-loading">
                    <div className="spinner"></div>
                    <p>Đang tải thông tin sản phẩm...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!product && !loading) {
        return (
            <div className="product-details-page">
                <Header />
                <div className="product-not-found">
                    <h2>Không tìm thấy sản phẩm</h2>
                    <p>{error || 'Chúng tôi không tìm thấy sản phẩm bạn cần.'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/shop')}>Về cửa hàng</button>
                </div>
                <Footer />
            </div>
        );
    }

    const productImage = getProductImage(product);
    const productPrice = product.productPrice ?? product.price ?? 0;
    const productName = product.productName ?? product.title ?? '—';
    const artisanName = product.artisanName ?? product.artisan ?? '—';
    const productDescription = product.productDescription ?? product.description ?? '';

    return (
        <div className="product-details-page">
            <Header />
            <main className="product-main container">
                <button className="back-link" onClick={() => navigate(-1)}>
                    &larr; Quay lại cửa hàng
                </button>

                <div className="product-details-grid">
                    {/* Image Section */}
                    <div className="product-image-container">
                        {productImage ? (
                            <img src={productImage} alt={productName} className="product-main-image" />
                        ) : (
                            <div className="product-image-placeholder">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="product-info-container">
                        <div className="product-header">
                            <h1 className="product-title-large">{productName}</h1>
                            <p className="product-artisan-link">Tác giả: <strong>{artisanName}</strong></p>
                        </div>

                        <div className="product-price-large">
                            <span className="price-regular">
                                {productPrice.toLocaleString('vi-VN')} ₫
                            </span>
                        </div>

                        <div className="product-description">
                            <p>{productDescription || 'Chưa có mô tả.'}</p>
                        </div>

                        <div className="product-meta">
                            {product.material && (
                                <div className="meta-item">
                                    <span className="meta-label">Chất liệu:</span>
                                    <span className="meta-value">{product.material}</span>
                                </div>
                            )}
                            {product.size && (
                                <div className="meta-item">
                                    <span className="meta-label">Kích thước:</span>
                                    <span className="meta-value">{product.size}</span>
                                </div>
                            )}
                            {product.quantity != null && (
                                <div className="meta-item">
                                    <span className="meta-label">Số lượng có sẵn:</span>
                                    <span className="meta-value">{product.quantity}</span>
                                </div>
                            )}
                        </div>

                        <div className="product-actions">
                            <div className="quantity-selector">
                                <button
                                    className="qty-btn"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="qty-value">{quantity}</span>
                                <button
                                    className="qty-btn"
                                    onClick={() => setQuantity(Math.min((product.quantity ?? Infinity), quantity + 1))}
                                    disabled={product.quantity != null && quantity >= product.quantity}
                                >
                                    +
                                </button>
                            </div>
                            <button className="btn btn-primary btn-add-cart" onClick={handleAddToCart}>
                                Thêm vào giỏ hàng
                            </button>
                        </div>

                        <div className="custom-order-prompt">
                            <div className="prompt-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                    <path d="M2 17l10 5 10-5"></path>
                                    <path d="M2 12l10 5 10-5"></path>
                                </svg>
                            </div>
                            <div className="prompt-text">
                                <h4>Muốn đặt hàng theo ý riêng?</h4>
                                <p>Bạn có thể yêu cầu phiên bản tùy chỉnh trực tiếp từ nghệ nhân.</p>
                                <button className="btn btn-outline btn-sm prompt-btn">Đặt hàng tùy chỉnh</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ProductDetailsPage;

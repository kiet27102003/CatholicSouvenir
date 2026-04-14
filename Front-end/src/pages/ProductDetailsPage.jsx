import React, { useState, useEffect } from 'react';
import { FiImage, FiArrowLeft } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useCart } from '../context/CartContext';
import productService from '../services/productService';
import { appToast } from '../lib/appToast';
import './ProductDetailsPage.css';

const getProductImage = (p) => {
    if (p?.images?.length > 0) return p.images[0]?.image_url || undefined;
    return undefined;
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

const getInitials = (name) => {
    const raw = String(name || '').trim();
    if (!raw) return 'A';
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const ProductDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [imageBroken, setImageBroken] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');

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
            try {
                const result = await productService.getProductById(id);
                if (result.success && result.data) {
                    setProduct(result.data);
                    setImageBroken(false);
                } else {
                    setProduct(null);
                    const msg = result.error != null ? String(result.error) : 'Vui lòng thử lại';
                    appToast.error('Không tải được', msg);
                }
            } catch (err) {
                setProduct(null);
                const msg = err.message || 'Kiểm tra kết nối mạng';
                appToast.error('Không tải được', msg);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    useEffect(() => {
        const firstImage = getProductImage(product);
        setSelectedImageUrl(firstImage || '');
    }, [product]);

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
            basePrice: price,
            finalUnitPrice: price,
            zonePriceBreakdown: [],
            image,
            artisan,
            customRequests: {},
        }, quantity);

        appToast.success('Đã thêm vào giỏ hàng');
    };

    const productImages = Array.isArray(product?.images) ? product.images : [];
    const mainImage = selectedImageUrl || getProductImage(product);
    const productPrice = product?.productPrice ?? product?.price ?? 0;
    const productName = product?.productName ?? product?.title ?? '—';
    const artisanName = product?.artisanName ?? product?.artisan ?? '—';
    const artisanId = product?.artisanId ?? product?.artisan_id ?? null;
    const productDescription = product?.productDescription ?? product?.description ?? '';
    const categoryName = product?.categoryName ?? product?.category?.name ?? 'Danh mục';
    const productReviews = Array.isArray(product?.reviews) ? product.reviews : [];

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
                    <p>Chúng tôi không tìm thấy sản phẩm bạn cần.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/shop')}>Về cửa hàng</button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="product-details-page">
            <Header />
            <main className="product-main container">
                <button className="breadcrumb-back" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Quay lại cửa hàng / {categoryName} / {productName}
                </button>

                <div className="product-details-grid">
                    <div className="gallery-column">
                        <div className="main-image-wrap">
                            {mainImage && !imageBroken ? (
                                <img
                                    src={mainImage}
                                    alt={productName}
                                    className="product-main-image"
                                    onError={() => setImageBroken(true)}
                                />
                            ) : (
                                <div className="product-image-placeholder">
                                    <FiImage size={52} strokeWidth={1.5} />
                                </div>
                            )}
                        </div>

                        <div className="thumb-list">
                            {productImages.length > 0 ? (
                                productImages.map((img, index) => {
                                    const url = img?.image_url || '';
                                    const active = url === mainImage;
                                    return (
                                        <button
                                            key={`${url}-${index}`}
                                            type="button"
                                            className={`thumb-item ${active ? 'active' : ''}`}
                                            onClick={() => {
                                                setImageBroken(false);
                                                setSelectedImageUrl(url);
                                            }}
                                        >
                                            {url ? <img src={url} alt={`${productName}-${index + 1}`} /> : <FiImage />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="thumb-empty">Không có ảnh bổ sung</div>
                            )}
                        </div>
                    </div>

                    <div className="info-column">
                        <h1 className="product-title-large">{productName}</h1>

                        <div className="product-price-row">
                            <span className="product-price-main">{formatCurrency(productPrice)}</span>
                            <span className="price-label">Giá sản phẩm</span>
                        </div>

                        <div className="purchase-row">
                            <div className="quantity-row">
                                <div className="quantity-selector">
                                    <button
                                        className="qty-btn"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                    >
                                        −
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
                                {product.quantity != null && (
                                    <span className="stock-text">Còn {product.quantity} sản phẩm</span>
                                )}
                            </div>

                            <button className="btn btn-primary btn-add-cart" onClick={handleAddToCart}>
                                Thêm vào giỏ hàng
                            </button>

                            <button
                                type="button"
                                className="btn custom-request-link"
                                onClick={() => navigate(`/custom-requests?productId=${product.productId ?? product.id}`)}
                            >
                                Không đúng ý? Đặt làm riêng
                            </button>
                        </div>

                    </div>
                </div>

                <div className="product-details-lower">
                    <section className="product-section">
                        <h3 className="section-title">Thông tin nghệ nhân</h3>
                        <div className="artisan-tag">
                            <span className="artisan-avatar">{getInitials(artisanName)}</span>
                            {artisanId ? (
                                <button
                                    type="button"
                                    className="artisan-name-link"
                                    onClick={() => navigate(`/artisans/${artisanId}`)}
                                >
                                    {artisanName}
                                </button>
                            ) : (
                                <span className="artisan-name-text">{artisanName}</span>
                            )}
                        </div>
                    </section>

                    <hr className="section-divider" />

                    <section className="product-section">
                        <h3 className="section-title">Chi tiết sản phẩm</h3>
                        <div className="spec-grid">
                            {product.size && (
                                <article className="spec-card">
                                    <span className="spec-label">Kích thước</span>
                                    <strong className="spec-value">{product.size}</strong>
                                </article>
                            )}
                            {product.material && (
                                <article className="spec-card">
                                    <span className="spec-label">Chất liệu</span>
                                    <strong className="spec-value">{product.material}</strong>
                                </article>
                            )}
                            {product.quantity != null && (
                                <article className="spec-card">
                                    <span className="spec-label">Số lượng có sẵn</span>
                                    <strong className="spec-value">{product.quantity}</strong>
                                </article>
                            )}
                            <article className="spec-card">
                                <span className="spec-label">Danh mục</span>
                                <strong className="spec-value">{categoryName}</strong>
                            </article>
                        </div>
                    </section>

                    <hr className="section-divider" />

                    <section className="product-section description-block">
                        <h3 className="section-title">Mô tả sản phẩm</h3>
                        <p>{productDescription || 'Chưa có mô tả cho sản phẩm này.'}</p>
                    </section>

                    <hr className="section-divider" />

                    <section className="product-section">
                        <h3 className="section-title">Đánh giá sản phẩm</h3>
                        {productReviews.length === 0 ? (
                            <p className="empty-review-text">Sản phẩm này chưa có đánh giá nào.</p>
                        ) : (
                            <div className="review-list">
                                {productReviews.map((review, index) => (
                                    <article
                                        key={review.reviewId || review.id || `${review.userName || 'review'}-${index}`}
                                        className="review-card"
                                    >
                                        <div className="review-head">
                                            <strong>{review.userName || review.customerName || 'Khách hàng'}</strong>
                                            {review.rating != null && <span>{`★ ${review.rating}/5`}</span>}
                                        </div>
                                        <p>{review.comment || review.content || 'Không có nội dung đánh giá.'}</p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ProductDetailsPage;

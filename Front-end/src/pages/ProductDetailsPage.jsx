import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useCart } from '../context/CartContext';
import './ProductDetailsPage.css';

const MOCK_PRODUCTS = {
    '1': {
        id: '1',
        title: 'Sterling Silver Crucifix',
        artisan: "Maria's Relics",
        price: 89,
        salePrice: 69,
        onSale: true,
        image: '/src/assets/silver-crucifix.png',
        description: 'A beautifully crafted sterling silver crucifix, forged by hand using traditional techniques handed down through generations. Perfect for personal devotion or as a meaningful gift for a loved one. Includes an 18-inch silver chain.',
        materials: ['Sterling Silver .925'],
        dimensions: '2" x 1.2"',
        productionTime: 'Ready to ship'
    },
    '2': {
        id: '2',
        title: 'Hand-Thrown Prayer Bowl',
        artisan: 'Patrick Clay',
        price: 52,
        onSale: false,
        image: '/src/assets/ceramic-bowl.png',
        description: 'Earthy and grounding, this prayer bowl is thrown on a traditional potter\'s wheel and glazed with natural minerals. Ideal for holding rosaries, prayer cards, or small offerings.',
        materials: ['Stoneware Clay', 'Natural Glaze'],
        dimensions: '5" diameter x 2" height',
        productionTime: 'Ready to ship'
    },
    '3': {
        id: '3',
        image: '/src/assets/leather-journal.png',
        title: 'Refillable Leather Journal',
        artisan: 'Augustinian Leather',
        price: 128,
        salePrice: 99,
        onSale: true,
        description: 'A premium full-grain leather journal perfect for spiritual reflections and prayers. Features blind-debossed cross on the cover and includes one inserts of 100gsm acid-free paper.',
        materials: ['Full-grain Vegetable Tanned Leather', 'Acid-free Paper'],
        dimensions: '8.5" x 5.5"',
        productionTime: 'Ready to ship'
    },
    '4': {
        id: '4',
        image: '/src/assets/beeswax-candle.png',
        title: 'Pure Beeswax Altar Candle',
        artisan: 'Trappist Wicks',
        price: 34,
        onSale: false,
        description: '100% pure beeswax pillar candle, poured by hand. These candles burn clean and bright with a subtle, natural honey scent, perfect for home altars or prayer spaces.',
        materials: ['100% Pure Beeswax', 'Cotton Wick'],
        dimensions: '6" height x 3" diameter',
        productionTime: 'Ready to ship'
    }
};

const ProductDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        // Simulate API fetch
        window.scrollTo(0, 0);
        setTimeout(() => {
            const foundProduct = MOCK_PRODUCTS[id];
            setProduct(foundProduct || null);
            setLoading(false);
        }, 500);
    }, [id]);

    const handleAddToCart = () => {
        addToCart({
            ...product,
            price: product.onSale ? product.salePrice : product.price
        }, quantity);
    };

    if (loading) {
        return (
            <div className="product-details-page">
                <Header />
                <div className="product-loading">
                    <div className="spinner"></div>
                    <p>Loading divine craftsmanship...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-details-page">
                <Header />
                <div className="product-not-found">
                    <h2>Artifact Not Found</h2>
                    <p>We couldn't find the sacred item you're looking for.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>Return Home</button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="product-details-page">
            <Header />
            <main className="product-main container">
                <button className="back-link" onClick={() => navigate(-1)}>
                    &larr; Back to Shop
                </button>

                <div className="product-details-grid">
                    {/* Image Section */}
                    <div className="product-image-container">
                        {product.onSale && <div className="badge badge-sale-large">SALE</div>}

                        {product.image ? (
                            <img src={product.image} alt={product.title} className="product-main-image" />
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
                            <h1 className="product-title-large">{product.title}</h1>
                            <p className="product-artisan-link">Crafted by <strong>{product.artisan}</strong></p>
                        </div>

                        <div className="product-price-large">
                            {product.onSale ? (
                                <>
                                    <span className="price-sale">${product.salePrice.toFixed(2)}</span>
                                    <span className="price-original">${product.price.toFixed(2)}</span>
                                </>
                            ) : (
                                <span className="price-regular">${product.price.toFixed(2)}</span>
                            )}
                        </div>

                        <div className="product-description">
                            <p>{product.description}</p>
                        </div>

                        <div className="product-meta">
                            {product.materials && (
                                <div className="meta-item">
                                    <span className="meta-label">Materials:</span>
                                    <span className="meta-value">{product.materials.join(', ')}</span>
                                </div>
                            )}
                            {product.dimensions && (
                                <div className="meta-item">
                                    <span className="meta-label">Dimensions:</span>
                                    <span className="meta-value">{product.dimensions}</span>
                                </div>
                            )}
                            {product.productionTime && (
                                <div className="meta-item">
                                    <span className="meta-label">Availability:</span>
                                    <span className="meta-value">{product.productionTime}</span>
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
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    +
                                </button>
                            </div>
                            <button className="btn btn-primary btn-add-cart" onClick={handleAddToCart}>
                                Add to Cart
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
                                <h4>Love this but want something unique?</h4>
                                <p>You can request a custom version of this item directly from the artisan.</p>
                                <button className="btn btn-outline btn-sm prompt-btn">Request Custom Order</button>
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

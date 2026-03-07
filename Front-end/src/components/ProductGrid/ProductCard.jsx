import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const formatPrice = (val, currency = 'USD') => {
    if (val == null || val === '') return '—';
    const num = typeof val === 'number' ? val : Number(val);
    if (currency === 'VND') {
        return num.toLocaleString('vi-VN') + ' ₫';
    }
    return '$' + num;
};

const ProductCard = ({ id, image, title, artisan, price, salePrice, onSale, currency = 'USD' }) => {
    const priceDisplay = formatPrice(onSale ? salePrice : price, currency);
    const originalPriceDisplay = onSale ? formatPrice(price, currency) : null;
    return (
        <Link to={`/product/${id}`} className="product-card" style={{ textDecoration: 'none' }}>
            <div className="product-image">
                {onSale && <span className="badge badge-sale">SALE</span>}
                {image ? (
                    <img src={image} alt={title} />
                ) : (
                    <div className="product-image-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="product-info">
                <h3 className="product-title">{title}</h3>
                <p className="product-artisan">By {artisan}</p>
                <div className="product-pricing">
                    {onSale ? (
                        <>
                            <span className="product-price product-price-sale">{priceDisplay}</span>
                            <span className="product-price product-price-original">{originalPriceDisplay}</span>
                        </>
                    ) : (
                        <span className="product-price">{priceDisplay}</span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;

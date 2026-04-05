import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiImage } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import './ProductCard.css';

const formatPrice = (val, currency = 'USD') => {
    if (val == null || val === '') return null;
    const num = typeof val === 'number' ? val : Number(val);
    if (currency === 'VND') {
        return num.toLocaleString('vi-VN').replace(/,/g, '.') + ' VNĐ';
    }
    return '$' + num;
};

const ProductCard = ({ id, image, title, category, styleLabel, artisan, artisanLabel = 'By', price, salePrice, onSale, isCustomOrder = false, currency = 'USD', variant = 'default' }) => {
    const { toggleCart } = useCart();
    const priceDisplay = formatPrice(onSale ? salePrice : price, currency);
    const originalPriceDisplay = onSale ? formatPrice(price, currency) : null;

    const showStyleLabel = variant === 'shop' && (styleLabel || category);
    const artisanText = artisan ? (artisanLabel ? `${artisanLabel}: ${artisan}` : artisan) : null;

    return (
        <div className={`product-card ${variant === 'shop' ? 'product-card-shop' : ''}`}>
            <Link to={`/product/${id}`} className="product-card-link" style={{ textDecoration: 'none' }}>
                <div className="product-image">
                    {isCustomOrder && <span className="badge badge-custom-order">ĐẶT LÀM</span>}
                    {onSale && !isCustomOrder && <span className="badge badge-sale">SALE</span>}
                    {image ? (
                        <img src={image} alt={title} />
                    ) : (
                        <div className="product-image-placeholder">
                            <FiImage size={48} strokeWidth={1.5} />
                        </div>
                    )}
                </div>
                <div className="product-info">
                    {showStyleLabel && <p className="product-style-label">{styleLabel || category}</p>}
                    <h3 className="product-title">{title}</h3>
                    {(variant === 'shop' ? artisanText : (category || (artisan && `By ${artisan}`))) && (
                        <p className="product-category">{variant === 'shop' ? artisanText : (category || (artisan && `By ${artisan}`))}</p>
                    )}
                    <div className="product-pricing">
                        {isCustomOrder ? (
                            <span className="product-price product-price-quote">Báo giá theo mẫu</span>
                        ) : onSale ? (
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
            {!isCustomOrder && (
                <button
                    type="button"
                    className="product-card-cart-btn"
                    aria-label="Thêm vào giỏ"
                    onClick={(e) => {
                        e.preventDefault();
                        toggleCart();
                    }}
                >
                    <FiShoppingCart size={20} strokeWidth={2} />
                </button>
            )}
        </div>
    );
};

export default ProductCard;

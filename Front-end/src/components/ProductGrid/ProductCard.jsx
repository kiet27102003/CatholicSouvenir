import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ id, image, title, artisan, price, salePrice, onSale }) => {
    return (
        <Link to={`/product/${id}`} className="product-card" style={{ textDecoration: 'none' }}>
            <div className="product-image">
                {onSale && <span className="badge badge-sale">SALE</span>}
                <img src={image} alt={title} />
            </div>
            <div className="product-info">
                <h3 className="product-title">{title}</h3>
                <p className="product-artisan">By {artisan}</p>
                <div className="product-pricing">
                    {onSale ? (
                        <>
                            <span className="product-price product-price-sale">${salePrice}</span>
                            <span className="product-price product-price-original">${price}</span>
                        </>
                    ) : (
                        <span className="product-price">${price}</span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;

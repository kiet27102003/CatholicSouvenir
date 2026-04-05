import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import './ProductGrid.css';

const featuredProducts = [
    {
        id: 1,
        image: '/src/assets/rosary.png',
        title: 'Chuỗi Hạt Đá Lapis Lazuli',
        category: 'Tràng hạt',
        price: 2500000,
        isCustomOrder: false,
    },
    {
        id: 2,
        image: '/src/assets/silver-crucifix.png',
        title: 'Ảnh Thánh Gia Vàng 24K',
        category: 'Ảnh thánh',
        price: null,
        isCustomOrder: true,
    },
    {
        id: 3,
        image: '/src/assets/statue.png',
        title: 'Tượng Đức Mẹ Ban Ơn',
        category: 'Tượng thánh',
        price: 12000000,
        isCustomOrder: false,
    },
    {
        id: 4,
        image: '/src/assets/textile.png',
        title: 'Áo Lễ Thêu Tay Thủ Công',
        category: 'Phụng vụ',
        price: 1850000,
        isCustomOrder: false,
    },
];

const ProductGrid = () => {
    return (
        <section className="product-grid-section section">
            <div className="container">
                <div className="product-grid-header">
                    <h2 className="section-title">TÁC PHẨM NỔI BẬT</h2>
                    <Link to="/shop" className="product-grid-view-all">
                        XEM TẤT CẢ
                    </Link>
                </div>

                <div className="product-grid">
                    {featuredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            image={product.image}
                            title={product.title}
                            category={product.category}
                            price={product.price}
                            isCustomOrder={product.isCustomOrder}
                            currency="VND"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProductGrid;

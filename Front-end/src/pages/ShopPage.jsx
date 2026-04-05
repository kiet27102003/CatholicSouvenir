import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiGrid, FiLayers, FiImage, FiPackage, FiBriefcase, FiZap } from 'react-icons/fi';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import ProductCard from '../components/ProductGrid/ProductCard';
import productService from '../services/productService';
import aiService from '../services/aiService';
import { useLanguage } from '../context/LanguageContext';
import { appToast } from '../lib/appToast';
import './ShopPage.css';

const CATEGORIES = [
    { id: 'all', label: 'Tất cả', Icon: FiGrid },
    { id: 'rosary', label: 'Chuỗi Mân Côi', Icon: FiLayers },
    { id: 'icon', label: 'Ảnh Thánh', Icon: FiImage },
    { id: 'statue', label: 'Tượng Thánh', Icon: FiPackage },
    { id: 'vestment', label: 'Phẩm Phục', Icon: FiBriefcase },
    { id: 'candle', label: 'Nến', Icon: FiZap },
];

const MATERIALS = ['GỖ', 'CẨM THẠCH', 'BẠC'];

const ShopPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listLoadOk, setListLoadOk] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [aiDescription, setAiDescription] = useState('');
    const [aiStyle, setAiStyle] = useState('');
    const [aiMaterial, setAiMaterial] = useState('');
    const [aiSize, setAiSize] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, [currentPage]);
    useEffect(() => {
        if (aiModalOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [aiModalOpen]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const result = await productService.getProducts();
                if (result.success && Array.isArray(result.data)) {
                    const approved = result.data.filter(
                        (p) => (p.status || '').toUpperCase() === 'APPROVED'
                    );
                    setProducts(approved);
                    setListLoadOk(true);
                } else {
                    setProducts([]);
                    setListLoadOk(false);
                    const msg = result.error != null ? String(result.error) : 'Kiểm tra kết nối mạng';
                    appToast.error('Không tải được', msg);
                }
            } catch (err) {
                const msg = err.message || 'Kiểm tra kết nối mạng';
                appToast.error('Không tải được', msg);
                setProducts([]);
                setListLoadOk(false);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const getProductImage = (product) => {
        if (product.images && product.images.length > 0)
            return product.images[0].imageUrl || product.images[0].image_url;
        if (product.productImages && product.productImages.length > 0) {
            const img = product.productImages[0];
            return img.imageUrl || img.image_url || img.image;
        }
        return product.imageUrl || product.image_url;
    };

    const filteredProducts = useMemo(() => {
        let list = [...products];
        if (selectedMaterial) {
            const mat = selectedMaterial.toLowerCase();
            list = list.filter(
                (p) => (p.material || '').toLowerCase().includes(mat)
            );
        }
        if (sortBy === 'newest') {
            list.sort((a, b) => (b.productId || 0) - (a.productId || 0));
        } else if (sortBy === 'price-asc') {
            list.sort((a, b) => (a.productPrice || 0) - (b.productPrice || 0));
        } else if (sortBy === 'price-desc') {
            list.sort((a, b) => (b.productPrice || 0) - (a.productPrice || 0));
        }
        return list;
    }, [products, selectedMaterial, sortBy]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, currentPage]);

    const getStyleLabel = (product) => {
        if (product.material) return (product.material || '').toUpperCase();
        return 'THỦ CÔNG';
    };

    const handleAiGenerate = async (e) => {
        e.preventDefault();
        setAiResult(null);
        setAiLoading(true);
        try {
            const result = await aiService.generateDesign({
                description: aiDescription,
                style: aiStyle,
                material: aiMaterial,
                size: aiSize,
            });
            if (result.success) setAiResult(result.data);
            else {
                const msg = result.error != null ? String(result.error) : 'Vui lòng thử lại';
                appToast.error('Có lỗi xảy ra', msg);
            }
        } catch (err) {
            const msg = err.message || 'Vui lòng thử lại';
            appToast.error('Có lỗi xảy ra', msg);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="shop-page">
            <Header />
            <main className="shop-main">
                <div className="shop-layout">
                    {/* Sidebar */}
                    <aside className="shop-sidebar">
                        <div className="shop-sidebar-section">
                            <h3 className="shop-sidebar-title">DANH MỤC</h3>
                            <ul className="shop-category-list">
                                {CATEGORIES.map(({ id, label, Icon }) => (
                                    <li key={id}>
                                        <button
                                            type="button"
                                            className={`shop-category-btn ${selectedCategory === id ? 'active' : ''}`}
                                            onClick={() => setSelectedCategory(id)}
                                        >
                                            <span className="shop-category-icon"><Icon size={18} strokeWidth={2} /></span>
                                            {label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="shop-sidebar-section">
                            <h3 className="shop-sidebar-title">BỘ LỌC</h3>
                            <p className="shop-filter-label">Chất liệu</p>
                            <div className="shop-filter-buttons">
                                {MATERIALS.map((mat) => (
                                    <button
                                        key={mat}
                                        type="button"
                                        className={`shop-filter-btn ${selectedMaterial === mat ? 'active' : ''}`}
                                        onClick={() => setSelectedMaterial(selectedMaterial === mat ? null : mat)}
                                    >
                                        {mat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Main content */}
                    <div className="shop-content">
                        <div className="container shop-content-inner">
                            {/* Custom Order Banner */}
                            <div className="shop-custom-order-banner">
                                <div className="shop-custom-order-text">
                                    <h2 className="shop-custom-order-title">Đặt hàng Tác phẩm Riêng</h2>
                                    <p className="shop-custom-order-desc">
                                        Làm việc trực tiếp với các nghệ nhân bậc thầy để tạo nên một di vật thủ công độc bản cho gia đình hoặc giáo xứ của bạn.
                                    </p>
                                    <button type="button" className="shop-ai-link" onClick={() => setAiModalOpen(true)}>
                                        Thử AI gợi ý thiết kế →
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="shop-custom-order-cta"
                                    onClick={() => navigate('/custom-requests')}
                                >
                                    Bắt đầu Đặt hàng
                                </button>
                            </div>

                            {loading ? (
                                <div className="shop-loading">
                                    <div className="spinner" />
                                    <p>{t('shop.loading') || 'Đang tải sản phẩm...'}</p>
                                </div>
                            ) : products.length === 0 && !listLoadOk ? (
                                <div className="shop-empty">
                                    <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                                        {t('shop.retry') || 'Thử lại'}
                                    </button>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="shop-empty">
                                    <p>{t('shop.empty') || 'Chưa có sản phẩm nào được duyệt.'}</p>
                                    <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>
                                        {t('shop.backHome') || 'Về trang chủ'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="shop-header">
                                        <div>
                                            <h1 className="shop-collection-title">Bộ sưu tập Nghệ nhân</h1>
                                            <p className="shop-collection-subtitle">
                                                Khám phá {filteredProducts.length} sản phẩm thủ công độc đáo
                                            </p>
                                        </div>
                                        <div className="shop-sort">
                                            <label htmlFor="shop-sort-select">Sắp xếp:</label>
                                            <select
                                                id="shop-sort-select"
                                                className="shop-sort-select"
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                            >
                                                <option value="newest">Mới nhất</option>
                                                <option value="price-asc">Giá thấp đến cao</option>
                                                <option value="price-desc">Giá cao đến thấp</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="shop-grid">
                                        {paginatedProducts.map((product) => (
                                            <ProductCard
                                                key={product.productId}
                                                id={product.productId}
                                                image={getProductImage(product)}
                                                title={product.productName || '—'}
                                                styleLabel={getStyleLabel(product)}
                                                artisan={product.artisanName || '—'}
                                                artisanLabel="Nghệ nhân"
                                                price={product.productPrice}
                                                currency="VND"
                                                variant="shop"
                                            />
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <nav className="shop-pagination" aria-label="Phân trang">
                                            <button
                                                type="button"
                                                className="shop-pagination-btn"
                                                disabled={currentPage <= 1}
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                aria-label="Trang trước"
                                            >
                                                ←
                                            </button>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let page = i + 1;
                                                if (totalPages > 5 && currentPage > 3) {
                                                    page = Math.min(currentPage - 2 + i, totalPages);
                                                }
                                                return (
                                                    <button
                                                        key={page}
                                                        type="button"
                                                        className={`shop-pagination-btn ${currentPage === page ? 'active' : ''}`}
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                            {totalPages > 5 && <span className="shop-pagination-ellipsis">…</span>}
                                            {totalPages > 5 && (
                                                <button
                                                    type="button"
                                                    className="shop-pagination-btn"
                                                    onClick={() => setCurrentPage(totalPages)}
                                                >
                                                    {totalPages}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="shop-pagination-btn"
                                                disabled={currentPage >= totalPages}
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                aria-label="Trang sau"
                                            >
                                                →
                                            </button>
                                        </nav>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {aiModalOpen && (
                <div className="shop-ai-modal-overlay" onClick={() => setAiModalOpen(false)} role="dialog" aria-modal="true">
                    <div className="shop-ai-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="shop-ai-modal-header">
                            <h2 className="shop-ai-title">{t('shop.aiTitle') || 'Tạo sản phẩm với AI (Demo)'}</h2>
                            <button type="button" className="shop-ai-modal-close" onClick={() => setAiModalOpen(false)} aria-label="Đóng">×</button>
                        </div>
                        <div className="shop-ai-modal-body">
                            <p className="shop-ai-desc">{t('shop.aiDesc') || 'Mô tả ý tưởng, phong cách, chất liệu và kích thước.'}</p>
                            <form className="shop-ai-form" onSubmit={handleAiGenerate}>
                                <div className="shop-ai-field shop-ai-field-wide">
                                    <label htmlFor="modal-ai-description">Mô tả</label>
                                    <textarea id="modal-ai-description" placeholder="Ví dụ: Tượng Đức Mẹ ôm Chúa Hài Đồng" value={aiDescription} onChange={(e) => setAiDescription(e.target.value)} rows={3} disabled={aiLoading} />
                                </div>
                                <div className="shop-ai-field">
                                    <label htmlFor="modal-ai-style">Phong cách</label>
                                    <input id="modal-ai-style" type="text" placeholder="Cổ điển, tối giản" value={aiStyle} onChange={(e) => setAiStyle(e.target.value)} disabled={aiLoading} />
                                </div>
                                <div className="shop-ai-field">
                                    <label htmlFor="modal-ai-material">Chất liệu</label>
                                    <input id="modal-ai-material" type="text" placeholder="Gỗ, gốm, đồng" value={aiMaterial} onChange={(e) => setAiMaterial(e.target.value)} disabled={aiLoading} />
                                </div>
                                <div className="shop-ai-field">
                                    <label htmlFor="modal-ai-size">Kích thước</label>
                                    <input id="modal-ai-size" type="text" placeholder="20cm, nhỏ vừa" value={aiSize} onChange={(e) => setAiSize(e.target.value)} disabled={aiLoading} />
                                </div>
                                <button type="submit" className="btn btn-primary shop-ai-submit" disabled={aiLoading}>
                                    {aiLoading ? 'Đang tạo...' : 'Tạo thiết kế'}
                                </button>
                            </form>
                            {aiResult != null && (
                                <div className="shop-ai-result">
                                    <h3>Kết quả gợi ý</h3>
                                    {(aiResult.imageUrl || aiResult.image_url || aiResult.url) ? (
                                        <img src={aiResult.imageUrl || aiResult.image_url || aiResult.url} alt="Thiết kế AI" className="shop-ai-result-image" />
                                    ) : (
                                        <pre className="shop-ai-result-json">{JSON.stringify(aiResult, null, 2)}</pre>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopPage;

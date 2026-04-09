import React, { useMemo, useState, useEffect } from 'react';
import { FiImage, FiArrowLeft } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useCart } from '../context/CartContext';
import productService from '../services/productService';
import templateService from '../services/templateService';
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

const normalizeZone = (zone) => ({
    zoneId: zone?.zoneId || zone?.id || zone?.uuid || '',
    zoneName: zone?.zoneName || zone?.name || 'Yêu cầu thêm',
    zoneDescription: zone?.zoneDescription || zone?.description || '',
    inputType: zone?.inputType || 'TEXT',
    isRequired: Boolean(zone?.isRequired),
    extraPrice: Number(zone?.extraPrice || 0),
    sortOrder: Number(zone?.sortOrder || 0),
    inputConstraints: typeof zone?.inputConstraints === 'object' && zone?.inputConstraints != null
        ? zone.inputConstraints
        : {},
});

const getTemplateZones = (template) => {
    const raw = Array.isArray(template?.customZones)
        ? template.customZones
        : Array.isArray(template?.zones)
            ? template.zones
            : [];
    return raw.map(normalizeZone).sort((a, b) => a.sortOrder - b.sortOrder);
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

    const [zoneLoading, setZoneLoading] = useState(false);
    const [templateZones, setTemplateZones] = useState([]);
    const [zoneInputs, setZoneInputs] = useState({});

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (!id) {
            setProduct(null);
            setTemplateZones([]);
            setZoneInputs({});
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

    useEffect(() => {
        if (!product) {
            setTemplateZones([]);
            setZoneInputs({});
            return;
        }

        const fetchZonesByCategory = async () => {
            const productCategoryId = String(product?.categoryId || product?.category?.id || '').trim();
            if (!productCategoryId) {
                setTemplateZones([]);
                setZoneInputs({});
                return;
            }

            setZoneLoading(true);
            try {
                const templatesResult = await templateService.getTemplates({ categoryId: productCategoryId, size: 100, page: 0 });
                if (!templatesResult.success) {
                    setTemplateZones([]);
                    return;
                }

                const templates = templatesResult?.data?.content || [];
                const selectedTemplate = templates.find((item) => item?.isActive !== false) || templates[0];
                if (!selectedTemplate) {
                    setTemplateZones([]);
                    setZoneInputs({});
                    return;
                }

                const detailResult = await templateService.getTemplateById(selectedTemplate.templateId || selectedTemplate.id);
                if (!detailResult.success) {
                    setTemplateZones([]);
                    return;
                }

                const zones = getTemplateZones(detailResult.data || selectedTemplate);
                setTemplateZones(zones);
                setZoneInputs((prev) => {
                    const next = {};
                    zones.forEach((zone) => {
                        const key = zone.zoneId || zone.zoneName;
                        next[key] = prev[key] ?? '';
                    });
                    return next;
                });
            } catch {
                setTemplateZones([]);
            } finally {
                setZoneLoading(false);
            }
        };

        fetchZonesByCategory();
    }, [product]);

    const handleAddToCart = () => {
        if (!product) return;

        const missingRequired = templateZones.find((zone) => {
            if (!zone.isRequired) return false;
            const key = zone.zoneId || zone.zoneName;
            return String(zoneInputs[key] || '').trim() === '';
        });

        if (missingRequired) {
            appToast.warning(`Vui lòng điền ${missingRequired.zoneName}`);
            return;
        }

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
            basePrice: productPrice,
            finalUnitPrice: totalPrice,
            zonePriceBreakdown: zoneChargeRows,
            image,
            artisan,
            customRequests: zoneInputs,
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

    const zoneChargeRows = useMemo(() => {
        return templateZones
            .filter((zone) => Number(zone.extraPrice || 0) > 0 && String(zoneInputs[zone.zoneId || zone.zoneName] || '').trim() !== '')
            .map((zone) => ({
                key: zone.zoneId || zone.zoneName,
                label: zone.zoneName,
                amount: Number(zone.extraPrice || 0),
            }));
    }, [templateZones, zoneInputs]);

    const totalPrice = useMemo(() => {
        return Number(productPrice || 0) + zoneChargeRows.reduce((sum, item) => sum + item.amount, 0);
    }, [productPrice, zoneChargeRows]);

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

                        <h1 className="product-title-large">{productName}</h1>

                        <div className="product-price-row">
                            <span className="product-price-main">{formatCurrency(productPrice)}</span>
                            <span className="price-label">Giá cơ bản</span>
                        </div>

                        <hr className="section-divider" />

                        {productDescription && (
                            <section className="description-block">
                                <p>{productDescription}</p>
                            </section>
                        )}

                        <section className="spec-grid">
                            {product.size && (
                                <article className="spec-card">
                                    <span className="spec-label">Kích thước</span>
                                    <strong className="spec-value">{product.size}</strong>
                                </article>
                            )}
                            {product.quantity != null && (
                                <article className="spec-card">
                                    <span className="spec-label">Số lượng có sẵn</span>
                                    <strong className="spec-value">{product.quantity}</strong>
                                </article>
                            )}
                        </section>

                        <hr className="section-divider" />

                        <section className="zones-section">
                            <h3 className="section-title">Yêu cầu thêm</h3>

                            {zoneLoading ? (
                                <p className="empty-zone-text">Đang tải yêu cầu thêm...</p>
                            ) : templateZones.length === 0 ? (
                                <p className="empty-zone-text">Sản phẩm này hiện chưa có yêu cầu thêm.</p>
                            ) : (
                                <div className="zone-list">
                                    {templateZones.map((zone) => {
                                        const key = zone.zoneId || zone.zoneName;
                                        const type = String(zone.inputType || 'TEXT').toUpperCase();
                                        const currentValue = zoneInputs[key] ?? '';

                                        const inputProps = {
                                            value: currentValue,
                                            onChange: (e) => setZoneInputs((prev) => ({ ...prev, [key]: e.target.value })),
                                        };

                                        return (
                                            <article key={key} className="zone-card">
                                                <div className="zone-card-head">
                                                    <div className="zone-title-wrap">
                                                        <strong>{zone.zoneName}</strong>
                                                        <span className={`zone-badge ${zone.isRequired ? 'required' : 'optional'}`}>
                                                            {zone.isRequired ? 'Bắt buộc' : 'Tuỳ chọn'}
                                                        </span>
                                                    </div>
                                                    {Number(zone.extraPrice || 0) > 0 && (
                                                        <span className="zone-price">+{formatCurrency(zone.extraPrice)}</span>
                                                    )}
                                                </div>

                                                {zone.zoneDescription && <p className="zone-description">{zone.zoneDescription}</p>}

                                                {type === 'NUMBER' ? (
                                                    <input type="number" className="zone-input" {...inputProps} />
                                                ) : type === 'COLOR' ? (
                                                    <input type="color" className="zone-input zone-input-color" {...inputProps} />
                                                ) : type === 'IMAGE' ? (
                                                    <input type="url" className="zone-input" placeholder="Nhập URL hình ảnh" {...inputProps} />
                                                ) : (
                                                    <input type="text" className="zone-input" placeholder="Nhập yêu cầu" {...inputProps} />
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="price-summary">
                            <div className="price-row">
                                <span>Giá cơ bản</span>
                                <span>{formatCurrency(productPrice)}</span>
                            </div>
                            {zoneChargeRows.map((row) => (
                                <div key={row.key} className="price-row">
                                    <span>{row.label}</span>
                                    <span>+{formatCurrency(row.amount)}</span>
                                </div>
                            ))}
                            <div className="price-row total">
                                <span>Tổng</span>
                                <span>{formatCurrency(totalPrice)}</span>
                            </div>
                        </section>

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
                        </div>


                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ProductDetailsPage;

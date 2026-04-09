import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiImage } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import './ProductCard.css';

const HOVER_TRIGGER_MS = 1200;
const CLOSE_DELAY_MS = 100;

const formatPrice = (val, currency = 'USD') => {
    if (val == null || val === '') return null;
    const num = typeof val === 'number' ? val : Number(val);
    if (currency === 'VND') {
        return num.toLocaleString('vi-VN').replace(/,/g, '.') + ' VNĐ';
    }
    return '$' + num;
};

const ProductCard = ({
    id,
    image,
    title,
    description,
    rating,
    reviewCount,
    category,
    categoryName,
    styleLabel,
    artisan,
    artisanName,
    artisanLabel = 'By',
    productName,
    productDescription,
    productPrice,
    quantity,
    size,
    tags,
    price,
    salePrice,
    onSale,
    isCustomOrder = false,
    currency = 'USD',
    variant = 'default',
}) => {
    const { toggleCart, addToCart } = useCart();
    const navigate = useNavigate();

    const shellRef = useRef(null);
    const progressRafRef = useRef(null);
    const progressStartRef = useRef(0);
    const closeTimerRef = useRef(null);

    const [imageBroken, setImageBroken] = useState(false);
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [hoverProgress, setHoverProgress] = useState(0);
    const [isHoveringCard, setIsHoveringCard] = useState(false);
    const [isHoveringModal, setIsHoveringModal] = useState(false);
    const [quickViewOpen, setQuickViewOpen] = useState(false);

    const displayProductName = productName || title || '—';
    const displayDescription = (productDescription || description || '—').trim() || '—';
    const displayRating = rating ?? '—';
    const displayReviewCount = reviewCount ?? '—';
    const displayCategory = categoryName || category || styleLabel || '—';
    const displayArtisan = artisanName || artisan || '—';
    const displayPriceValue = onSale ? salePrice : (productPrice ?? price);
    const displayQuantity = quantity ?? '—';
    const displaySize = size || '—';
    const displayTags = useMemo(() => (Array.isArray(tags) ? tags.filter(Boolean) : []), [tags]);

    const priceDisplay = formatPrice(displayPriceValue, currency);
    const originalPriceDisplay = onSale ? formatPrice(productPrice ?? price, currency) : null;
    const showStyleLabel = variant === 'shop' && (styleLabel || category);
    const artisanText = artisan ? (artisanLabel ? `${artisanLabel}: ${artisan}` : artisan) : null;

    useEffect(() => {
        const rafId = window.requestAnimationFrame(() => {
            setImageBroken(false);
        });
        return () => window.cancelAnimationFrame(rafId);
    }, [image]);

    useEffect(() => {
        const media = window.matchMedia('(hover: none), (pointer: coarse)');
        const updateTouch = () => setIsTouchDevice(media.matches);
        updateTouch();
        media.addEventListener('change', updateTouch);
        return () => media.removeEventListener('change', updateTouch);
    }, []);

    useEffect(() => {
        return () => {
            if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current);
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    const stopProgress = () => {
        if (progressRafRef.current) {
            cancelAnimationFrame(progressRafRef.current);
            progressRafRef.current = null;
        }
    };

    const resetProgress = () => {
        stopProgress();
        setHoverProgress(0);
    };

    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const closeQuickView = () => {
        setQuickViewOpen(false);
        setIsHoveringModal(false);
        resetProgress();
    };

    const scheduleCloseQuickView = () => {
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            if (!isHoveringCard && !isHoveringModal) {
                closeQuickView();
            }
        }, CLOSE_DELAY_MS);
    };

    const startHoverProgress = () => {
        if (isTouchDevice || quickViewOpen || isCustomOrder) return;
        resetProgress();
        progressStartRef.current = performance.now();

        const tick = (ts) => {
            if (!isHoveringCard) {
                resetProgress();
                return;
            }
            const elapsed = ts - progressStartRef.current;
            const p = Math.min(elapsed / HOVER_TRIGGER_MS, 1);
            setHoverProgress(p);
            if (p >= 1) {
                setQuickViewOpen(true);
                stopProgress();
                return;
            }
            progressRafRef.current = requestAnimationFrame(tick);
        };

        progressRafRef.current = requestAnimationFrame(tick);
    };

    const updateCursorPosition = (e) => {
        if (isTouchDevice || !shellRef.current) return;
        const rect = shellRef.current.getBoundingClientRect();
        setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const addProductToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
            id,
            title: displayProductName,
            price: Number(displayPriceValue) || 0,
            image,
            artisan: displayArtisan,
        });
        setOverlayOpen(false);
    };

    return (
        <div
            ref={shellRef}
            className={`product-card-shell ${quickViewOpen ? 'is-quick-view-open' : ''}`}
            onMouseEnter={(e) => {
                setIsHoveringCard(true);
                clearCloseTimer();
                updateCursorPosition(e);
                if (!quickViewOpen) startHoverProgress();
            }}
            onMouseMove={updateCursorPosition}
            onMouseLeave={() => {
                setIsHoveringCard(false);
                if (!quickViewOpen) {
                    resetProgress();
                } else {
                    scheduleCloseQuickView();
                }
            }}
        >
            {!isTouchDevice && isHoveringCard && !quickViewOpen && !isCustomOrder && (
                <div
                    className="product-hover-progress-cursor"
                    style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
                >
                    <svg viewBox="0 0 44 44" className="product-hover-progress-ring" aria-hidden="true">
                        <circle className="ring-track" cx="22" cy="22" r="18" />
                        <circle
                            className="ring-progress"
                            cx="22"
                            cy="22"
                            r="18"
                            style={{ strokeDashoffset: `${113.097 - 113.097 * hoverProgress}` }}
                        />
                    </svg>
                </div>
            )}

            <div className={`product-card ${variant === 'shop' ? 'product-card-shop' : ''} ${overlayOpen ? 'is-overlay-open' : ''}`}>
                <Link to={`/product/${id}`} className="product-card-link" style={{ textDecoration: 'none' }}>
                    <div
                        className="product-image"
                        onClick={(e) => {
                            if (isTouchDevice && !overlayOpen) {
                                e.preventDefault();
                                setOverlayOpen(true);
                            }
                        }}
                    >
                        {isCustomOrder && <span className="badge badge-custom-order">ĐẶT LÀM</span>}
                        {onSale && !isCustomOrder && <span className="badge badge-sale">SALE</span>}
                        {image && !imageBroken ? (
                            <img src={image} alt={displayProductName} onError={() => setImageBroken(true)} />
                        ) : (
                            <div className="product-image-placeholder">
                                <FiImage size={48} strokeWidth={1.5} />
                            </div>
                        )}

                        <div className="product-image-overlay">
                            <div className="product-overlay-content">
                                <h4 className="product-overlay-title">{displayProductName}</h4>
                                <p className="product-overlay-description">{displayDescription}</p>
                                <p className="product-overlay-rating">⭐ {displayRating} ({displayReviewCount} đánh giá)</p>
                                <div className="product-overlay-actions">
                                    <button
                                        type="button"
                                        className="product-overlay-btn product-overlay-btn-outline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(`/product/${id}`);
                                        }}
                                    >
                                        Xem chi tiết
                                    </button>
                                    <button
                                        type="button"
                                        className="product-overlay-btn product-overlay-btn-filled"
                                        onClick={addProductToCart}
                                    >
                                        Thêm vào giỏ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="product-info">
                        {showStyleLabel && <p className="product-style-label">{styleLabel || category}</p>}
                        <h3 className="product-title">{displayProductName}</h3>
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
                            e.stopPropagation();
                            toggleCart();
                        }}
                    >
                        <FiShoppingCart size={20} strokeWidth={2} />
                    </button>
                )}
            </div>

            {quickViewOpen && (
                <div
                    className="product-quick-view-pop"
                    onMouseEnter={() => {
                        clearCloseTimer();
                        setIsHoveringModal(true);
                    }}
                    onMouseLeave={() => {
                        setIsHoveringModal(false);
                        scheduleCloseQuickView();
                    }}
                >
                    <h4 className="quick-view-title">{displayProductName}</h4>
                    <p><strong>Artisan:</strong> {displayArtisan}</p>
                    <p><strong>Category:</strong> {displayCategory}</p>
                    <p><strong>Mô tả:</strong> {displayDescription}</p>
                    <p><strong>Giá:</strong> {priceDisplay || '—'}</p>
                    <p><strong>Số lượng:</strong> {displayQuantity}</p>
                    <p><strong>Kích thước:</strong> {displaySize}</p>
                    <p><strong>Tags:</strong> {displayTags.length ? displayTags.join(', ') : '—'}</p>
                    <div className="quick-view-actions">
                        <button type="button" className="product-overlay-btn product-overlay-btn-outline" onClick={() => navigate(`/product/${id}`)}>
                            Xem chi tiết
                        </button>
                        {!isCustomOrder && (
                            <button
                                type="button"
                                className="product-overlay-btn product-overlay-btn-filled"
                                onClick={(e) => {
                                    addProductToCart(e);
                                    closeQuickView();
                                }}
                            >
                                Thêm vào giỏ
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCard;

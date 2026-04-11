import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiShoppingCart, FiImage } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import './CartDrawer.css';

const CartDrawer = () => {
    const {
        cartItems,
        isCartOpen,
        setCartOpen,
        cartTotalAmount,
        removeFromCart,
        updateQuantity,
    } = useCart();
    const { isAuthenticated } = useAuth();

    const navigate = useNavigate();
    const [navigating, setNavigating] = useState(false);

    useEffect(() => {
        if (!isCartOpen) return undefined;

        const bodyStyle = document.body.style;
        const htmlStyle = document.documentElement.style;

        const prevBodyOverflow = bodyStyle.overflow;
        const prevBodyHeight = bodyStyle.height;
        const prevHtmlOverflow = htmlStyle.overflow;
        const prevHtmlHeight = htmlStyle.height;

        bodyStyle.overflow = 'hidden';
        bodyStyle.height = '100%';
        htmlStyle.overflow = 'hidden';
        htmlStyle.height = '100%';

        return () => {
            bodyStyle.overflow = prevBodyOverflow;
            bodyStyle.height = prevBodyHeight;
            htmlStyle.overflow = prevHtmlOverflow;
            htmlStyle.height = prevHtmlHeight;
        };
    }, [isCartOpen]);

    if (!isCartOpen) return null;

    const isGuestView = !isAuthenticated;
    const isCartEmpty = cartItems.length === 0;
    const disableActions = navigating || isCartEmpty || isGuestView;

    const closeThenNavigate = (to) => {
        try {
            setNavigating(true);
            setCartOpen(false);
            window.setTimeout(() => {
                navigate(to);
                setNavigating(false);
            }, 260);
        } catch (error) {
            setNavigating(false);
            appToast.error('Không thể điều hướng', error?.message || 'Vui lòng thử lại');
            navigate('/cart');
        }
    };

    const handleViewCart = () => closeThenNavigate('/cart');
    const handleCheckout = () => closeThenNavigate('/checkout');

    return (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
            <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="cart-header">
                    <h2>Your Cart</h2>
                    <button className="close-cart-btn" onClick={() => setCartOpen(false)}>
                        <FiX size={24} strokeWidth={2} />
                    </button>
                </div>

                <div className="cart-body">
                    {isGuestView ? (
                        <div className="empty-cart">
                            <FiShoppingCart size={48} strokeWidth={1.5} />
                            <p>Vui lòng đăng nhập trước khi dùng tính năng này</p>
                        </div>
                    ) : isCartEmpty ? (
                        <div className="empty-cart">
                            <FiShoppingCart size={48} strokeWidth={1.5} />
                            <p>Giỏ hàng của bạn đang trống</p>
                            <button className="btn btn-primary" onClick={() => { setCartOpen(false); navigate('/'); }}>
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="cart-items-list">
                            {cartItems.map((item) => (
                                <div key={item.productId || item.id} className="cart-item">
                                    <div className="cart-item-image">
                                        {item.image || item.imageUrl ? (
                                            <img src={item.image || item.imageUrl} alt={item.title || item.productName} />
                                        ) : (
                                            <div className="cart-item-image-placeholder">
                                                <FiImage size={32} strokeWidth={1.5} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="cart-item-details">
                                        <h4>{item.title || item.productName}</h4>
                                        <p className="cart-item-artisan">by {item.artisan || item.artisanName || 'Sanctus Artisan'}</p>
                                        <div className="cart-item-price">{(item.totalPrice ?? item.price ?? 0).toLocaleString('vi-VN')} ₫</div>

                                        <div className="cart-item-actions">
                                            <div className="quantity-controls">
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                >
                                                    -
                                                </button>
                                                <span className="qty-value">{item.quantity}</span>
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                className="remove-btn"
                                                onClick={() => removeFromCart(item.productId)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="cart-footer">
                    <div className="cart-subtotal">
                        <span>Tạm tính</span>
                        <span className="subtotal-amount">{isGuestView ? '0 ₫' : `${cartTotalAmount.toLocaleString('vi-VN')} ₫`}</span>
                    </div>
                    <p className="shipping-note">
                        {isGuestView
                            ? 'Vui lòng đăng nhập trước khi dùng tính năng này'
                            : isCartEmpty
                                ? 'Giỏ hàng của bạn đang trống'
                                : 'Phí vận chuyển & thuế tính khi thanh toán'}
                    </p>

                    <div className="cart-footer-actions">
                        <button
                            className="btn btn-primary btn-checkout"
                            onClick={handleCheckout}
                            disabled={disableActions}
                        >
                            {navigating ? 'Đang chuyển trang...' : 'Tiến hành thanh toán'}
                        </button>
                        <button
                            className="btn btn-outline btn-view-cart"
                            onClick={handleViewCart}
                            disabled={disableActions}
                        >
                            Xem giỏ hàng đầy đủ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartDrawer;

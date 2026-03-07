import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './CartDrawer.css';

const CartDrawer = () => {
    const {
        cartItems,
        isCartOpen,
        setCartOpen,
        cartTotalAmount,
        removeFromCart,
        updateQuantity
    } = useCart();

    const navigate = useNavigate();

    if (!isCartOpen) return null;

    const handleCheckout = () => {
        setCartOpen(false);
        navigate('/checkout', {
            state: {
                amount: cartTotalAmount,
                isCustom: false,
                title: cartItems.length === 1 ? cartItems[0].title : `Order with ${cartItems.length} items`
            }
        });
    };

    return (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
            <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="cart-header">
                    <h2>Your Cart</h2>
                    <button className="close-cart-btn" onClick={() => setCartOpen(false)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="cart-body">
                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            <p>Your cart is empty.</p>
                            <button className="btn btn-primary" onClick={() => { setCartOpen(false); navigate('/'); }}>
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="cart-items-list">
                            {cartItems.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-image">
                                        {item.image ? (
                                            <img src={item.image} alt={item.title} />
                                        ) : (
                                            <div className="cart-item-image-placeholder">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    <div className="cart-item-details">
                                        <h4>{item.title}</h4>
                                        <p className="cart-item-artisan">by {item.artisan || 'Sanctus Artisan'}</p>
                                        <div className="cart-item-price">{(item.price ?? 0).toLocaleString('vi-VN')} ₫</div>

                                        <div className="cart-item-actions">
                                            <div className="quantity-controls">
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    -
                                                </button>
                                                <span className="qty-value">{item.quantity}</span>
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                className="remove-btn"
                                                onClick={() => removeFromCart(item.id)}
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

                {cartItems.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-subtotal">
                            <span>Subtotal</span>
                            <span className="subtotal-amount">{cartTotalAmount.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <p className="shipping-note">Shipping & taxes calculated at checkout</p>
                        <button className="btn btn-primary btn-checkout" onClick={handleCheckout}>
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiShoppingCart, FiImage } from 'react-icons/fi';
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
                        <FiX size={24} strokeWidth={2} />
                    </button>
                </div>

                <div className="cart-body">
                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <FiShoppingCart size={48} strokeWidth={1.5} />
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
                                                <FiImage size={32} strokeWidth={1.5} />
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

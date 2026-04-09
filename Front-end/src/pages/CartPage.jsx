import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiImage, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import cartService from '../services/cartService';
import { appToast } from '../lib/appToast';
import './CartPage.css';

const formatVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const CartPage = () => {
    const navigate = useNavigate();
    const {
        items,
        selectedItems,
        subtotal,
        toggleSelect,
        toggleSelectAll,
        updateQuantity,
        removeItem,
        clearCart,
    } = useCart();

    const [coupon, setCoupon] = useState('');
    const [checkingOut, setCheckingOut] = useState(false);
    const [confirmClearOpen, setConfirmClearOpen] = useState(false);

    const selectedCount = selectedItems.length;
    const allCount = items.length;
    const selectedQty = useMemo(
        () => selectedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        [selectedItems]
    );

    const handleCheckoutSelected = async () => {
        if (selectedItems.length === 0) {
            appToast.warning('Vui lòng chọn sản phẩm để thanh toán');
            return;
        }

        setCheckingOut(true);
        try {
            const productIds = selectedItems.map((i) => i.productId);
            const result = await cartService.checkoutCart(productIds);
            if (!result.success) {
                appToast.error('Thanh toán thất bại', result.error || 'Vui lòng thử lại');
                return;
            }
            navigate('/checkout');
        } catch (error) {
            appToast.error('Thanh toán thất bại', error?.message || 'Vui lòng thử lại');
        } finally {
            setCheckingOut(false);
        }
    };

    const handleApplyCoupon = () => {
        if (!coupon.trim()) {
            appToast.warning('Vui lòng nhập mã giảm giá');
            return;
        }
        appToast.info('Tính năng đang phát triển');
    };

    const handleRemove = async (productId) => {
        await removeItem(productId);
        appToast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    };

    const handleUpdateQty = async (productId, nextQty) => {
        if (nextQty <= 0) {
            await handleRemove(productId);
            return;
        }
        await updateQuantity(productId, nextQty);
    };

    const handleClearAll = async () => {
        await clearCart();
        setConfirmClearOpen(false);
        appToast.success('Đã xóa toàn bộ giỏ hàng');
    };

    return (
        <div className="cart-page">
            <main className="container cart-main">
                <button type="button" className="cart-back" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Tiếp tục mua sắm
                </button>

                <header className="cart-header-block">
                    <h1>Giỏ hàng</h1>
                    <p>{allCount} sản phẩm đang chờ thanh toán</p>
                </header>

                {items.length === 0 ? (
                    <div className="cart-empty-state">
                        <FiShoppingCart size={52} />
                        <h3>Giỏ hàng của bạn đang trống</h3>
                        <button type="button" className="btn btn-primary" onClick={() => navigate('/shop')}>
                            Khám phá sản phẩm
                        </button>
                    </div>
                ) : (
                    <div className="cart-layout">
                        <section className="cart-table-card">
                            <div className="cart-table-head">
                                <label className="select-all">
                                    <input
                                        type="checkbox"
                                        checked={allCount > 0 && items.every((i) => i.selected)}
                                        onChange={toggleSelectAll}
                                    />
                                    <span>Chọn tất cả ({allCount} sản phẩm)</span>
                                </label>
                            </div>

                            <div className="cart-table">
                                <div className="cart-row cart-row-header">
                                    <div>Sản phẩm</div>
                                    <div>Đơn giá</div>
                                    <div>Số lượng</div>
                                    <div>Thành tiền</div>
                                    <div></div>
                                </div>

                                {items.map((item) => (
                                    <div key={`${item.productId}-${item.productName}`} className="cart-row">
                                        <div className="product-cell">
                                            <input
                                                type="checkbox"
                                                checked={!!item.selected}
                                                onChange={() => toggleSelect(item.productId)}
                                            />
                                            <div className="thumb-wrap">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.productName} />
                                                ) : (
                                                    <div className="thumb-placeholder"><FiImage /></div>
                                                )}
                                            </div>
                                            <div>
                                                <h4>{item.productName}</h4>
                                                <p>{item.artisanName || 'Sanctus Artisan'}</p>
                                                {item.zoneInputs?.length > 0 && (
                                                    <p className="zone-summary">
                                                        {item.zoneInputs.map((z) => `${z.zoneName}: ${z.value || '—'}`).join(' · ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div>{formatVnd(item.basePrice)}</div>
                                        <div>
                                            <div className="qty-control">
                                                <button type="button" onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}>-</button>
                                                <span>{item.quantity}</span>
                                                <button type="button" onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}>+</button>
                                            </div>
                                        </div>
                                        <div className="line-price">{formatVnd(item.totalPrice)}</div>
                                        <div>
                                            <button type="button" className="icon-btn" onClick={() => handleRemove(item.productId)}>
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="cart-table-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setConfirmClearOpen(true)}>
                                    Xóa toàn bộ giỏ hàng
                                </button>
                                <span>Đã chọn {selectedCount}/{allCount} sản phẩm</span>
                            </div>
                        </section>

                        <aside className="cart-summary-column">
                            <div className="summary-card">
                                <h3>Tóm tắt đơn hàng</h3>
                                <div className="summary-row">
                                    <span>Tạm tính ({selectedQty} sp đã chọn)</span>
                                    <span>{formatVnd(subtotal)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Phí vận chuyển</span>
                                    <span>Tính khi checkout</span>
                                </div>
                                <div className="summary-row">
                                    <span>Giảm giá</span>
                                    <span>—</span>
                                </div>
                                <div className="summary-divider" />
                                <div className="summary-row total">
                                    <span>Tổng cộng</span>
                                    <span>{formatVnd(subtotal)}</span>
                                </div>
                                <p className="summary-note">Đã bao gồm VAT (nếu có)</p>
                                <button
                                    type="button"
                                    className="btn btn-primary summary-checkout"
                                    disabled={checkingOut || selectedItems.length === 0}
                                    onClick={handleCheckoutSelected}
                                >
                                    {checkingOut ? 'Đang xử lý...' : `Thanh toán (${selectedItems.length} sản phẩm)`}
                                </button>
                            </div>

                            <div className="summary-card">
                                <h3>Mã giảm giá</h3>
                                <div className="coupon-row">
                                    <input
                                        type="text"
                                        value={coupon}
                                        onChange={(e) => setCoupon(e.target.value)}
                                        placeholder="Nhập mã giảm giá"
                                    />
                                    <button type="button" className="btn btn-outline" onClick={handleApplyCoupon}>Áp dụng</button>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </main>

            {confirmClearOpen && (
                <div className="cart-confirm-overlay" onClick={() => setConfirmClearOpen(false)}>
                    <div className="cart-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h4>Xóa toàn bộ giỏ hàng?</h4>
                        <p>Hành động này không thể hoàn tác.</p>
                        <div className="confirm-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setConfirmClearOpen(false)}>Hủy</button>
                            <button type="button" className="btn btn-primary" onClick={handleClearAll}>Xóa tất cả</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;

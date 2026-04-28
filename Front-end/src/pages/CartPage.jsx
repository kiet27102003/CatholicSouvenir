import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiImage, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useCart } from '../context/CartContext';
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
        clearSelectedItems,
    } = useCart();

    const [coupon, setCoupon] = useState('');
    const [checkingOut, setCheckingOut] = useState(false);
    const [confirmClearOpen, setConfirmClearOpen] = useState(false);
    const [confirmItemDeleteOpen, setConfirmItemDeleteOpen] = useState(false);
    const [pendingDeleteItem, setPendingDeleteItem] = useState(null);
    const [confirmSelectedDeleteOpen, setConfirmSelectedDeleteOpen] = useState(false);

    const selectedCount = selectedItems.length;
    const allCount = items.length;
    const selectedQty = useMemo(
        () => selectedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        [selectedItems]
    );
    const hasUnavailableItems = items.some((item) => Number(item.quantity) > Number(item.availableStock ?? Infinity));

    const handleCheckoutSelected = async () => {
        if (selectedItems.length === 0) {
            appToast.warning('Vui lòng chọn sản phẩm để thanh toán');
            return;
        }

        setCheckingOut(true);
        try {
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

    const handleRemove = async (cartItemId) => {
        await removeItem(cartItemId);
        appToast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    };

    const openItemDeleteConfirm = (item) => {
        setPendingDeleteItem(item);
        setConfirmItemDeleteOpen(true);
    };

    const handleConfirmItemDelete = async () => {
        if (!pendingDeleteItem) return;
        await handleRemove(pendingDeleteItem.cartItemId || pendingDeleteItem.productId);
        setConfirmItemDeleteOpen(false);
        setPendingDeleteItem(null);
    };

    const openSelectedDeleteConfirm = () => {
        if (selectedItems.length === 0) {
            appToast.warning('Vui lòng chọn sản phẩm để xóa');
            return;
        }
        setConfirmSelectedDeleteOpen(true);
    };

    const handleConfirmSelectedDelete = async () => {
        await clearSelectedItems(selectedItems.map((item) => item.cartItemId));
        setConfirmSelectedDeleteOpen(false);
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
            <Header />
            <main className="container cart-main">
                <button type="button" className="cart-back" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Tiếp tục mua sắm
                </button>

                <header className="cart-hero">
                    <div>
                        <span className="cart-kicker">Giỏ hàng đầy đủ</span>
                        <h1>Kiểm tra lại đơn hàng trước khi thanh toán</h1>
                        <p>{allCount} sản phẩm đang chờ thanh toán</p>
                    </div>
                    <div className="cart-hero-badge">
                        <FiCheckCircle />
                        <span>{selectedCount} sản phẩm đã chọn</span>
                    </div>
                </header>

                {hasUnavailableItems && (
                    <div className="cart-warning-banner" role="alert">
                        <strong>Một số sản phẩm đã hết hàng.</strong>
                        <p>Vui lòng xóa hoặc điều chỉnh các sản phẩm không còn đủ tồn kho trước khi thanh toán.</p>
                    </div>
                )}

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
                                <button
                                    type="button"
                                    className="btn btn-outline cart-clear-selected"
                                    onClick={openSelectedDeleteConfirm}
                                    disabled={selectedItems.length === 0}
                                >
                                    Xóa sản phẩm đã chọn
                                </button>
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
                                    <div key={item.cartItemId || `${item.productId}-${item.productName}`} className="cart-row">
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
                                                <h4>{item.productName || item.templateName || 'Sản phẩm'}</h4>
                                                <p>{item.artisanName || 'Sanctus Artisan'}</p>
                                                {item.availableStock != null && (
                                                    <p className={`cart-stock-text ${item.isAvailable === false ? 'is-out' : ''}`}>
                                                        {item.isAvailable === false ? 'Hết hàng' : `Còn ${item.availableStock} sản phẩm`}
                                                    </p>
                                                )}
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
                                                <button type="button" onClick={() => handleUpdateQty(item.productId, item.quantity - 1)} disabled={item.isAvailable === false}>-</button>
                                                <span>{item.quantity}</span>
                                                <button type="button" onClick={() => handleUpdateQty(item.productId, item.quantity + 1)} disabled={item.isAvailable === false || (item.availableStock != null && item.quantity >= item.availableStock)}>+</button>
                                            </div>
                                        </div>
                                        <div className="line-price">{formatVnd(item.totalPrice)}</div>
                                        <div>
                                            <button type="button" className="icon-btn" onClick={() => openItemDeleteConfirm(item)}>
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
                                    disabled={checkingOut || selectedItems.length === 0 || hasUnavailableItems}
                                    onClick={handleCheckoutSelected}
                                >
                                    {hasUnavailableItems ? 'Xóa sản phẩm hết hàng' : (checkingOut ? 'Đang xử lý...' : `Thanh toán (${selectedItems.length} sản phẩm)`)}
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
            <Footer />

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

            {confirmSelectedDeleteOpen && (
                <div className="cart-confirm-overlay" onClick={() => setConfirmSelectedDeleteOpen(false)}>
                    <div className="cart-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h4>Xóa các sản phẩm đã chọn?</h4>
                        <p>Hành động này sẽ xóa {selectedItems.length} sản phẩm khỏi giỏ hàng.</p>
                        <div className="confirm-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setConfirmSelectedDeleteOpen(false)}>Hủy</button>
                            <button type="button" className="btn btn-primary" onClick={handleConfirmSelectedDelete}>Xóa</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmItemDeleteOpen && pendingDeleteItem && (
                <div className="cart-confirm-overlay" onClick={() => setConfirmItemDeleteOpen(false)}>
                    <div className="cart-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h4>Xóa sản phẩm này?</h4>
                        <p>Bạn có chắc muốn xóa <strong>{pendingDeleteItem.productName}</strong> khỏi giỏ hàng không?</p>
                        <div className="confirm-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setConfirmItemDeleteOpen(false)}>Hủy</button>
                            <button type="button" className="btn btn-primary" onClick={handleConfirmItemDelete}>Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;

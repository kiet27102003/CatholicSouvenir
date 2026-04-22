import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { appToast } from '../lib/appToast';
import AuthContext from './AuthContext';
import cartService from '../services/cartService';

/* eslint-disable react-refresh/only-export-components */

const CartContext = createContext();

const formatZoneInputs = (zoneInputs) => {
    if (!Array.isArray(zoneInputs)) return [];
    return zoneInputs
        .map((z) => ({
            zoneName: String(z?.zoneName || '').trim(),
            value: String(z?.value || '').trim(),
            extraPrice: Number(z?.extraPrice || 0),
        }))
        .filter((z) => z.zoneName || z.value || z.extraPrice > 0);
};

const calcItemTotal = (item) => {
    const basePrice = Number(item?.basePrice || 0);
    const quantity = Math.max(1, Number(item?.quantity || 1));
    const extraPerUnit = (item?.zoneInputs || []).reduce((sum, z) => sum + Number(z?.extraPrice || 0), 0);
    return (basePrice + extraPerUnit) * quantity;
};

const normalizeIncomingItem = (item) => {
    const productId = String(item?.productId ?? item?.id ?? '').trim();
    const cartItemId = String(item?.cartItemId ?? '').trim();
    const zoneInputs = formatZoneInputs(item?.zoneInputs ?? item?.customRequests ?? item?.customizationData ?? []);
    const basePrice = Number(item?.basePrice ?? item?.price ?? 0);
    const quantity = Math.max(1, Number(item?.quantity || 1));
    const totalPrice = Number(item?.totalPrice ?? item?.subtotal ?? calcItemTotal({ basePrice, quantity, zoneInputs }));
    const customizationData = zoneInputs.reduce((acc, z, index) => {
        const key = String(z?.zoneName || `field_${index + 1}`).trim() || `field_${index + 1}`;
        if (!String(z?.value || '').trim()) return acc;
        acc[key] = String(z.value).trim();
        return acc;
    }, {});

    return {
        cartItemId,
        productId,
        templateId: item?.templateId ?? null,
        templateName: item?.templateName ?? item?.template?.name ?? item?.productTemplateName ?? '',
        productName: item?.productName ?? item?.title ?? item?.name ?? item?.templateName ?? item?.template?.name ?? 'Sản phẩm',
        artisanName: item?.artisanName ?? item?.artisan ?? '',
        imageUrl:
            item?.imageUrl ??
            item?.image ??
            item?.productImage ??
            item?.thumbnailUrl ??
            item?.templateImageUrl ??
            item?.template?.imageUrl ??
            item?.template?.thumbnailUrl ??
            null,
        basePrice,
        quantity,
        zoneInputs,
        totalPrice,
        customizationData,
        selected: item?.selected !== false,
    };
};

const stableStringify = (value) => {
    if (value == null || typeof value !== 'object') return JSON.stringify(value ?? '');
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
};

const makeRowId = (item) => `${item.productId}::${stableStringify(item.zoneInputs || [])}`;

const recalcItem = (item) => {
    const next = { ...item };
    next.quantity = Math.max(1, Number(next.quantity || 1));
    next.basePrice = Number(next.basePrice || 0);
    next.zoneInputs = formatZoneInputs(next.zoneInputs);
    next.totalPrice = calcItemTotal(next);
    next.selected = next.selected !== false;
    return next;
};

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'HYDRATE_ITEMS': {
            const items = Array.isArray(action.payload) ? action.payload.map(recalcItem) : [];
            return { ...state, items };
        }
        case 'ADD_ITEM': {
            const incoming = recalcItem(normalizeIncomingItem(action.payload));
            const incomingId = makeRowId(incoming);
            const index = state.items.findIndex((it) => makeRowId(it) === incomingId);
            if (index >= 0) {
                const items = [...state.items];
                const merged = {
                    ...items[index],
                    quantity: items[index].quantity + incoming.quantity,
                };
                items[index] = recalcItem(merged);
                return { ...state, items };
            }
            return { ...state, items: [...state.items, incoming] };
        }
        case 'UPDATE_QUANTITY': {
            const { productId, quantity } = action.payload;
            if (quantity <= 0) {
                return { ...state, items: state.items.filter((it) => it.productId !== productId) };
            }
            return {
                ...state,
                items: state.items.map((it) => (it.productId === productId ? recalcItem({ ...it, quantity }) : it)),
            };
        }
        case 'REMOVE_ITEM':
            return { ...state, items: state.items.filter((it) => it.productId !== action.payload) };
        case 'CLEAR_CART':
            return { ...state, items: [] };
        case 'TOGGLE_SELECT':
            return {
                ...state,
                items: state.items.map((it) =>
                    it.productId === action.payload ? { ...it, selected: !it.selected } : it
                ),
            };
        case 'TOGGLE_SELECT_ALL': {
            const allSelected = state.items.length > 0 && state.items.every((it) => it.selected);
            return {
                ...state,
                items: state.items.map((it) => ({ ...it, selected: !allSelected })),
            };
        }
        case 'CLEAR_SELECTED_ITEMS': {
            const selectedIds = Array.isArray(action.payload)
                ? new Set(action.payload.map((id) => String(id)))
                : null;
            const nextItems = state.items.filter((it) => {
                if (selectedIds && selectedIds.size > 0) {
                    return !selectedIds.has(String(it.productId));
                }
                return !it.selected;
            });
            return { ...state, items: nextItems };
        }
        case 'OPEN_CART':
            return { ...state, isOpen: true };
        case 'CLOSE_CART':
            return { ...state, isOpen: false };
        case 'SET_CART_OPEN':
            return { ...state, isOpen: !!action.payload };
        default:
            return state;
    }
};

const isValidCustomerSession = (user) => {
    const role = String(user?.role || '').trim().toUpperCase();
    const token = String(user?.token || '').trim();
    return role === 'CUSTOMER' && token.length > 0;
};

export const CartProvider = ({ children }) => {
    const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const authLoading = auth?.loading ?? true;

    useEffect(() => {
        let cancelled = false;

        const syncCart = async () => {
            if (!isValidCustomerSession(user)) {
                dispatch({ type: 'HYDRATE_ITEMS', payload: [] });
                return;
            }

            const result = await cartService.getCart();
            if (cancelled) return;

            if (result.success) {
                const normalized = (result.data || []).map((item) => {
                    const normalizedItem = normalizeIncomingItem(item);
                    return {
                        ...normalizedItem,
                        productName: normalizedItem.productName || normalizedItem.templateName || 'Sản phẩm',
                        imageUrl: normalizedItem.imageUrl || item?.template?.imageUrl || item?.templateImageUrl || null,
                    };
                });
                dispatch({ type: 'HYDRATE_ITEMS', payload: normalized });
                return;
            }

            dispatch({ type: 'HYDRATE_ITEMS', payload: [] });
        };

        if (!authLoading) {
            syncCart();
        }

        return () => {
            cancelled = true;
        };
    }, [authLoading, user]);

    const selectedItems = useMemo(() => state.items.filter((i) => i.selected), [state.items]);
    const subtotal = useMemo(() => {
        const source = selectedItems.length > 0 ? selectedItems : state.items;
        return source.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
    }, [selectedItems, state.items]);
    const totalCount = useMemo(
        () => state.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        [state.items]
    );

    const addItem = async (item) => {
        if (!isValidCustomerSession(user)) {
            appToast.warning('Vui lòng đăng nhập trước khi dùng chức năng này');
            return;
        }

        const normalized = normalizeIncomingItem(item);
        dispatch({ type: 'ADD_ITEM', payload: normalized });

        const customizationData = (normalized.zoneInputs || []).reduce((acc, z, index) => {
            const key = String(z?.zoneName || `field_${index + 1}`).trim() || `field_${index + 1}`;
            const value = String(z?.value || '').trim();
            if (!value) return acc;
            acc[key] = value;
            return acc;
        }, {});

        const payload = {
            type: normalized.templateId ? 'TEMPLATE' : 'PRODUCT',
            templateId: normalized.templateId ?? '',
            productId: normalized.templateId ? '' : normalized.productId,
            customizationData,
            quantity: normalized.quantity,
        };

        const result = await cartService.addCartItem(payload);
        if (!result.success) {
            appToast.error('Lưu giỏ hàng thất bại, sẽ thử lại sau');
        }
    };

    const updateQuantity = async (productId, quantity) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
        const targetItem = state.items.find((it) => it.productId === productId);
        const cartItemId = targetItem?.cartItemId;
        if (!cartItemId) return;

        const result = await cartService.updateCartItem(cartItemId, quantity);
        if (!result.success) {
            appToast.error('Lưu giỏ hàng thất bại, sẽ thử lại sau');
        }
    };

    const removeItem = async (cartItemId) => {
        const targetItem = state.items.find((it) => it.cartItemId === cartItemId || it.productId === cartItemId);
        dispatch({ type: 'REMOVE_ITEM', payload: targetItem?.productId ?? cartItemId });
        const result = await cartService.removeCartItem(targetItem?.cartItemId ?? cartItemId);
        if (!result.success) {
            appToast.error('Lưu giỏ hàng thất bại, sẽ thử lại sau');
        }
    };

    const clearCart = async () => {
        dispatch({ type: 'CLEAR_CART' });
        const result = await cartService.clearCart();
        if (!result.success) {
            appToast.error('Lưu giỏ hàng thất bại, sẽ thử lại sau');
        }
    };

    const clearSelectedItems = async (cartItemIds = []) => {
        const ids = Array.isArray(cartItemIds) ? cartItemIds.map((id) => String(id)).filter(Boolean) : [];
        const selectedSet = new Set(ids);
        const targetItems = state.items.filter((item) => selectedSet.has(String(item.cartItemId)));

        dispatch({
            type: 'CLEAR_SELECTED_ITEMS',
            payload: ids.length > 0 ? ids : undefined,
        });

        if (targetItems.length > 0) {
            const results = await Promise.all(targetItems.map((item) => cartService.removeCartItem(item.cartItemId)));
            const failed = results.find((result) => !result.success);
            if (failed) {
                appToast.error('Xóa sản phẩm đã chọn thất bại', failed.error || 'Vui lòng thử lại');
            }
        }
    };

    const toggleSelect = (productId) => dispatch({ type: 'TOGGLE_SELECT', payload: productId });
    const toggleSelectAll = () => dispatch({ type: 'TOGGLE_SELECT_ALL' });
    const openCart = () => dispatch({ type: 'OPEN_CART' });
    const closeCart = () => dispatch({ type: 'CLOSE_CART' });
    const setCartOpen = (isOpen) => dispatch({ type: 'SET_CART_OPEN', payload: isOpen });

    const addToCart = (product, quantity = 1) => {
        if (!isValidCustomerSession(user)) {
            appToast.warning('Vui lòng đăng nhập trước khi dùng chức năng này');
            return;
        }

        const zonePriceBreakdown = Array.isArray(product.zonePriceBreakdown) ? product.zonePriceBreakdown : [];
        const customizationSource = product.customizationData ?? product.customRequests ?? {};
        const zoneInputs = zonePriceBreakdown
            .map((z) => {
                const key = String(z?.key || z?.zoneName || '').trim();
                const value = String(customizationSource?.[key] || '').trim();
                if (!value) return null;
                return {
                    zoneName: String(z?.label || z?.zoneName || '').trim(),
                    value,
                    extraPrice: Number(z?.amount || 0),
                };
            })
            .filter(Boolean);
        const templateId = String(product.templateId ?? '').trim();
        const productId = String(product.productId ?? product.id ?? '').trim();

        addItem({
            templateId: templateId || null,
            productId: templateId ? '' : productId,
            productName: product.title ?? product.productName ?? 'Sản phẩm',
            artisanName: product.artisanName ?? product.artisan ?? '',
            imageUrl: product.image ?? product.images?.[0]?.image_url ?? product.images?.[0]?.imageUrl ?? null,
            basePrice: Number(product.basePrice ?? product.price ?? 0),
            quantity,
            zoneInputs,
            selected: true,
        });
        openCart();
    };

    const removeFromCart = removeItem;

    return (
        <CartContext.Provider
            value={{
                items: state.items,
                cartItems: state.items,
                isOpen: state.isOpen,
                isCartOpen: state.isOpen,
                selectedItems,
                subtotal,
                totalCount,
                cartItemsCount: totalCount,
                cartTotalAmount: subtotal,
                addItem,
                addToCart,
                updateQuantity,
                removeItem,
                removeFromCart,
                clearCart,
                clearSelectedItems,
                toggleSelect,
                toggleSelectAll,
                openCart,
                closeCart,
                setCartOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};

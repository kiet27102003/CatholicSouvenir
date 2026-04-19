import api from '../cofig/api';

const normalizeResponse = (res) => {
    if (res?.data?.code != null) {
        return { code: res.data.code, message: res.data.message, data: res.data.data };
    }
    return { code: 200, message: 'OK', data: res?.data };
};

const mapError = (error, fallback) => {
    const message = error?.response?.data?.message
        ?? error?.response?.data?.error
        ?? error?.message
        ?? fallback;
    return typeof message === 'string' ? message : fallback;
};

export const getCart = async () => {
    try {
        const response = await api.get('/cart');
        const payload = normalizeResponse(response);
        if (payload.code !== 200) {
            return { success: false, error: payload.message || 'Không tải được giỏ hàng.', status: response?.status };
        }
        const raw = payload.data;
        const items = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.items)
                ? raw.items
                : Array.isArray(raw?.content)
                    ? raw.content
                    : [];
        return { success: true, data: items };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Không tải được giỏ hàng.'),
            status: error?.response?.status,
        };
    }
};

export const addCartItem = async (body) => {
    try {
        const response = await api.post('/cart/items', body);
        const payload = normalizeResponse(response);
        if (payload.code !== 200 && payload.code !== 201) {
            return { success: false, error: payload.message || 'Không thể thêm vào giỏ hàng.' };
        }
        return { success: true, data: payload.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể thêm vào giỏ hàng.') };
    }
};

export const updateCartItem = async (cartItemId, quantity) => {
    try {
        const response = await api.put(`/cart/items/${cartItemId}`, { quantity });
        const payload = normalizeResponse(response);
        if (payload.code !== 200) {
            return { success: false, error: payload.message || 'Không thể cập nhật giỏ hàng.' };
        }
        return { success: true, data: payload.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể cập nhật giỏ hàng.') };
    }
};

export const removeCartItem = async (cartItemId) => {
    try {
        const response = await api.delete(`/cart/items/${cartItemId}`);
        const payload = normalizeResponse(response);
        if (response.status >= 200 && response.status < 300 && (payload.code == null || payload.code === 200)) {
            return { success: true, data: payload.data ?? {} };
        }
        return { success: false, error: payload.message || 'Không thể xóa sản phẩm khỏi giỏ.' };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể xóa sản phẩm khỏi giỏ.') };
    }
};

export const clearCart = async () => {
    try {
        const response = await api.delete('/cart');
        const payload = normalizeResponse(response);
        if (response.status >= 200 && response.status < 300 && (payload.code == null || payload.code === 200)) {
            return { success: true, data: payload.data ?? {} };
        }
        return { success: false, error: payload.message || 'Không thể xóa toàn bộ giỏ hàng.' };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể xóa toàn bộ giỏ hàng.') };
    }
};

export const checkoutCart = async (productIds) => {
    try {
        const response = await api.post('/checkout', productIds);
        const payload = normalizeResponse(response);
        if (payload.code !== 200 && payload.code !== 201) {
            return { success: false, error: payload.message || 'Thanh toán thất bại.' };
        }
        return { success: true, data: payload.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Thanh toán thất bại.') };
    }
};

export default {
    getCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
    checkoutCart,
};

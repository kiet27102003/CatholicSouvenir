import api from '../cofig/api';

/**
 * Tạo đơn hàng (POST /api/order).
 * @param {Object} payload
 * @param {string} payload.accountId - UUID tài khoản
 * @param {string} payload.paymentMethod - Ví dụ: "CARD", "PAYPAL"
 * @param {string} payload.orderDate - ISO 8601 (ví dụ: 2026-03-07T06:46:27.434Z)
 * @param {Array<{ productId: string, quantity: number }>} payload.items
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const createOrder = async (payload) => {
    try {
        const response = await api.post('/order', {
            accountId: payload.accountId,
            paymentMethod: payload.paymentMethod,
            orderDate: payload.orderDate || new Date().toISOString(),
            items: payload.items.map((item) => ({
                productId: item.productId,
                quantity: Math.max(0, Math.floor(Number(item.quantity))),
            })),
        });

        const code = response.data?.code;
        if (code !== undefined && code !== 200) {
            return {
                success: false,
                error: response.data?.message || 'Tạo đơn hàng thất bại.',
            };
        }

        return {
            success: true,
            data: response.data?.data ?? response.data,
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Tạo đơn hàng thất bại. Vui lòng thử lại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Tạo đơn hàng thất bại. Vui lòng thử lại.',
        };
    }
};

/**
 * Lấy danh sách đơn hàng (GET /api/order).
 * @returns {Promise<{ success: boolean, data?: Array, error?: string }>}
 */
export const getOrders = async () => {
    try {
        const response = await api.get('/order');

        const code = response.data?.code;
        if (code !== undefined && code !== 200) {
            return {
                success: false,
                error: response.data?.message || 'Lấy danh sách đơn hàng thất bại.',
            };
        }

        const data = response.data?.data ?? response.data;
        const list = Array.isArray(data) ? data : [];
        return {
            success: true,
            data: list,
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Lấy danh sách đơn hàng thất bại. Vui lòng thử lại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lấy danh sách đơn hàng thất bại. Vui lòng thử lại.',
        };
    }
};

/**
 * Lấy chi tiết đơn hàng theo ID (GET /api/order/{orderId}).
 * @param {string} orderId - UUID đơn hàng
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const getOrderById = async (orderId) => {
    if (!orderId) {
        return { success: false, error: 'Thiếu mã đơn hàng.' };
    }
    try {
        const response = await api.get(`/order/${orderId}`);

        const code = response.data?.code;
        if (code !== undefined && code !== 200) {
            return {
                success: false,
                error: response.data?.message || 'Lấy thông tin đơn hàng thất bại.',
            };
        }

        const data = response.data?.data ?? response.data;
        return {
            success: true,
            data: data || null,
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Lấy thông tin đơn hàng thất bại. Vui lòng thử lại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lấy thông tin đơn hàng thất bại. Vui lòng thử lại.',
        };
    }
};

export default { createOrder, getOrders, getOrderById };

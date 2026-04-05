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

/**
 * Lấy danh sách đơn hàng theo artisan (GET /api/order/artisan/{artisanId}).
 * @param {string|number} artisanId - ID artisan
 * @returns {Promise<{ success: boolean, data?: Array, error?: string }>}
 */
export const getOrdersByArtisan = async (artisanId) => {
    if (!artisanId) {
        return { success: false, error: 'Thiếu mã artisan.', data: [] };
    }
    try {
        const response = await api.get(`/order/artisan/${artisanId}`);

        const code = response.data?.code;
        if (code !== undefined && code !== 200) {
            return {
                success: false,
                error: response.data?.message || 'Lấy danh sách đơn hàng thất bại.',
                data: [],
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
            data: [],
        };
    }
};

/**
 * Xóa đơn hàng (DELETE /api/order/{orderId}).
 * @param {string} orderId - UUID đơn hàng
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const deleteOrder = async (orderId) => {
    if (!orderId) {
        return { success: false, error: 'Thiếu mã đơn hàng.' };
    }
    try {
        const response = await api.delete(`/order/${orderId}`);

        const code = response.data?.code;
        if (code !== undefined && code !== 200) {
            return {
                success: false,
                error: response.data?.message || 'Xóa đơn hàng thất bại.',
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
            'Xóa đơn hàng thất bại. Vui lòng thử lại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Xóa đơn hàng thất bại. Vui lòng thử lại.',
        };
    }
};

/**
 * Cập nhật trạng thái đơn hàng (PUT /api/order/{orderId}).
 * Request body: chuỗi trạng thái thuần (không dấu ngoặc kép), ví dụ: PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED.
 * @param {string} orderId - UUID đơn hàng
 * @param {string} status - Trạng thái mới
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const updateOrderStatus = async (orderId, status) => {
    if (!orderId) {
        return { success: false, error: 'Thiếu mã đơn hàng.' };
    }
    if (!status || typeof status !== 'string') {
        return { success: false, error: 'Thiếu trạng thái.' };
    }
    try {
        const response = await api.put(`/order/${orderId}`, status, {
            headers: { 'Content-Type': 'text/plain' },
        });

        const code = response.data?.code;
        if (code !== undefined && code !== 200) {
            return {
                success: false,
                error: response.data?.message || 'Cập nhật trạng thái thất bại.',
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
            'Cập nhật trạng thái thất bại. Vui lòng thử lại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Cập nhật trạng thái thất bại. Vui lòng thử lại.',
        };
    }
};

/**
 * Lấy danh sách yêu cầu custom gửi đến artisan (GET /api/custom-requests/artisan/my-requests).
 * @returns {Promise<{ success: boolean, data?: Array, error?: string }>}
 */
export const getArtisanMyRequests = async () => {
    try {
        const response = await api.get('/custom-requests/artisan/my-requests');

        const code = response.data?.code;
        if (code !== 0 && code !== 200) {
            return {
                success: false,
                error: response.data?.message || 'Lấy danh sách yêu cầu thất bại.',
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
            'Lấy danh sách yêu cầu thất bại. Vui lòng thử lại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lấy danh sách yêu cầu thất bại. Vui lòng thử lại.',
        };
    }
};

/**
 * Lấy danh sách yêu cầu theo ý của khách (GET /api/custom-requests/customer/my-requests).
 * @returns {Promise<{ success: boolean, data?: Array, error?: string }>}
 */
export const getMyCustomRequests = async () => {
    try {
        const response = await api.get('/custom-requests/customer/my-requests');

        const code = response.data?.code;
        if (code !== 0 && code !== 200) {
            return {
                success: false,
                error: response.data?.message || 'Lấy danh sách yêu cầu thất bại.',
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
            'Lấy danh sách yêu cầu thất bại. Vui lòng thử lại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lấy danh sách yêu cầu thất bại. Vui lòng thử lại.',
        };
    }
};

/**
 * Lấy chi tiết yêu cầu theo ý theo ID (GET /api/custom-requests/{requestId}).
 * @param {string} requestId - UUID yêu cầu
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const getCustomRequestById = async (requestId) => {
    if (!requestId) {
        return { success: false, error: 'Thiếu mã yêu cầu.' };
    }
    try {
        const response = await api.get(`/custom-requests/${requestId}`);

        const code = response.data?.code;
        if (code !== 0 && code !== 200) {
            return {
                success: false,
                error: response.data?.message || 'Lấy chi tiết yêu cầu thất bại.',
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
            'Lấy chi tiết yêu cầu thất bại. Vui lòng thử lại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lấy chi tiết yêu cầu thất bại. Vui lòng thử lại.',
        };
    }
};

/**
 * Tạo yêu cầu đặt hàng theo ý (POST /api/custom-requests).
 * @param {Object} payload
 * @param {string} payload.title - Tiêu đề
 * @param {string} payload.description - Mô tả
 * @param {string} [payload.referenceImageUrl] - URL ảnh tham khảo
 * @param {boolean} [payload.generateAiImage=true] - Có sinh ảnh AI không
 * @param {string[]} payload.selectedArtisanIds - Mảng UUID nghệ nhân chọn
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const createCustomRequest = async (payload) => {
    try {
        const response = await api.post('/custom-requests', {
            title: payload.title,
            description: payload.description,
            referenceImageUrl: payload.referenceImageUrl || '',
            generateAiImage: payload.generateAiImage !== false,
            selectedArtisanIds: Array.isArray(payload.selectedArtisanIds) ? payload.selectedArtisanIds : [],
        });

        const code = response.data?.code;
        if (code !== 0 && code !== 200) {
            return {
                success: false,
                error: response.data?.message || 'Tạo yêu cầu thất bại.',
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
            'Tạo yêu cầu thất bại. Vui lòng thử lại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Tạo yêu cầu thất bại. Vui lòng thử lại.',
        };
    }
};

export default { createOrder, getOrders, getOrderById, getOrdersByArtisan, deleteOrder, updateOrderStatus, getArtisanMyRequests, getMyCustomRequests, getCustomRequestById, createCustomRequest };

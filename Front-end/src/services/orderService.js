import api from '../cofig/api';

const normalizeResponse = (response) => {
    if (response?.data?.code != null) {
        return {
            code: response.data.code,
            message: response.data.message,
            data: response.data.data,
        };
    }

    return {
        code: 200,
        message: 'OK',
        data: response?.data,
    };
};

const isSuccessCode = (code) => code === 0 || code === 200 || code === 201;

const mapError = (error, fallback) => {
    const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        fallback;
    return typeof message === 'string' ? message : fallback;
};

const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

/**
 * Tạo đơn hàng (POST /api/order).
 */
export const createOrder = async (payload) => {
    try {
        const response = await api.post('/order', {
            accountId: payload.accountId,
            paymentMethod: payload.paymentMethod,
            orderDate: payload.orderDate || new Date().toISOString(),
            items: (payload.items || []).map((item) => ({
                productId: item.productId,
                quantity: Math.max(0, Math.floor(Number(item.quantity))),
            })),
        });

        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Tạo đơn hàng thất bại.',
            };
        }

        return {
            success: true,
            data: normalized.data ?? {},
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Tạo đơn hàng thất bại. Vui lòng thử lại.'),
        };
    }
};

/**
 * Lấy danh sách đơn hàng của người dùng hiện tại có phân trang.
 * GET /api/order/account?page=&size=&sortBy=&sortDirection=
 *
 * Lưu ý: giữ tên hàm getOrdersByAccount để tương thích code cũ.
 * accountId hiện không còn dùng vì BE lấy theo token đăng nhập.
 */
export const getOrdersByAccount = async (
    _accountId,
    {
        page = 0,
        size = 10,
        sortBy = 'createAt',
        sortDirection = 'DESC',
    } = {},
) => {
    try {
        const response = await api.get('/order/account', {
            params: { page, size, sortBy, sortDirection },
        });

        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Lấy danh sách đơn hàng thất bại.',
                data: { content: [], totalElements: 0, totalPages: 0, pageNumber: page, pageSize: size },
            };
        }

        const raw = normalized.data ?? {};
        const content = toArray(raw);

        return {
            success: true,
            data: {
                content,
                totalElements: Number(raw?.totalElements ?? content.length ?? 0),
                totalPages: Number(raw?.totalPages ?? (content.length > 0 ? 1 : 0)),
                pageNumber: Number(raw?.number ?? raw?.pageNumber ?? page),
                pageSize: Number(raw?.size ?? raw?.pageSize ?? size),
            },
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Lấy danh sách đơn hàng thất bại. Vui lòng thử lại.'),
            data: { content: [], totalElements: 0, totalPages: 0, pageNumber: page, pageSize: size },
        };
    }
};

/**
 * Lấy danh sách đơn hàng (GET /api/order).
 */
export const getOrders = async () => {
    try {
        const response = await api.get('/order');
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Lấy danh sách đơn hàng thất bại.',
            };
        }

        return {
            success: true,
            data: toArray(normalized.data),
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Lấy danh sách đơn hàng thất bại. Vui lòng thử lại.'),
        };
    }
};

/**
 * Lấy chi tiết đơn hàng theo ID (GET /api/order/{orderId}).
 */
export const getFeedbackById = async (feedbackId) => {
    if (!feedbackId) {
        return { success: false, error: 'Thiếu mã đánh giá.' };
    }
    try {
        const response = await api.get(`/feedbacks/${feedbackId}`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Lấy chi tiết đánh giá thất bại.',
            };
        }

        return {
            success: true,
            data: normalized.data || null,
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Lấy chi tiết đánh giá thất bại. Vui lòng thử lại.'),
        };
    }
};

export const getOrderById = async (orderId) => {
    if (!orderId) {
        return { success: false, error: 'Thiếu mã đơn hàng.' };
    }
    try {
        const response = await api.get(`/order/${orderId}`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Lấy thông tin đơn hàng thất bại.',
            };
        }

        return {
            success: true,
            data: normalized.data || null,
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Lấy thông tin đơn hàng thất bại. Vui lòng thử lại.'),
        };
    }
};

export const createFeedback = async (payload) => {
    const orderId = payload?.orderId || null;
    const customOrderId = payload?.customOrderId || null;
    const rating = Number(payload?.rating || 0);
    const comment = String(payload?.comment || payload?.textComment || '').trim();

    if (!orderId && !customOrderId) {
        return { success: false, error: 'Thiếu mã đơn hàng hoặc đơn custom order.' };
    }
    if (!rating || rating < 1 || rating > 5) {
        return { success: false, error: 'Vui lòng chọn số sao đánh giá hợp lệ.' };
    }

    try {
        const response = await api.post('/feedbacks', {
            orderId,
            customOrderId,
            rating,
            comment,
        });

        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Gửi đánh giá thất bại.',
            };
        }

        return {
            success: true,
            data: normalized.data ?? {},
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Gửi đánh giá thất bại. Vui lòng thử lại.'),
        };
    }
};

export const getOrdersByArtisan = async (artisanId, { page = 0, size = 10, sortBy = 'createAt', sortDirection = 'DESC' } = {}) => {
    if (!artisanId) {
        return { success: false, error: 'Thiếu mã artisan.', data: [] };
    }
    try {
        const response = await api.get(`/order/artisan/${artisanId}`, {
            params: { page, size, sortBy, sortDirection },
        });
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Lấy danh sách đơn hàng thất bại.',
                data: { content: [], totalElements: 0, totalPages: 0, pageNumber: page, pageSize: size },
            };
        }

        const raw = normalized.data ?? {};
        const content = toArray(raw);

        return {
            success: true,
            data: {
                content,
                totalElements: Number(raw?.totalElements ?? content.length ?? 0),
                totalPages: Number(raw?.totalPages ?? (content.length > 0 ? 1 : 0)),
                pageNumber: Number(raw?.number ?? raw?.pageNumber ?? page),
                pageSize: Number(raw?.size ?? raw?.pageSize ?? size),
            },
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Lấy danh sách đơn hàng thất bại. Vui lòng thử lại.'),
            data: { content: [], totalElements: 0, totalPages: 0, pageNumber: page, pageSize: size },
        };
    }
};

export const deleteOrder = async (orderId) => {
    if (!orderId) {
        return { success: false, error: 'Thiếu mã đơn hàng.' };
    }
    try {
        const response = await api.delete(`/order/${orderId}`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Xóa đơn hàng thất bại.',
            };
        }

        return {
            success: true,
            data: normalized.data ?? {},
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Xóa đơn hàng thất bại. Vui lòng thử lại.'),
        };
    }
};

/**
 * Cập nhật trạng thái đơn hàng (PUT /api/order/{orderId}).
 * Request body: string trạng thái, ví dụ "CANCELLED".
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
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Cập nhật trạng thái thất bại.',
            };
        }

        return {
            success: true,
            data: normalized.data ?? {},
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Cập nhật trạng thái thất bại. Vui lòng thử lại.'),
        };
    }
};

export const getArtisanMyRequests = async () => {
    try {
        const response = await api.get('/custom-requests/artisan/my-requests');
        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Lấy danh sách yêu cầu thất bại.',
            };
        }
        return {
            success: true,
            data: toArray(normalized.data),
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Lấy danh sách yêu cầu thất bại. Vui lòng thử lại.'),
        };
    }
};

export const getMyCustomRequests = async () => {
    try {
        const response = await api.get('/custom-requests/customer/my-requests');
        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Lấy danh sách yêu cầu thất bại.',
            };
        }
        return {
            success: true,
            data: toArray(normalized.data),
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Lấy danh sách yêu cầu thất bại. Vui lòng thử lại.'),
        };
    }
};

export const getCustomRequestById = async (requestId) => {
    if (!requestId) {
        return { success: false, error: 'Thiếu mã yêu cầu.' };
    }
    try {
        const response = await api.get(`/custom-requests/${requestId}`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Lấy chi tiết yêu cầu thất bại.',
            };
        }

        return {
            success: true,
            data: normalized.data || null,
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Lấy chi tiết yêu cầu thất bại. Vui lòng thử lại.'),
        };
    }
};

export const createCustomRequest = async (payload) => {
    try {
        const response = await api.post('/custom-requests', {
            title: payload.title,
            description: payload.description,
            referenceImageUrl: payload.referenceImageUrl || '',
            generateAiImage: payload.generateAiImage !== false,
            selectedArtisanIds: Array.isArray(payload.selectedArtisanIds) ? payload.selectedArtisanIds : [],
        });

        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Tạo yêu cầu thất bại.',
            };
        }

        return {
            success: true,
            data: normalized.data ?? {},
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Tạo yêu cầu thất bại. Vui lòng thử lại.'),
        };
    }
};

export default {
    createOrder,
    getOrdersByAccount,
    getOrders,
    getFeedbackById,
    getOrderById,
    getOrdersByArtisan,
    deleteOrder,
    updateOrderStatus,
    getArtisanMyRequests,
    getMyCustomRequests,
    getCustomRequestById,
    createCustomRequest,
};

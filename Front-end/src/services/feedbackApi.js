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
    const message = error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback;
    return typeof message === 'string' ? message : fallback;
};

const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

export const getMyFeedbacks = async ({ page = 0, size = 10 } = {}) => {
    try {
        const response = await api.get('/feedbacks/my', {
            params: { page, size },
        });
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Lấy danh sách đánh giá thất bại.',
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
            error: mapError(error, 'Lấy danh sách đánh giá thất bại. Vui lòng thử lại.'),
            data: { content: [], totalElements: 0, totalPages: 0, pageNumber: page, pageSize: size },
        };
    }
};

export const getFeedbackById = async (feedbackId) => {
    if (!feedbackId) return { success: false, error: 'Thiếu mã đánh giá.' };

    try {
        const response = await api.get(`/feedbacks/${feedbackId}`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Lấy chi tiết đánh giá thất bại.' };
        }

        return { success: true, data: normalized.data || null };
    } catch (error) {
        return { success: false, error: mapError(error, 'Lấy chi tiết đánh giá thất bại. Vui lòng thử lại.') };
    }
};

export const createFeedback = async (payload) => {
    const orderId = payload?.orderId || null;
    const customOrderId = payload?.customOrderId || null;
    const rating = Number(payload?.rating || 0);
    const comment = String(payload?.comment || payload?.textComment || '').trim();

    if (!orderId && !customOrderId) return { success: false, error: 'Thiếu mã đơn hàng hoặc đơn custom order.' };
    if (!rating || rating < 1 || rating > 5) return { success: false, error: 'Vui lòng chọn số sao đánh giá hợp lệ.' };

    try {
        const response = await api.post('/feedbacks', { orderId, customOrderId, rating, comment });
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Gửi đánh giá thất bại.' };
        }

        return { success: true, data: normalized.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Gửi đánh giá thất bại. Vui lòng thử lại.') };
    }
};

export const updateFeedback = async (feedbackId, payload) => {
    if (!feedbackId) return { success: false, error: 'Thiếu mã đánh giá.' };

    try {
        const response = await api.put(`/feedbacks/${feedbackId}`, {
            rating: Number(payload?.rating || 0),
            comment: String(payload?.comment || '').trim(),
        });
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Cập nhật đánh giá thất bại.' };
        }

        return { success: true, data: normalized.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Cập nhật đánh giá thất bại. Vui lòng thử lại.') };
    }
};

export const deleteFeedback = async (feedbackId) => {
    if (!feedbackId) return { success: false, error: 'Thiếu mã đánh giá.' };

    try {
        const response = await api.delete(`/feedbacks/${feedbackId}`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Xóa đánh giá thất bại.' };
        }

        return { success: true, data: normalized.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Xóa đánh giá thất bại. Vui lòng thử lại.') };
    }
};

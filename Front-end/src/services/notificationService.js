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

export const getNotifications = async ({ page = 0, size = 20 } = {}) => {
    try {
        const response = await api.get('/notifications', {
            params: {
                page: Number(page) || 0,
                size: Number(size) || 20,
            },
        });

        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Không tải được thông báo.',
                data: {
                    content: [],
                    totalElements: 0,
                    totalPages: 0,
                    number: 0,
                    size: Number(size) || 20,
                    first: true,
                    last: true,
                },
            };
        }

        const payload = normalized.data || {};
        return {
            success: true,
            data: {
                ...payload,
                content: toArray(payload),
            },
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Không tải được thông báo.'),
            data: {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: Number(size) || 20,
                first: true,
                last: true,
            },
        };
    }
};

export const getUnreadNotificationCount = async () => {
    try {
        const response = await api.get('/notifications/unread-count');
        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không tải được số thông báo chưa đọc.', data: 0 };
        }

        const rawCount = normalized.data?.count ?? normalized.data ?? 0;
        return { success: true, data: Number(rawCount) || 0 };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không tải được số thông báo chưa đọc.'), data: 0 };
    }
};

export const markNotificationAsRead = async (notificationId) => {
    if (!notificationId) return { success: false, error: 'Thiếu notificationId.', data: null };

    try {
        const response = await api.post(`/notifications/${notificationId}/read`);
        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không thể đánh dấu đã đọc.', data: null };
        }

        return { success: true, data: normalized.data };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể đánh dấu đã đọc.'), data: null };
    }
};

export const markAllNotificationsAsRead = async () => {
    try {
        const response = await api.post('/notifications/read-all');
        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không thể đánh dấu tất cả đã đọc.', data: null };
        }

        return { success: true, data: normalized.data };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể đánh dấu tất cả đã đọc.'), data: null };
    }
};

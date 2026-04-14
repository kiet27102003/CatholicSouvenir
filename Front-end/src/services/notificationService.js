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

import api from '../cofig/api';

const RECOVERY_TASKS_BASE = '/admin/recovery-tasks';
const ARTISANS_BASE = '/admin/artisans';

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

export const getRecoveryTasksApi = async () => {
    try {
        const response = await api.get(RECOVERY_TASKS_BASE);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không tải được danh sách recovery tasks.', data: [] };
        }

        return { success: true, data: toArray(normalized.data) };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không tải được danh sách recovery tasks.'), data: [] };
    }
};

export const markRecoveryTaskRecoveredApi = async (taskId) => {
    if (!taskId) return { success: false, error: 'Thiếu mã task.' };

    try {
        const response = await api.post(`${RECOVERY_TASKS_BASE}/${taskId}/mark-recovered`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không thể đánh dấu đã xử lý.' };
        }

        return { success: true, data: normalized.data || null };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể đánh dấu đã xử lý.') };
    }
};

export const blacklistArtisanApi = async (artisanId) => {
    if (!artisanId) return { success: false, error: 'Thiếu mã artisan.' };

    try {
        const response = await api.post(`${ARTISANS_BASE}/${artisanId}/blacklist`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không thể blacklist artisan.' };
        }

        return { success: true, data: normalized.data || null };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể blacklist artisan.') };
    }
};

export const removeArtisanBlacklistApi = async (artisanId) => {
    if (!artisanId) return { success: false, error: 'Thiếu mã artisan.' };

    try {
        const response = await api.delete(`${ARTISANS_BASE}/${artisanId}/blacklist`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không thể gỡ blacklist artisan.' };
        }

        return { success: true, data: normalized.data || null };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể gỡ blacklist artisan.') };
    }
};

export default {
    getRecoveryTasksApi,
    markRecoveryTaskRecoveredApi,
    blacklistArtisanApi,
    removeArtisanBlacklistApi,
};

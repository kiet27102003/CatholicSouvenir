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

const mapError = (error, fallback) => {
    const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        fallback;
    return typeof message === 'string' ? message : fallback;
};

const handleApiResponse = (response, successFallback) => {
    const normalized = normalizeResponse(response);

    if (normalized.code !== 0 && normalized.code !== 200 && normalized.code !== 201) {
        return {
            success: false,
            error: normalized.message || successFallback,
        };
    }

    return {
        success: true,
        data: normalized.data || {},
        message: normalized.message || successFallback,
    };
};

export const getCommissionRate = async () => {
    try {
        const response = await api.get('/commission/rate');
        return handleApiResponse(response, 'Lấy commission rate thành công.');
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Không thể tải commission rate.'),
        };
    }
};

export const getCommissionConfig = async () => {
    try {
        const response = await api.get('/admin/commission/config');
        return handleApiResponse(response, 'Lấy cấu hình commission thành công.');
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Không thể tải cấu hình commission.'),
        };
    }
};

export const updateCommissionRate = async (commissionRate) => {
    try {
        const response = await api.put('/admin/commission/config', {
            commissionRate: Number(commissionRate),
        });
        return handleApiResponse(response, 'Cập nhật commission rate thành công.');
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Không thể cập nhật commission rate.'),
        };
    }
};

export const getCommissionReport = async ({ startDate, endDate, groupBy = 'DAY' }) => {
    try {
        const params = new URLSearchParams();
        params.set('startDate', startDate);
        params.set('endDate', endDate);
        if (groupBy) params.set('groupBy', groupBy);

        const response = await api.get(`/admin/commission/report?${params.toString()}`);
        return handleApiResponse(response, 'Tạo báo cáo thành công.');
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Không thể tải báo cáo commission.'),
        };
    }
};

export default {
    getCommissionRate,
    getCommissionConfig,
    updateCommissionRate,
    getCommissionReport,
};

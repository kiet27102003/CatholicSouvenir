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

export const generateConceptImage = async ({ description }) => {
    const body = {
        description: String(description ?? '').trim(),
    };

    if (!body.description) {
        return { success: false, error: 'Thiếu mô tả để tạo ảnh concept.' };
    }

    try {
        const response = await api.post('/ai/generate-concept', body);
        const normalized = normalizeResponse(response);

        if (normalized.code !== 0 && normalized.code !== 200 && normalized.code !== 201) {
            return {
                success: false,
                error: normalized.message || 'Tạo ảnh concept thất bại.',
            };
        }

        return {
            success: true,
            data: normalized.data || {},
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Không thể kết nối tới dịch vụ AI.'),
        };
    }
};

export default { generateConceptImage };

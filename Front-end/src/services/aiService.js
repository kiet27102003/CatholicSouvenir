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

export const recommendScripture = async ({ purpose, productName, theme, language, maxResults = 5 }) => {
    try {
        const response = await api.post('/ai/recommend-scripture', {
            purpose,
            productName,
            theme,
            language,
            maxResults,
        });

        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không lấy được gợi ý AI.' };
        }

        return { success: true, data: normalized.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không lấy được gợi ý AI. Vui lòng thử lại.') };
    }
};

export const generateConceptImage = async ({ description }) => {
    try {
        const response = await api.post('/ai/generate-concept', { description });
        const normalized = normalizeResponse(response);
        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không tạo được ảnh AI.' };
        }

        return { success: true, data: normalized.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không tạo được ảnh AI. Vui lòng thử lại.') };
    }
};

export default { recommendScripture, generateConceptImage };

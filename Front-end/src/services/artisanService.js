import api from '../cofig/api';

/**
 * Lấy danh sách nghệ nhân có phân trang (GET /api/artisans).
 * @param {number} [page=0] - Trang (0-based)
 * @param {number} [size=20] - Số phần tử mỗi trang
 * @returns {Promise<{ success: boolean, data?: { content, totalElements, totalPages, number, size, first, last, empty }, error?: string }>}
 */
export const getArtisans = async (page = 0, size = 20) => {
    try {
        const response = await api.get('/artisans', { params: { page, size } });
        const res = response.data;

        if (res?.code !== 0 && res?.code !== 200) {
            return {
                success: false,
                error: res?.message || 'Lấy danh sách nghệ nhân thất bại.',
            };
        }

        const data = res?.data ?? {};
        return {
            success: true,
            data: {
                content: data.content ?? [],
                totalElements: data.totalElements ?? 0,
                totalPages: data.totalPages ?? 0,
                number: data.number ?? page,
                size: data.size ?? size,
                first: data.first ?? true,
                last: data.last ?? true,
                empty: data.empty ?? true,
            },
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Lấy danh sách nghệ nhân thất bại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lỗi không xác định.',
        };
    }
};

/**
 * Lấy chi tiết nghệ nhân theo ID (GET /api/artisans/{artisanId}).
 * @param {string} artisanId - UUID nghệ nhân
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const getArtisanById = async (artisanId) => {
    try {
        if (!artisanId) {
            return { success: false, error: 'Thiếu mã nghệ nhân.' };
        }
        const response = await api.get(`/artisans/${artisanId}`);
        const res = response.data;

        if (res?.code !== 0 && res?.code !== 200) {
            return {
                success: false,
                error: res?.message || 'Không tìm thấy nghệ nhân.',
            };
        }

        return {
            success: true,
            data: res?.data ?? {},
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Không tìm thấy nghệ nhân.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lỗi không xác định.',
        };
    }
};

export default { getArtisans, getArtisanById };

import api from '../cofig/api';

/**
 * Gọi API AI tạo thiết kế sản phẩm (demo).
 * POST /api/ai/generate-design
 * @param {Object} payload
 * @param {string} payload.description - Mô tả sản phẩm
 * @param {string} payload.style - Phong cách
 * @param {string} payload.material - Chất liệu
 * @param {string} payload.size - Kích thước
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const generateDesign = async (payload) => {
    try {
        const body = {
            description: String(payload.description ?? '').trim(),
            style: String(payload.style ?? '').trim(),
            material: String(payload.material ?? '').trim(),
            size: String(payload.size ?? '').trim(),
        };
        const response = await api.post('/ai/generate-design', body);
        const res = response.data;
        if (res?.code !== undefined && res.code !== 200) {
            return {
                success: false,
                error: res?.message || 'Tạo thiết kế thất bại.',
            };
        }
        return { success: true, data: res?.data ?? res };
    } catch (err) {
        const message =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            'Không thể kết nối tới dịch vụ AI.';
        return { success: false, error: message };
    }
};

export default { generateDesign };

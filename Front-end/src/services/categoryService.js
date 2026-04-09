import api from '../cofig/api';

const extractData = (res) => {
    const raw = res?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.content)) return raw.content;
    return raw ?? null;
};

const toErrorMessage = (error, fallback) => {
    const message = error?.response?.data?.message ?? error?.message ?? fallback;
    return typeof message === 'string' ? message : fallback;
};

export const getCategories = async () => {
    try {
        const response = await api.get('/categories');
        const res = response?.data;
        if (res?.code != null && res.code !== 200) {
            return { success: false, error: res?.message || 'Không tải được danh mục.' };
        }
        const data = extractData(res);
        return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
        return { success: false, error: toErrorMessage(error, 'Không tải được danh mục.') };
    }
};

export const getRootCategories = async () => {
    try {
        const response = await api.get('/categories/root');
        const res = response?.data;
        if (res?.code != null && res.code !== 200) {
            return { success: false, error: res?.message || 'Không tải được danh mục gốc.' };
        }
        const data = extractData(res);
        return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
        return { success: false, error: toErrorMessage(error, 'Không tải được danh mục gốc.') };
    }
};

export const getCategoryById = async (id) => {
    try {
        const response = await api.get(`/categories/${id}`);
        const res = response?.data;
        if (res?.code != null && res.code !== 200) {
            return { success: false, error: res?.message || 'Không tải được chi tiết danh mục.' };
        }
        const data = extractData(res);
        return { success: true, data: data || {} };
    } catch (error) {
        return { success: false, error: toErrorMessage(error, 'Không tải được chi tiết danh mục.') };
    }
};

export const getSubcategories = async (id) => {
    try {
        const response = await api.get(`/categories/${id}/subcategories`);
        const res = response?.data;
        if (res?.code != null && res.code !== 200) {
            return { success: false, error: res?.message || 'Không tải được danh mục con.' };
        }
        const data = extractData(res);
        return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
        return { success: false, error: toErrorMessage(error, 'Không tải được danh mục con.') };
    }
};

export const searchCategoriesByName = async (name) => {
    try {
        const response = await api.get(`/categories/by-name/${encodeURIComponent(name)}`);
        const res = response?.data;
        if (res?.code != null && res.code !== 200) {
            return { success: false, error: res?.message || 'Không tìm được danh mục.' };
        }
        const data = extractData(res);
        return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
        return { success: false, error: toErrorMessage(error, 'Không tìm được danh mục.') };
    }
};

export const createCategory = async (payload) => {
    try {
        const response = await api.post('/categories', payload);
        const res = response?.data;
        if (res?.code != null && res.code !== 200) {
            return { success: false, error: res?.message || 'Tạo danh mục thất bại.' };
        }
        return { success: true, data: extractData(res) || {} };
    } catch (error) {
        return { success: false, error: toErrorMessage(error, 'Tạo danh mục thất bại.') };
    }
};

export const updateCategory = async (id, payload) => {
    try {
        const response = await api.put(`/categories/${id}`, payload);
        const res = response?.data;
        if (res?.code != null && res.code !== 200) {
            return { success: false, error: res?.message || 'Cập nhật danh mục thất bại.' };
        }
        return { success: true, data: extractData(res) || {} };
    } catch (error) {
        return { success: false, error: toErrorMessage(error, 'Cập nhật danh mục thất bại.') };
    }
};

export const deleteCategory = async (id) => {
    try {
        const response = await api.delete(`/categories/${id}`);
        const res = response?.data;
        if (response?.status >= 200 && response?.status < 300) {
            if (res?.code != null && res.code !== 200) {
                return { success: false, error: res?.message || 'Xóa danh mục thất bại.' };
            }
            return { success: true };
        }
        return { success: false, error: res?.message || 'Xóa danh mục thất bại.' };
    } catch (error) {
        return { success: false, error: toErrorMessage(error, 'Xóa danh mục thất bại.') };
    }
};

export default {
    getCategories,
    getRootCategories,
    getCategoryById,
    getSubcategories,
    searchCategoriesByName,
    createCategory,
    updateCategory,
    deleteCategory,
};

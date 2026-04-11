import api from '../cofig/api';

const unwrap = (response) => {
    if (response?.data?.code != null) {
        return {
            ok: response.data.code === 0 || response.data.code === 200 || response.data.code === 201,
            message: response.data.message,
            data: response.data.data,
        };
    }

    return {
        ok: true,
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

const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    return [];
};

export const validateCheckout = async () => {
    try {
        const response = await api.get('/checkout/validate');
        const payload = unwrap(response);
        if (!payload.ok) {
            return { success: false, error: payload.message || 'Không thể xác thực giỏ hàng.' };
        }
        return { success: true, data: payload.data ?? true };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể xác thực giỏ hàng.') };
    }
};

export const createCheckout = async (body) => {
    try {
        const response = await api.post('/checkout', body);
        const payload = unwrap(response);
        if (!payload.ok) {
            return { success: false, error: payload.message || 'Không thể tạo checkout.' };
        }
        return { success: true, data: payload.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể tạo checkout.') };
    }
};

export const getProvinces = async () => {
    try {
        const response = await api.get('/shipments/address/provinces');
        const payload = unwrap(response);
        if (!payload.ok) {
            return { success: false, data: [], error: payload.message || 'Không tải được tỉnh/thành phố.' };
        }
        return { success: true, data: toArray(payload.data) };
    } catch (error) {
        return { success: false, data: [], error: mapError(error, 'Không tải được tỉnh/thành phố.') };
    }
};

export const getDistricts = async (provinceId) => {
    try {
        const response = await api.get('/shipments/address/districts', {
            params: { provinceId },
        });
        const payload = unwrap(response);
        if (!payload.ok) {
            return { success: false, data: [], error: payload.message || 'Không tải được quận/huyện.' };
        }
        return { success: true, data: toArray(payload.data) };
    } catch (error) {
        return { success: false, data: [], error: mapError(error, 'Không tải được quận/huyện.') };
    }
};

export const searchDistricts = async (provinceId, districtName) => {
    try {
        const response = await api.get('/shipments/address/districts/search', {
            params: { provinceId, districtName },
        });
        const payload = unwrap(response);
        if (!payload.ok) {
            return { success: false, data: [], error: payload.message || 'Không tìm được quận/huyện.' };
        }
        return { success: true, data: toArray(payload.data) };
    } catch (error) {
        return { success: false, data: [], error: mapError(error, 'Không tìm được quận/huyện.') };
    }
};

export const getWards = async (districtId) => {
    try {
        const response = await api.get('/shipments/address/wards', {
            params: { districtId },
        });
        const payload = unwrap(response);
        if (!payload.ok) {
            return { success: false, data: [], error: payload.message || 'Không tải được phường/xã.' };
        }
        return { success: true, data: toArray(payload.data) };
    } catch (error) {
        return { success: false, data: [], error: mapError(error, 'Không tải được phường/xã.') };
    }
};

export const searchWards = async (districtId, wardName) => {
    try {
        const response = await api.get('/shipments/address/wards/search', {
            params: { districtId, wardName },
        });
        const payload = unwrap(response);
        if (!payload.ok) {
            return { success: false, data: [], error: payload.message || 'Không tìm được phường/xã.' };
        }
        return { success: true, data: toArray(payload.data) };
    } catch (error) {
        return { success: false, data: [], error: mapError(error, 'Không tìm được phường/xã.') };
    }
};

export const calculateShippingFee = async (body) => {
    try {
        const response = await api.post('/shipments/calculate-fee', body);
        const payload = unwrap(response);
        if (!payload.ok) {
            return { success: false, error: payload.message || 'Không tính được phí vận chuyển.' };
        }
        return { success: true, data: payload.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không tính được phí vận chuyển.') };
    }
};

export default {
    validateCheckout,
    createCheckout,
    getProvinces,
    getDistricts,
    searchDistricts,
    getWards,
    searchWards,
    calculateShippingFee,
};

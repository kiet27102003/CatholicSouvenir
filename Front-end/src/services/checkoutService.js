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

export const getOrderGroupDetail = async (orderGroupId) => {
    if (!orderGroupId) {
        return { success: false, error: 'Thiếu orderGroupId.' };
    }

    try {
        const response = await api.get(`/checkout/order-group/${orderGroupId}`);
        const payload = unwrap(response);
        if (!payload.ok) {
            return { success: false, error: payload.message || 'Không thể tải thông tin nhóm đơn hàng.' };
        }
        return { success: true, data: payload.data ?? null };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể tải thông tin nhóm đơn hàng.') };
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

const normalizeShippingBody = (body = {}) => ({
    toDistrictId: Number(body.toDistrictId || 0),
    toWardCode: String(body.toWardCode || '').trim(),
    weight: Number(body.weight || 0),
    length: Number(body.length || 0),
    width: Number(body.width || 0),
    height: Number(body.height || 0),
});

export const calculateShippingFee = async (body) => {
    try {
        const response = await api.post('/checkout/calculate-shipping', normalizeShippingBody(body));
        const payload = unwrap(response);
        if (!payload.ok) {
            return { success: false, error: payload.message || 'Không tính được phí vận chuyển.' };
        }
        return { success: true, data: payload.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không tính được phí vận chuyển.') };
    }
};

export const checkoutWithShipping = async (body) => {
    try {
        const response = await api.post('/checkout', {
            paymentMethod: body?.paymentMethod || 'VNPAY',
            toDistrictId: Number(body?.toDistrictId || 0),
            toWardCode: String(body?.toWardCode || '').trim(),
            recipientName: String(body?.recipientName || '').trim() || undefined,
            phoneNumber: String(body?.phoneNumber || '').trim() || undefined,
            shippingAddress: String(body?.shippingAddress || '').trim() || undefined,
            weight: Number(body?.weight || 0),
            length: Number(body?.length || 0),
            width: Number(body?.width || 0),
            height: Number(body?.height || 0),
        });
        const payload = unwrap(response);
        if (!payload.ok) {
            return { success: false, error: payload.message || 'Không thể tạo đơn hàng.' };
        }
        return { success: true, data: payload.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể tạo đơn hàng.') };
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
    checkoutWithShipping,
};

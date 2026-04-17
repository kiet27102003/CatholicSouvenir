import api from '../cofig/api';

const normalizeResponse = (res) => {
    if (res?.data?.code != null) {
        return { code: res.data.code, message: res.data.message, data: res.data.data };
    }
    return { code: 200, message: 'OK', data: res?.data };
};

const mapError = (error, fallback) => {
    const message = error?.response?.data?.message
        ?? error?.response?.data?.error
        ?? error?.message
        ?? fallback;
    return typeof message === 'string' ? message : fallback;
};

export const initiatePayment = async (body) => {
    try {
        const response = await api.post('/payments/initiate', body);
        const payload = normalizeResponse(response);
        if (payload.code !== 200 && payload.code !== 201) {
            return { success: false, error: payload.message || 'Không thể khởi tạo thanh toán.' };
        }
        return { success: true, data: payload.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể khởi tạo thanh toán.') };
    }
};

export const initiateOrderGroupPayment = async ({ orderGroupId, method = 'VNPAY', returnUrl }) => {
    if (!orderGroupId) {
        return { success: false, error: 'Thiếu orderGroupId.' };
    }

    try {
        const response = await api.post('/payments/initiate', {
            orderGroupId,
            method,
            returnUrl,
        });
        const payload = normalizeResponse(response);
        if (payload.code !== 200 && payload.code !== 201) {
            return { success: false, error: payload.message || 'Không thể khởi tạo thanh toán.' };
        }
        return { success: true, data: payload.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể khởi tạo thanh toán.') };
    }
};

export const callbackPayment = async (gateway, queryObject) => {
    try {
        const normalizedGateway = String(gateway || 'VNPAY').toLowerCase();
        const endpoint = normalizedGateway === 'vnpay'
            ? '/stage-payments/vnpay/callback'
            : `/stage-payments/${encodeURIComponent(normalizedGateway)}/callback`;

        const response = await api.get(endpoint, { params: queryObject || {} });
        const payload = normalizeResponse(response);
        if (payload.code !== 200 && payload.code !== 201) {
            return { success: false, error: payload.message || 'Xử lý callback thanh toán thất bại.' };
        }
        return { success: true, data: payload.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Xử lý callback thanh toán thất bại.') };
    }
};

export const refundPayment = async (paymentId, reason) => {
    try {
        const response = await api.post(`/payments/${paymentId}/refund`, null, {
            params: reason ? { reason } : undefined,
        });
        const payload = normalizeResponse(response);
        if (payload.code !== 200 && payload.code !== 201) {
            return { success: false, error: payload.message || 'Hoàn tiền thất bại.' };
        }
        return { success: true, data: payload.data ?? {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Hoàn tiền thất bại.') };
    }
};

export const getPayments = async (params = {}) => {
    try {
        const response = await api.get('/payments', { params });
        const payload = normalizeResponse(response);
        if (payload.code !== 200) {
            return { success: false, error: payload.message || 'Không tải được lịch sử thanh toán.', data: [] };
        }
        const list = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.data?.content) ? payload.data.content : [];
        return { success: true, data: list };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không tải được lịch sử thanh toán.'), data: [] };
    }
};

export const getPaymentsByOrder = async (orderId) => {
    try {
        const response = await api.get(`/payments/order/${orderId}`);
        const payload = normalizeResponse(response);
        if (payload.code !== 200) {
            return { success: false, error: payload.message || 'Không tải được thanh toán theo đơn hàng.', data: [] };
        }
        const list = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.data?.content) ? payload.data.content : [];
        return { success: true, data: list };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không tải được thanh toán theo đơn hàng.'), data: [] };
    }
};

export const getPaymentsByStage = async (stageId) => {
    try {
        const response = await api.get(`/payments/stage/${stageId}`);
        const payload = normalizeResponse(response);
        if (payload.code !== 200) {
            return { success: false, error: payload.message || 'Không tải được thanh toán theo giai đoạn.', data: [] };
        }
        const list = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.data?.content) ? payload.data.content : [];
        return { success: true, data: list };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không tải được thanh toán theo giai đoạn.'), data: [] };
    }
};

export const getPaymentsByCustomOrder = async (customOrderId) => {
    try {
        const response = await api.get(`/payments/custom-order/${customOrderId}`);
        const payload = normalizeResponse(response);
        if (payload.code !== 200) {
            return { success: false, error: payload.message || 'Không tải được thanh toán theo custom order.', data: [] };
        }
        const list = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.data?.content) ? payload.data.content : [];
        return { success: true, data: list };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không tải được thanh toán theo custom order.'), data: [] };
    }
};

export default {
    initiatePayment,
    initiateOrderGroupPayment,
    callbackPayment,
    refundPayment,
    getPayments,
    getPaymentsByOrder,
    getPaymentsByStage,
    getPaymentsByCustomOrder,
};

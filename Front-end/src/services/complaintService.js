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

const isSuccessCode = (code) => code === 0 || code === 200 || code === 201;

const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

const buildComplaintPayload = (payload) => ({
    orderId: payload?.orderId || null,
    customOrderId: payload?.customOrderId || null,
    productId: payload?.productId || null,
    reason: String(payload?.reason || '').trim(),
    evidenceImages: Array.isArray(payload?.evidenceImages) ? payload.evidenceImages.filter(Boolean).slice(0, 5) : [],
});

export const createComplaint = async (payload) => {
    const body = buildComplaintPayload(payload);

    if (!body.orderId && !body.customOrderId) {
        return { success: false, error: 'Thiếu orderId hoặc customOrderId.' };
    }

    if (body.reason.length < 20) {
        return { success: false, error: 'Lý do khiếu nại phải từ 20 đến 1000 ký tự.' };
    }

    try {
        const response = await api.post('/complaints', body);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Tạo khiếu nại thất bại.' };
        }

        return { success: true, data: normalized.data || {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Tạo khiếu nại thất bại.') };
    }
};

export const getMyComplaints = async ({ page = 0, size = 10 } = {}) => {
    try {
        const response = await api.get('/complaints', { params: { page, size } });
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không thể tải danh sách khiếu nại.', data: [] };
        }

        return { success: true, data: normalized.data || [] };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể tải danh sách khiếu nại.'), data: [] };
    }
};

export const getComplaintDetail = async (complaintId) => {
    if (!complaintId) return { success: false, error: 'Thiếu complaintId.' };

    try {
        const response = await api.get(`/complaints/${complaintId}`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không thể tải chi tiết khiếu nại.' };
        }

        return { success: true, data: normalized.data || null };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể tải chi tiết khiếu nại.') };
    }
};

export const respondComplaint = async (complaintId, payload) => {
    if (!complaintId) return { success: false, error: 'Thiếu complaintId.' };

    try {
        const response = await api.post(`/artisan/complaints/${complaintId}/respond`, {
            response: String(payload?.response || '').trim(),
            requireReturn: Boolean(payload?.requireReturn),
        });
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Phản hồi khiếu nại thất bại.' };
        }

        return { success: true, data: normalized.data || {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Phản hồi khiếu nại thất bại.') };
    }
};

export const approveComplaint = async (complaintId, payload) => {
    if (!complaintId) return { success: false, error: 'Thiếu complaintId.' };

    try {
        const response = await api.post(`/admin/complaints/${complaintId}/approve`, {
            refundAmount: Number(payload?.refundAmount || 0),
            adminNote: String(payload?.adminNote || '').trim(),
        });
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Phê duyệt khiếu nại thất bại.' };
        }

        return { success: true, data: normalized.data || {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Phê duyệt khiếu nại thất bại.') };
    }
};

export const rejectComplaint = async (complaintId, payload) => {
    if (!complaintId) return { success: false, error: 'Thiếu complaintId.' };

    try {
        const response = await api.post(`/admin/complaints/${complaintId}/reject`, {
            rejectionReason: String(payload?.rejectionReason || '').trim(),
        });
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Từ chối khiếu nại thất bại.' };
        }

        return { success: true, data: normalized.data || {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Từ chối khiếu nại thất bại.') };
    }
};

export const getRefundTransactions = async ({ status, page = 0, size = 10 } = {}) => {
    try {
        const response = await api.get('/admin/complaints/refund-transactions', { params: { status, page, size } });
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không thể tải giao dịch hoàn tiền.', data: [] };
        }

        return { success: true, data: normalized.data || [] };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể tải giao dịch hoàn tiền.'), data: [] };
    }
};

export const retryRefundTransaction = async (refundTransactionId) => {
    if (!refundTransactionId) return { success: false, error: 'Thiếu refundTransactionId.' };

    try {
        const response = await api.post(`/admin/complaints/refund-transactions/${refundTransactionId}/retry`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Thử lại hoàn tiền thất bại.' };
        }

        return { success: true, data: normalized.data || {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Thử lại hoàn tiền thất bại.') };
    }
};

export const createReturnShipment = async (complaintId, payload) => {
    if (!complaintId) return { success: false, error: 'Thiếu complaintId.' };

    try {
        const response = await api.post(`/complaints/${complaintId}/return`, { ...payload });
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Tạo đơn trả hàng thất bại.' };
        }

        return { success: true, data: normalized.data || {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Tạo đơn trả hàng thất bại.') };
    }
};

export const confirmReturnShipment = async (shipmentId) => {
    if (!shipmentId) return { success: false, error: 'Thiếu shipmentId.' };

    try {
        const response = await api.post(`/artisan/return-shipments/${shipmentId}/confirm`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Xác nhận trả hàng thất bại.' };
        }

        return { success: true, data: normalized.data || {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Xác nhận trả hàng thất bại.') };
    }
};

export default {
    createComplaint,
    getMyComplaints,
    getComplaintDetail,
    respondComplaint,
    approveComplaint,
    rejectComplaint,
    getRefundTransactions,
    retryRefundTransaction,
    createReturnShipment,
    confirmReturnShipment,
    toArray,
};
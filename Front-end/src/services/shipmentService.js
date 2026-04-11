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
    const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        fallback;
    return typeof message === 'string' ? message : fallback;
};

export const getShipmentByOrderId = async (orderId) => {
    if (!orderId) {
        return { success: false, error: 'Thiếu mã đơn hàng.' };
    }

    try {
        const response = await api.get(`/shipments/order/${orderId}`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Không tải được thông tin vận chuyển.',
            };
        }

        return {
            success: true,
            data: normalized.data || null,
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Không tải được thông tin vận chuyển.'),
        };
    }
};

export const getTrackingByNumber = async (trackingNumber) => {
    if (!trackingNumber) {
        return { success: false, error: 'Thiếu mã vận đơn.', data: [] };
    }

    try {
        const response = await api.get(`/shipments/track/${trackingNumber}`);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return {
                success: false,
                error: normalized.message || 'Không tải được lịch sử tracking.',
                data: [],
            };
        }

        const raw = normalized.data;
        const list = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.history)
                ? raw.history
                : Array.isArray(raw?.events)
                    ? raw.events
                    : [];

        return {
            success: true,
            data: list,
        };
    } catch (error) {
        return {
            success: false,
            error: mapError(error, 'Không tải được lịch sử tracking.'),
            data: [],
        };
    }
};

export default {
    getShipmentByOrderId,
    getTrackingByNumber,
};

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

export const getMyWallet = async () => {
    try {
        const response = await api.get('/wallet');
        const payload = normalizeResponse(response);

        if (!isSuccessCode(payload.code)) {
            return { success: false, error: payload.message || 'Không thể tải ví.' };
        }

        return { success: true, data: payload.data ?? null };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể tải ví.') };
    }
};

export const getWalletBalance = async () => {
    try {
        const response = await api.get('/wallet/balance');
        const payload = normalizeResponse(response);

        if (!isSuccessCode(payload.code)) {
            return { success: false, error: payload.message || 'Không thể tải số dư ví.', data: 0 };
        }

        return { success: true, data: Number(payload.data ?? 0) };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể tải số dư ví.'), data: 0 };
    }
};

export const getWalletTransactions = async () => {
    try {
        const response = await api.get('/wallet/transactions');
        const payload = normalizeResponse(response);

        if (!isSuccessCode(payload.code)) {
            return { success: false, error: payload.message || 'Không thể tải giao dịch ví.', data: [] };
        }

        return { success: true, data: toArray(payload.data) };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể tải giao dịch ví.'), data: [] };
    }
};

export const getWalletByAccountId = async (accountId) => {
    if (!accountId) {
        return { success: false, error: 'Thiếu accountId.' };
    }

    try {
        const response = await api.get(`/wallet/account/${accountId}`);
        const payload = normalizeResponse(response);

        if (!isSuccessCode(payload.code)) {
            return { success: false, error: payload.message || 'Không thể tải ví theo tài khoản.' };
        }

        return { success: true, data: payload.data ?? null };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể tải ví theo tài khoản.') };
    }
};

export const createWithdrawalRequest = async (payload) => {
    try {
        const body = {
            amount: Number(payload?.amount || 0),
            bankName: String(payload?.bankName || '').trim(),
            bankAccountNumber: String(payload?.bankAccountNumber || '').trim(),
            bankAccountName: String(payload?.bankAccountName || '').trim(),
        };

        const response = await api.post('/withdrawals', body);
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Tạo yêu cầu rút tiền thất bại.' };
        }

        return { success: true, data: normalized.data || {} };
    } catch (error) {
        return { success: false, error: mapError(error, 'Tạo yêu cầu rút tiền thất bại.') };
    }
};

export const getMyWithdrawals = async () => {
    try {
        const response = await api.get('/withdrawals/my');
        const normalized = normalizeResponse(response);

        if (!isSuccessCode(normalized.code)) {
            return { success: false, error: normalized.message || 'Không thể tải danh sách rút tiền.', data: [] };
        }

        return { success: true, data: toArray(normalized.data) };
    } catch (error) {
        return { success: false, error: mapError(error, 'Không thể tải danh sách rút tiền.'), data: [] };
    }
};

export default {
    getMyWallet,
    getWalletBalance,
    getWalletTransactions,
    getWalletByAccountId,
    createWithdrawalRequest,
    getMyWithdrawals,
};

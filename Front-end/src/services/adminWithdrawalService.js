import api from '../cofig/api';

const WITHDRAWALS_BASE = '/admin/withdrawals';

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

const normalizePage = (payload) => {
  if (!payload) {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 0,
      first: true,
      last: true,
    };
  }

  if (Array.isArray(payload)) {
    return {
      content: payload,
      totalElements: payload.length,
      totalPages: 1,
      number: 0,
      size: payload.length,
      first: true,
      last: true,
    };
  }

  return {
    content: Array.isArray(payload.content) ? payload.content : [],
    totalElements: Number(payload.totalElements || 0),
    totalPages: Number(payload.totalPages || 0),
    number: Number(payload.number || 0),
    size: Number(payload.size || 0),
    first: Boolean(payload.first),
    last: Boolean(payload.last),
  };
};

export const getWithdrawalsApi = async (filters = {}) => {
  try {
    const params = {};

    if (filters.status) params.status = filters.status;
    if (filters.artisanName) params.artisanName = filters.artisanName;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.page !== undefined && filters.page !== null) params.page = filters.page;
    if (filters.size !== undefined && filters.size !== null) params.size = filters.size;

    const response = await api.get(WITHDRAWALS_BASE, { params });
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Không tải được danh sách rút tiền.', data: normalizePage() };
    }

    return { success: true, data: normalizePage(normalized.data) };
  } catch (error) {
    return { success: false, error: mapError(error, 'Không tải được danh sách rút tiền.'), data: normalizePage() };
  }
};

export const getWithdrawalDetailApi = async (id) => {
  if (!id) {
    return { success: false, error: 'Thiếu mã yêu cầu rút tiền.', data: null };
  }

  try {
    const response = await api.get(`${WITHDRAWALS_BASE}/${id}`);
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Không tải được chi tiết rút tiền.', data: null };
    }

    return { success: true, data: normalized.data || null };
  } catch (error) {
    return { success: false, error: mapError(error, 'Không tải được chi tiết rút tiền.'), data: null };
  }
};

export const approveWithdrawalApi = async (id, payload = {}) => {
  if (!id) return { success: false, error: 'Thiếu mã yêu cầu rút tiền.', data: null };

  try {
    const response = await api.post(`${WITHDRAWALS_BASE}/${id}/approve`, payload);
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Phê duyệt thất bại.', data: null };
    }

    return { success: true, data: normalized.data || null };
  } catch (error) {
    return { success: false, error: mapError(error, 'Phê duyệt thất bại.'), data: null };
  }
};

export const rejectWithdrawalApi = async (id, payload = {}) => {
  if (!id) return { success: false, error: 'Thiếu mã yêu cầu rút tiền.', data: null };

  try {
    const response = await api.post(`${WITHDRAWALS_BASE}/${id}/reject`, payload);
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Từ chối thất bại.', data: null };
    }

    return { success: true, data: normalized.data || null };
  } catch (error) {
    return { success: false, error: mapError(error, 'Từ chối thất bại.'), data: null };
  }
};

export default {
  getWithdrawalsApi,
  getWithdrawalDetailApi,
  approveWithdrawalApi,
  rejectWithdrawalApi,
};

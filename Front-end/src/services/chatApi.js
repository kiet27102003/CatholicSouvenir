import api from '../cofig/api';

const CHAT_BASE = '/chat';

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

const authConfig = (token) => {
  if (!token) return {};
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const withParams = (token, params) => ({
  ...authConfig(token),
  params,
});

export const getConversationsApi = async (token) => {
  try {
    const response = await api.get(`${CHAT_BASE}/conversations`, authConfig(token));
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Không tải được cuộc trò chuyện.', data: [] };
    }

    return { success: true, data: Array.isArray(normalized.data) ? normalized.data : [] };
  } catch (error) {
    return { success: false, error: mapError(error, 'Không tải được cuộc trò chuyện.'), data: [] };
  }
};

export const getConversationMessagesApi = async (conversationId, { page = 0, size = 50 } = {}, token) => {
  if (!conversationId) return { success: false, error: 'Thiếu mã cuộc trò chuyện.', data: [] };

  try {
    const response = await api.get(
      `${CHAT_BASE}/conversation/${conversationId}/messages`,
      withParams(token, { page, size }),
    );
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Không tải được tin nhắn.', data: [] };
    }

    const payload = normalized.data;
    const messages = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.content)
        ? payload.content
        : [];

    return { success: true, data: messages };
  } catch (error) {
    return { success: false, error: mapError(error, 'Không tải được tin nhắn.'), data: [] };
  }
};

export const sendMessageApi = async (payload, token) => {
  try {
    const response = await api.post(`${CHAT_BASE}/send`, payload, authConfig(token));
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Gửi tin nhắn thất bại.', data: null };
    }

    return { success: true, data: normalized.data || null };
  } catch (error) {
    return { success: false, error: mapError(error, 'Gửi tin nhắn thất bại.'), data: null };
  }
};

export const markConversationReadApi = async (conversationId, token) => {
  if (!conversationId) return { success: false, error: 'Thiếu mã cuộc trò chuyện.' };

  try {
    const response = await api.post(
      `${CHAT_BASE}/conversation/${conversationId}/mark-read`,
      {},
      authConfig(token),
    );
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Đánh dấu đã đọc thất bại.' };
    }

    return { success: true, data: normalized.data || null };
  } catch (error) {
    return { success: false, error: mapError(error, 'Đánh dấu đã đọc thất bại.') };
  }
};

export const getUnreadCountApi = async (token) => {
  try {
    const response = await api.get(`${CHAT_BASE}/unread-count`, authConfig(token));
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Không tải được số tin chưa đọc.', data: 0 };
    }

    return { success: true, data: Number(normalized.data || 0) };
  } catch (error) {
    return { success: false, error: mapError(error, 'Không tải được số tin chưa đọc.'), data: 0 };
  }
};

export default {
  getConversationsApi,
  getConversationMessagesApi,
  sendMessageApi,
  markConversationReadApi,
  getUnreadCountApi,
};

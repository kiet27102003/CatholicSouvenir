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

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getMyConversations = async () => {
  try {
    const response = await api.get('/conversations/my-conversations');
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Không tải được cuộc trò chuyện.', data: [] };
    }

    return { success: true, data: toArray(normalized.data) };
  } catch (error) {
    return { success: false, error: mapError(error, 'Không tải được cuộc trò chuyện.'), data: [] };
  }
};

export const getConversationDetail = async (conversationId) => {
  if (!conversationId) return { success: false, error: 'Thiếu mã cuộc trò chuyện.' };

  try {
    const response = await api.get(`/conversations/${conversationId}`);
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Không tải được chi tiết cuộc trò chuyện.' };
    }

    return { success: true, data: normalized.data || null };
  } catch (error) {
    return { success: false, error: mapError(error, 'Không tải được chi tiết cuộc trò chuyện.') };
  }
};

export const getConversationsByRequest = async (requestId) => {
  if (!requestId) return { success: false, error: 'Thiếu mã yêu cầu.', data: [] };

  try {
    const response = await api.get(`/conversations/request/${requestId}`);
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Không tải được danh sách nghệ nhân.', data: [] };
    }

    return { success: true, data: toArray(normalized.data) };
  } catch (error) {
    return { success: false, error: mapError(error, 'Không tải được danh sách nghệ nhân.'), data: [] };
  }
};

export const startConversation = async (requestId) => {
  if (!requestId) return { success: false, error: 'Thiếu mã yêu cầu.' };

  try {
    const response = await api.post('/conversations/start', null, {
      params: { requestId },
    });
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Không thể bắt đầu cuộc trò chuyện.' };
    }

    return { success: true, data: normalized.data || null };
  } catch (error) {
    return { success: false, error: mapError(error, 'Không thể bắt đầu cuộc trò chuyện.') };
  }
};

export const getMessages = async ({ requestId, artisanId }) => {
  if (!requestId) return { success: false, error: 'Thiếu mã yêu cầu.', data: [] };

  try {
    const response = await api.get('/messages', {
      params: {
        requestId,
        artisanId,
      },
    });
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Không tải được lịch sử tin nhắn.', data: [] };
    }

    return { success: true, data: toArray(normalized.data) };
  } catch (error) {
    return { success: false, error: mapError(error, 'Không tải được lịch sử tin nhắn.'), data: [] };
  }
};

export const markMessagesRead = async (requestId) => {
  if (!requestId) return { success: false, error: 'Thiếu mã yêu cầu.' };

  try {
    const response = await api.post('/messages/mark-read', null, {
      params: { requestId },
    });
    const normalized = normalizeResponse(response);

    if (!isSuccessCode(normalized.code)) {
      return { success: false, error: normalized.message || 'Không thể đánh dấu đã đọc.' };
    }

    return { success: true, data: normalized.data || null };
  } catch (error) {
    return { success: false, error: mapError(error, 'Không thể đánh dấu đã đọc.') };
  }
};

export default {
  getMyConversations,
  getConversationDetail,
  getConversationsByRequest,
  startConversation,
  getMessages,
  markMessagesRead,
};

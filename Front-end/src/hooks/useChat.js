import { useCallback, useMemo, useState } from 'react';
import {
  getConversationDetailApi,
  getConversationMessagesApi,
  getConversationsApi,
  getUnreadCountApi,
  markConversationReadApi,
  sendMessageApi,
} from '../services/chatApi';

const sortBySentAt = (list) => [...list].sort((a, b) => new Date(a?.sentAt || 0) - new Date(b?.sentAt || 0));

const pickRequestId = (conversation) => (
  conversation?.requestId ||
  conversation?.customRequestId ||
  conversation?.request?.requestId ||
  conversation?.request?.id ||
  conversation?.customRequest?.requestId ||
  conversation?.customRequest?.id ||
  conversation?.customRequestId ||
  conversation?.order?.requestId ||
  conversation?.order?.customRequestId ||
  null
);

const normalizeConversation = (conversation) => ({
  ...conversation,
  conversationId: conversation?.conversationId || conversation?.id,
  requestId: pickRequestId(conversation),
  requestTitle:
    conversation?.requestTitle ||
    conversation?.title ||
    conversation?.request?.title ||
    conversation?.customRequest?.title ||
    conversation?.customRequest?.requestTitle ||
    'Yêu cầu đặt riêng',
  requestDescription:
    conversation?.requestDescription ||
    conversation?.description ||
    conversation?.request?.description ||
    conversation?.customRequest?.description ||
    conversation?.customRequest?.requestDescription ||
    '',
  minBudget:
    conversation?.minBudget ??
    conversation?.request?.minBudget ??
    conversation?.customRequest?.minBudget ??
    0,
  maxBudget:
    conversation?.maxBudget ??
    conversation?.request?.maxBudget ??
    conversation?.customRequest?.maxBudget ??
    0,
  unreadCount: Number(conversation?.unreadCount || 0),
  isRead: conversation?.isRead ?? Number(conversation?.unreadCount || 0) === 0,
});

export default function useChat({ token, currentUserId }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError('');

    const [conversationsRes, unreadRes] = await Promise.all([
      getConversationsApi(token),
      getUnreadCountApi(token),
    ]);

    if (!conversationsRes.success) {
      setIsLoading(false);
      setError(conversationsRes.error || 'Không tải được danh sách cuộc trò chuyện.');
      return;
    }

    setConversations((conversationsRes.data || []).map(normalizeConversation));

    if (unreadRes.success) {
      setUnreadCount(Number(unreadRes.data || 0));
    }

    setIsLoading(false);
  }, [token]);

  const selectConversation = useCallback(async (conversationId) => {
    if (!conversationId) return;

    setIsLoading(true);
    setError('');

    const messagesRes = await getConversationMessagesApi(conversationId, { page: 0, size: 50 }, token);

    if (!messagesRes.success) {
      setIsLoading(false);
      setError(messagesRes.error || 'Không tải được tin nhắn.');
      return;
    }

    setMessages(sortBySentAt(messagesRes.data || []));
    setSelectedConversation(conversationId);

    const markRes = await markConversationReadApi(conversationId, token);
    if (markRes.success) {
      setConversations((prev) =>
        prev.map((conv) => {
          if (String(conv.conversationId) !== String(conversationId)) return conv;
          return {
            ...conv,
            unreadCount: 0,
            isRead: true,
          };
        }),
      );

      setUnreadCount((prev) => {
        const target = conversations.find((conv) => String(conv.conversationId) === String(conversationId));
        const minus = Number(target?.unreadCount || 0);
        return Math.max(0, Number(prev || 0) - minus);
      });
    }

    setIsLoading(false);
  }, [conversations, token]);

  const upsertConversationPreview = useCallback((incomingMessage) => {
    setConversations((prev) => {
      const convId = incomingMessage?.conversationId;
      const idx = prev.findIndex((item) => String(item.conversationId) === String(convId));

      if (idx === -1) {
        return [
          normalizeConversation({
            conversationId: convId,
            lastMessage: incomingMessage?.content || '',
            sentAt: incomingMessage?.sentAt,
            otherParticipantName: incomingMessage?.otherParticipantName || 'Người dùng',
            unreadCount: 0,
            isRead: true,
          }),
          ...prev,
        ];
      }

      const found = prev[idx];
      const next = {
        ...found,
        lastMessage: incomingMessage?.content || found.lastMessage,
        sentAt: incomingMessage?.sentAt || found.sentAt,
      };

      const copied = [...prev];
      copied.splice(idx, 1);
      copied.unshift(next);
      return copied;
    });
  }, []);

  const handleIncomingMessage = useCallback((incomingMessage) => {
    if (!incomingMessage || !incomingMessage.conversationId) return;

    const isSelected = String(incomingMessage.conversationId) === String(selectedConversation);
    const isMine = String(incomingMessage.senderId) === String(currentUserId);

    upsertConversationPreview(incomingMessage);

    if (isSelected) {
      setMessages((prev) => sortBySentAt([...prev, incomingMessage]));
      if (!isMine) {
        markConversationReadApi(incomingMessage.conversationId, token);
      }
      return;
    }

    if (!isMine) {
      setConversations((prev) =>
        prev.map((conv) => {
          if (String(conv.conversationId) !== String(incomingMessage.conversationId)) return conv;
          return {
            ...conv,
            unreadCount: Number(conv.unreadCount || 0) + 1,
            isRead: false,
          };
        }),
      );
      setUnreadCount((prev) => Number(prev || 0) + 1);
    }
  }, [currentUserId, selectedConversation, token, upsertConversationPreview]);

  const sendMessage = useCallback(async (content) => {
    const safeContent = String(content || '').trim();
    if (!safeContent || !selectedConversation) return { success: false, error: 'Tin nhắn trống.' };

    const optimisticMessage = {
      messageId: `local-${Date.now()}`,
      conversationId: selectedConversation,
      senderId: currentUserId,
      senderName: 'Bạn',
      content: safeContent,
      messageType: 'TEXT',
      sentAt: new Date().toISOString(),
      isRead: true,
      optimistic: true,
    };

    setMessages((prev) => sortBySentAt([...prev, optimisticMessage]));
    upsertConversationPreview(optimisticMessage);

    const sendRes = await sendMessageApi(
      {
        conversationId: selectedConversation,
        content: safeContent,
        messageType: 'TEXT',
      },
      token,
    );

    if (!sendRes.success) {
      setMessages((prev) => prev.filter((msg) => msg.messageId !== optimisticMessage.messageId));
      return { success: false, error: sendRes.error || 'Gửi tin nhắn thất bại.' };
    }

    if (sendRes.data?.messageId) {
      setMessages((prev) =>
        prev.map((msg) => (msg.messageId === optimisticMessage.messageId ? { ...sendRes.data, optimistic: false } : msg)),
      );
    }

    return { success: true, data: sendRes.data };
  }, [currentUserId, selectedConversation, token, upsertConversationPreview]);

  return {
    conversations: useMemo(() => conversations, [conversations]),
    selectedConversation,
    messages,
    unreadCount,
    isLoading,
    error,
    loadConversations,
    selectConversation,
    sendMessage,
    handleIncomingMessage,
  };
}

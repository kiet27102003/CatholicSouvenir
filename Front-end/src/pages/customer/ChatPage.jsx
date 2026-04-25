import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import { getCustomRequestDetail } from '../../services/customRequestService';
import { getConversationDetail } from '../../services/chatService';
import useChat from '../../hooks/useChat';
import useWebSocket from '../../hooks/useWebSocket';
import Header from '../../components/Header/Header';
import ConversationList from '../../components/chat/ConversationList';
import MessageList from '../../components/chat/MessageList';
import MessageInput from '../../components/chat/MessageInput';
import './ChatPage.css';

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://catholic-souvenir-api.southeastasia.cloudapp.azure.com/ws';

const resolveToken = (user) => {
  if (user?.token) return user.token;

  const storedUser = localStorage.getItem('sanctus_user') || sessionStorage.getItem('sanctus_user');
  if (!storedUser) return '';

  try {
    return JSON.parse(storedUser)?.token || '';
  } catch {
    return '';
  }
};

const initials = (name) => {
  const text = String(name || 'U').trim();
  if (!text) return 'U';
  const parts = text.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('');
};

const truncate = (value, max = 120) => {
  const text = String(value || '').trim();
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const formatBudget = (min, max) => `${new Intl.NumberFormat('vi-VN').format(Number(min || 0))} đ - ${new Intl.NumberFormat('vi-VN').format(Number(max || 0))} đ`;

const quoteTemplate = `📋 Báo giá của tôi:\n• Tổng giá: ___ đ\n• Thời gian: ___ ngày\n• Giai đoạn 1: ...\n• Giai đoạn 2: ...\n• Giai đoạn 3: ...\nVui lòng xác nhận để tôi bắt đầu.`;

export default function ChatPage({ hideHeader = false } = {}) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [mobileView, setMobileView] = useState('list');
  const [isTyping] = useState(false);
  const [requestDetail, setRequestDetail] = useState(null);
  const [loadingRequestBudget, setLoadingRequestBudget] = useState(false);

  const token = useMemo(() => resolveToken(user), [user]);
  const currentUserId = user?.id;
  const role = String(user?.role || '').toUpperCase();

  const {
    conversations,
    selectedConversation,
    messages,
    unreadCount,
    isLoading,
    error,
    loadConversations,
    selectConversation,
    sendMessage,
    handleIncomingMessage,
  } = useChat({ token, currentUserId });

  const { isConnected } = useWebSocket({
    wsUrl: WS_URL,
    jwtToken: token,
    conversationId: selectedConversation,
    onMessageReceived: handleIncomingMessage,
  });

  const requestedConversationId = searchParams.get('conversationId');

  const selectedConversationData = useMemo(() => (
    (conversations || []).find((conv) => String(conv?.conversationId || conv?.id) === String(selectedConversation || '')) || null
  ), [conversations, selectedConversation]);

  useEffect(() => {
    let active = true;
    if (!selectedConversation || selectedConversationData?.requestId) return undefined;

    (async () => {
      const detailRes = await getConversationDetail(selectedConversation);
      if (!active || !detailRes.success || !detailRes.data) return;

      const detail = detailRes.data;
      const mappedRequestId =
        detail?.requestId ||
        detail?.customRequestId ||
        detail?.request?.requestId ||
        detail?.request?.id ||
        detail?.customRequest?.requestId ||
        detail?.customRequest?.id ||
        detail?.order?.requestId ||
        detail?.order?.customRequestId ||
        null;

      if (mappedRequestId) {
        setRequestDetail((prev) => prev || {
          ...detail,
          requestId: mappedRequestId,
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedConversation, selectedConversationData?.requestId]);

  useEffect(() => {
    if (!token) return;
    loadConversations();
  }, [loadConversations, token]);

  useEffect(() => {
    if (!error) return;
    appToast.error('Lỗi chat', error);
  }, [error]);

  useEffect(() => {
    if (requestedConversationId && String(selectedConversation || '') !== String(requestedConversationId)) {
      selectConversation(requestedConversationId);
      setMobileView('chat');
      return;
    }

    if (!conversations.length || selectedConversation) return;
    selectConversation(conversations[0].conversationId || conversations[0].id);
  }, [conversations, requestedConversationId, selectConversation, selectedConversation]);

  useEffect(() => {
    const requestId = selectedConversationData?.requestId || selectedConversationData?.customRequestId;
    if (!requestId) {
      setRequestDetail(null);
      return;
    }

    let active = true;
    setLoadingRequestBudget(true);

    (async () => {
      const res = await getCustomRequestDetail(requestId);
      if (!active) return;

      if (res.success && res.data) {
        setRequestDetail(res.data);
      } else {
        setRequestDetail(selectedConversationData);
      }
      setLoadingRequestBudget(false);
    })();

    return () => {
      active = false;
    };
  }, [selectedConversationData?.customRequestId, selectedConversationData?.maxBudget, selectedConversationData?.minBudget, selectedConversationData?.requestId]);

  if (!token) {
    return (
      <div className="chat-page">
        {!hideHeader && <Header />}
        <main className="chat-page-main">
          <div className="chat-auth-box">
            <div className="chat-auth-warning">Bạn cần đăng nhập để sử dụng chat.</div>
          </div>
        </main>
      </div>
    );
  }

  const requestTitle = requestDetail?.title || selectedConversationData?.requestTitle || 'Yêu cầu đặt riêng';
  const budgetLabel = useMemo(() => {
    const min = Number(requestDetail?.minBudget ?? selectedConversationData?.minBudget ?? 0);
    const max = Number(requestDetail?.maxBudget ?? selectedConversationData?.maxBudget ?? 0);
    return formatBudget(min, max);
  }, [requestDetail, selectedConversationData?.maxBudget, selectedConversationData?.minBudget]);
  const otherName = selectedConversationData?.otherParticipantName || 'Đối phương';

  return (
    <div className={`chat-page ${hideHeader ? 'chat-page--embedded' : ''}`}>
      {!hideHeader && <Header />}
      <main className={`chat-page-main ${hideHeader ? 'chat-page-main--embedded' : ''}`}>
        <div className="chat-mobile-tabs">
          <button type="button" className={mobileView === 'list' ? 'active' : ''} onClick={() => setMobileView('list')}>Danh sách</button>
          <button type="button" className={mobileView === 'chat' ? 'active' : ''} onClick={() => setMobileView('chat')}>Chat</button>
        </div>

        <div className="chat-layout">
        <aside className={`chat-col left chat-conversation-list ${mobileView === 'chat' ? 'hide-mobile' : ''}`}>
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={(id) => {
              selectConversation(id);
              setMobileView('chat');
            }}
            isLoading={isLoading}
          />
        </aside>

        <section className={`chat-col center chat-main ${mobileView === 'list' ? 'hide-mobile' : ''}`}>
          <div className="chat-header">
            <div className="chat-peer">
              <div className="avatar">{initials(otherName)}</div>
              <div>
                <p className="name">{otherName}</p>
                <p className={`state ${isConnected ? 'ok' : 'bad'}`}>
                  <span className="status-dot" aria-hidden="true" />
                  {isConnected ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <span className="request-pill">{requestTitle}</span>
          </div>

          <div className="chat-messages-wrap chat-messages">
            <MessageList messages={messages} currentUserId={currentUserId} isLoading={isLoading} isTyping={isTyping} />
          </div>

          <MessageInput
            onSend={sendMessage}
            disabled={!isConnected || !selectedConversation}
            showTemplateButton={role === 'ARTISAN'}
            onUseTemplate={() => quoteTemplate}
            budgetLabel={budgetLabel}
            budgetLoading={loadingRequestBudget}
          />
        </section>

        </div>
      </main>
    </div>
  );
}

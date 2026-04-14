import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import { selectCustomRequestArtisan } from '../../services/customRequestService';
import useChat from '../../hooks/useChat';
import useWebSocket from '../../hooks/useWebSocket';
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

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [mobileView, setMobileView] = useState('list');
  const [isTyping] = useState(false);
  const [isSelectingArtisan, setIsSelectingArtisan] = useState(false);

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
    onMessageReceived: handleIncomingMessage,
  });

  const requestedConversationId = searchParams.get('conversationId');

  const selectedConversationData = useMemo(() => (
    (conversations || []).find((conv) => String(conv?.conversationId || conv?.id) === String(selectedConversation || '')) || null
  ), [conversations, selectedConversation]);

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

  if (!token) {
    return (
      <div className="chat-auth-box">
        <div className="chat-auth-warning">Bạn cần đăng nhập để sử dụng chat.</div>
      </div>
    );
  }

  const requestTitle = selectedConversationData?.requestTitle || 'Yêu cầu đặt riêng';
  const requestDescription = selectedConversationData?.requestDescription || selectedConversationData?.description || '';
  const minBudget = selectedConversationData?.minBudget;
  const maxBudget = selectedConversationData?.maxBudget;
  const selectedArtisanId = selectedConversationData?.selectedArtisanId || selectedConversationData?.selectedArtisan?.id;
  const artisanCandidates = Array.isArray(selectedConversationData?.artisansInterested)
    ? selectedConversationData.artisansInterested
    : [];

  const otherName = selectedConversationData?.otherParticipantName || 'Đối phương';
  const requestStatus = selectedConversationData?.requestStatus || 'OPEN';

  const handleSelectArtisan = async (artisanId) => {
    const requestId = selectedConversationData?.requestId || selectedConversationData?.customRequestId;
    if (!requestId || !artisanId || isSelectingArtisan) return;

    setIsSelectingArtisan(true);
    const res = await selectCustomRequestArtisan(requestId, artisanId);
    setIsSelectingArtisan(false);

    if (!res.success) {
      appToast.error('Không thể chọn nghệ nhân', res.error || 'Vui lòng thử lại');
      return;
    }

    appToast.success('Đã chọn nghệ nhân cho yêu cầu');
    loadConversations();
  };

  return (
    <div className="chat-page">
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
          />
        </section>

        <aside className="chat-col right chat-info">
          <div className="card-box info-section">
            <h3>Thông tin yêu cầu</h3>
            <p className="title">{requestTitle}</p>
            <p className="desc">{truncate(requestDescription, 110)}</p>
            <div className="budget-box">
              <span className="budget-label">Ngân sách</span>
              <span className="budget-value">{formatBudget(minBudget, maxBudget)}</span>
            </div>
          </div>

          {role === 'CUSTOMER' && (
            <div className="card-box info-section">
              <h3>Nghệ nhân quan tâm</h3>
              {artisanCandidates.length === 0 ? (
                <p className="desc">Chưa có nghệ nhân quan tâm.</p>
              ) : (
                <div className="artisan-list">
                  {artisanCandidates.map((artisan) => {
                    const isSelected = String(artisan?.id || '') === String(selectedArtisanId || '');
                    return (
                      <div key={String(artisan?.id)} className="artisan-item">
                        <div className="artisan-main">
                          <div className="avatar small">{initials(artisan?.fullName || artisan?.name)}</div>
                          <p>{artisan?.fullName || artisan?.name || 'Nghệ nhân'}</p>
                        </div>
                        {isSelected ? (
                          <span className="picked">Đã chọn</span>
                        ) : (
                          <button
                            type="button"
                            className="pick-btn"
                            disabled={isSelectingArtisan}
                            onClick={() => handleSelectArtisan(artisan?.id)}
                          >
                            Chọn
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="card-box info-section">
            <h3>Trạng thái</h3>
            <span className="status-pill">{String(requestStatus || 'OPEN')}</span>
            <p className={`ws ${isConnected ? 'ok' : 'bad'}`}>
              <span className="ws-dot" aria-hidden="true" />
              {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

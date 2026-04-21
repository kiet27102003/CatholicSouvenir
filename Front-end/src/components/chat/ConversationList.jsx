import React, { useMemo, useState } from 'react';
import './ConversationList.css';

const formatTimeLabel = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const now = new Date();

  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'hôm qua';

  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const initials = (name) => {
  const text = String(name || 'U').trim();
  if (!text) return 'U';
  const parts = text.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('');
};

const truncate = (value, max = 30) => {
  const text = String(value || '').trim();
  if (!text) return 'Chưa có tin nhắn';
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

export default function ConversationList({ conversations, selectedConversation, onSelectConversation, isLoading }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = Array.isArray(conversations) ? conversations : [];
    if (!q) return list;
    return list.filter((item) => String(item?.otherParticipantName || '').toLowerCase().includes(q));
  }, [conversations, search]);

  return (
    <div className="conv-list">
      <div className="conv-search-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="conv-search"
          placeholder="Tìm kiếm..."
        />
      </div>

      <div className="conv-scroll">
        {isLoading ? (
          <div className="conv-loading">Đang tải cuộc trò chuyện...</div>
        ) : filtered.length === 0 ? (
          <div className="conv-empty">Chưa có tin nhắn nào</div>
        ) : (
          filtered.map((conversation) => {
            const conversationId = conversation?.conversationId || conversation?.id;
            const isSelected = String(selectedConversation || '') === String(conversationId || '');
            const unread = Number(conversation?.unreadCount || 0);
            const name = conversation?.otherParticipantName || 'Người dùng';
            const requestId =
              conversation?.requestId ||
              conversation?.customRequestId ||
              conversation?.request?.requestId ||
              conversation?.request?.id ||
              conversation?.customRequest?.requestId ||
              conversation?.customRequest?.id ||
              '';

            return (
              <button
                key={String(conversationId)}
                type="button"
                onClick={() => onSelectConversation?.(conversationId)}
                className={`conv-item ${isSelected ? 'active' : ''}`}
              >
                <div className="conv-avatar">{initials(name)}</div>

                <div className="conv-main">
                  <div className="conv-line-1">
                    <p className="name">{name}</p>
                    <span className="time">{formatTimeLabel(conversation?.sentAt || conversation?.updatedAt)}</span>
                  </div>

                  <p className="last">{truncate(conversation?.lastMessage)}</p>

                  <div className="conv-line-2">
                    <span className="request">{conversation?.requestTitle || 'Yêu cầu đặt riêng'}</span>
                    {requestId ? <span className="request-id">#{String(requestId).slice(0, 8)}…</span> : null}
                    {unread > 0 && <span className="unread">{unread}</span>}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

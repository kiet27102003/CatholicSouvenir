import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './MessageList.css';

const timeOnly = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const initials = (name) => {
  const text = String(name || 'U').trim();
  if (!text) return 'U';
  const parts = text.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('');
};

const looksSystem = (message) => {
  const t = String(message?.messageType || '').toUpperCase();
  return t === 'SYSTEM' || Boolean(message?.system);
};

export default function MessageList({ messages, currentUserId, isLoading = false, isTyping = false }) {
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const sortedMessages = useMemo(() => {
    const list = Array.isArray(messages) ? messages : [];
    return [...list].sort((a, b) => new Date(a?.sentAt || 0) - new Date(b?.sentAt || 0));
  }, [messages]);

  const isNearBottom = () => {
    const el = listRef.current;
    if (!el) return true;
    const threshold = 120;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const scrollToBottom = (behavior = 'auto') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useLayoutEffect(() => {
    scrollToBottom('auto');
    setAutoScrollEnabled(true);
  }, [sortedMessages.length]);

  useEffect(() => {
    if (isTyping && autoScrollEnabled) scrollToBottom('smooth');
  }, [isTyping, autoScrollEnabled]);

  useEffect(() => {
    if (!autoScrollEnabled) return;
    scrollToBottom('smooth');
  }, [sortedMessages, autoScrollEnabled]);

  const handleScroll = () => {
    setAutoScrollEnabled(isNearBottom());
  };

  if (isLoading) {
    return <div className="msg-empty">Đang tải tin nhắn...</div>;
  }

  if (!sortedMessages.length) {
    return <div className="msg-empty">Chưa có tin nhắn nào.</div>;
  }

  return (
    <div className="msg-list" ref={listRef} onScroll={handleScroll}>
      {sortedMessages.map((message) => {
        if (looksSystem(message)) {
          return (
            <div key={message?.messageId || `${message?.sentAt}-${message?.content}`} className="msg-system">
              {message?.content} · {timeOnly(message?.sentAt)}
            </div>
          );
        }

        const isMine = String(message?.senderId || '') === String(currentUserId || '');

        return (
          <div key={message?.messageId || `${message?.conversationId}-${message?.sentAt}-${message?.content}`} className={`msg-row ${isMine ? 'mine' : 'other'}`}>
            {!isMine && <div className="msg-avatar">{initials(message?.senderName)}</div>}

            <div className="msg-content">
              <div className={`msg-bubble ${isMine ? 'mine' : 'other'}`}>
                <p>{message?.content}</p>
              </div>
              <div className={`msg-meta ${isMine ? 'mine' : 'other'}`}>
                <span>{timeOnly(message?.sentAt)}</span>
                {isMine && <span>{message?.isRead ? '✓✓' : '✓'}</span>}
              </div>
            </div>

            {isMine && <div className="msg-avatar">{initials(message?.senderName || 'Me')}</div>}
          </div>
        );
      })}

      {isTyping && (
        <div className="msg-typing">
          <span>...</span>
          <small>Đang nhập</small>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

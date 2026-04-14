import React, { useEffect, useState } from 'react';
import './MessageInput.css';

export default function MessageInput({ onSend, disabled, initialValue = '', showTemplateButton = false, onUseTemplate }) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSend = async () => {
    const content = String(value || '').trim();
    if (!content || disabled) return;

    const result = await onSend?.(content);
    if (result?.success !== false) setValue('');
  };

  return (
    <div className="msg-input-wrap chat-input-area">
      {showTemplateButton && (
        <button
          type="button"
          className="template-btn"
          onClick={() => {
            const template = onUseTemplate?.() || '';
            if (template) setValue(template);
          }}
        >
          📋 Dùng template báo giá
        </button>
      )}

      <div className="msg-input-row">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={disabled ? 'Mất kết nối hoặc chưa chọn cuộc trò chuyện.' : 'Nhập tin nhắn...'}
          rows={2}
          className="msg-textarea"
          disabled={disabled}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
        />
        <button type="button" onClick={handleSend} disabled={disabled || !String(value || '').trim()} className="send-btn">
          Gửi
        </button>
      </div>
    </div>
  );
}

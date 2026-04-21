import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './MessageInput.css';

export default function MessageInput({ onSend, disabled, initialValue = '', showTemplateButton = false, onUseTemplate, budgetLabel = '', budgetLoading = false }) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef(null);

  const resizeTextarea = (element) => {
    if (!element) return;
    element.style.height = '0px';
    element.style.height = `${Math.max(element.scrollHeight, 44)}px`;
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useLayoutEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [value, disabled, initialValue]);

  const handleSend = async () => {
    const content = String(value || '').trim();
    if (!content || disabled) return;

    const result = await onSend?.(content);
    if (result?.success !== false) setValue('');
  };

  return (
    <div className="msg-input-wrap chat-input-area">
      <div className="msg-input-meta">
        <div className="budget-info">
          <span className="budget-label">Ngân sách</span>
          <span className="budget-value">{budgetLoading ? 'Đang tải...' : budgetLabel || '0 đ - 0 đ'}</span>
        </div>

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
      </div>

      <div className="msg-input-row">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            resizeTextarea(e.target);
          }}
          placeholder={disabled ? 'Mất kết nối hoặc chưa chọn cuộc trò chuyện.' : 'Nhập tin nhắn...'}
          rows={1}
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

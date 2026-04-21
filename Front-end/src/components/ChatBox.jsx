import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { appToast } from '../lib/appToast'
import './ChatBox.css'

const initialBotMessage = {
  id: '1',
  role: 'bot',
  content:
    'Xin chào! Tôi là trợ lý của Sanctus Artifex. Tôi có thể giúp bạn tìm hiểu về các sản phẩm thủ công hoặc hỗ trợ đặt hàng. 🙏',
  time: new Date(),
}

const suggestions = ['Tìm sản phẩm', 'Đặt làm riêng', 'Liên hệ nghệ nhân', 'Theo dõi đơn hàng']

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="cb-fab-icon">
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2h9A3.5 3.5 0 0 1 20 5.5v8A3.5 3.5 0 0 1 16.5 17H10l-4.4 3.3A1 1 0 0 1 4 19.5V5.5Z" fill="currentColor" />
    </svg>
  )
}

function SanctusAvatar() {
  return (
    <div className="cb-avatar" aria-hidden="true">
      <span>SA</span>
    </div>
  )
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatBox() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([initialBotMessage])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [textareaHeight, setTextareaHeight] = useState(42)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const adjustTextareaHeight = (element) => {
    if (!element) return
    element.style.height = '0px'
    const nextHeight = Math.max(element.scrollHeight, 42)
    element.style.height = `${nextHeight}px`
    setTextareaHeight(nextHeight)
  }

  const token = useMemo(() => {
    if (user?.token) return user.token
    try {
      const storedUser = localStorage.getItem('sanctus_user') || sessionStorage.getItem('sanctus_user')
      return storedUser ? JSON.parse(storedUser)?.token || '' : ''
    } catch {
      return ''
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useLayoutEffect(() => {
    adjustTextareaHeight(inputRef.current)
  }, [input, isOpen])

  const handleOpen = () => {
    setIsOpen(true)
    setUnreadCount(0)
  }

  const sendMessage = async (textValue) => {
    const text = (textValue ?? input).trim()
    if (!text || isLoading) return

    if (!token) {
      appToast.info('Vui lòng đăng nhập để chat')
      return
    }

    const userMsg = { id: `${Date.now()}`, role: 'user', content: text, time: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = '42px'
    }
    setTextareaHeight(42)
    setIsLoading(true)

    try {
      const response = await fetch('https://catholic-souvenir-api.southeastasia.cloudapp.azure.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(text),
      })

      const data = await response.json()
      const botMsg = {
        id: `${Date.now() + 1}`,
        role: 'bot',
        content: data?.data || 'Xin lỗi, hiện chưa nhận được phản hồi từ bot.',
        time: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])

      if (!isOpen) setUnreadCount((prev) => prev + 1)
    } catch {
      const errMsg = {
        id: `${Date.now() + 1}`,
        role: 'bot',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        time: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
      if (!isOpen) setUnreadCount((prev) => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <button type="button" className="cb-fab" onClick={() => (isOpen ? setIsOpen(false) : handleOpen())} aria-label="Mở chat hỗ trợ">
        <ChatIcon />
        {unreadCount > 0 ? <span className="cb-badge">{unreadCount}</span> : null}
      </button>

      <div className={`cb-panel ${isOpen ? 'cb-panel-open' : 'cb-panel-closed'}`} aria-hidden={!isOpen}>
        <div className="cb-header">
          <div className="cb-header-left">
            <SanctusAvatar />
            <div>
              <div className="cb-title">Trợ lý Sanctus</div>
              <div className="cb-status"><span className="cb-status-dot" />Đang hoạt động</div>
            </div>
          </div>
          <button type="button" className="cb-close" onClick={() => setIsOpen(false)} aria-label="Đóng chat">
            ×
          </button>
        </div>

        <div className="cb-messages">
          <div className="cb-day-label">Hôm nay</div>
          {messages.map((message) => (
            <div key={message.id} className={`cb-row ${message.role === 'user' ? 'cb-row-user' : 'cb-row-bot'}`}>
              {message.role === 'bot' ? <SanctusAvatar /> : null}
              <div className={`cb-bubble ${message.role === 'user' ? 'cb-bubble-user' : 'cb-bubble-bot'}`}>
                <div className="cb-content">{message.content}</div>
                <div className="cb-time">{formatTime(message.time)}</div>
              </div>
            </div>
          ))}

          {isLoading ? (
            <div className="cb-row cb-row-bot">
              <SanctusAvatar />
              <div className="cb-bubble cb-bubble-bot cb-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div className="cb-suggestions" aria-label="Gợi ý nhanh">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              className="cb-chip"
              onClick={() => {
                setInput(item)
                void sendMessage(item)
              }}
              disabled={isLoading}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="cb-input-area">
          <textarea
            ref={inputRef}
            rows={1}
            className="cb-input"
            style={{ height: `${textareaHeight}px` }}
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              adjustTextareaHeight(e.target)
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button type="button" className="cb-send" onClick={() => sendMessage()} disabled={!input.trim() || isLoading} aria-label="Gửi tin nhắn">
            ➤
          </button>
        </div>
      </div>
    </>
  )
}

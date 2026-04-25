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
  const [position, setPosition] = useState(() => {
    if (typeof window === 'undefined') return { x: 24, y: 24 }
    return {
      x: Math.max(24, window.innerWidth - 24 - 52),
      y: Math.max(24, window.innerHeight - 24 - 52),
    }
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const dragStateRef = useRef({ offsetX: 0, offsetY: 0, moved: false })
  const fabRef = useRef(null)

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

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, Math.max(24, window.innerWidth - 80)),
        y: Math.min(prev.y, Math.max(24, window.innerHeight - 80)),
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    setUnreadCount(0)
    setIsHidden(false)
  }

  const handleCloseFab = () => {
    setIsOpen(false)
    setIsHidden(true)
  }

  const handleCloseFabClick = (event) => {
    event.stopPropagation()
    handleCloseFab()
  }

  const startDrag = (event) => {
    if (event.button !== 0) return
    const rect = fabRef.current?.getBoundingClientRect()
    if (!rect) return

    dragStateRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
    }
    setIsDragging(true)
  }

  const handlePointerMove = (event) => {
    if (!isDragging) return

    dragStateRef.current.moved = true
    const size = fabRef.current?.offsetWidth ?? 52
    const maxX = window.innerWidth - size - 12
    const maxY = window.innerHeight - size - 12
    const nextX = Math.min(Math.max(12, event.clientX - dragStateRef.current.offsetX), maxX)
    const nextY = Math.min(Math.max(12, event.clientY - dragStateRef.current.offsetY), maxY)
    setPosition({ x: nextX, y: nextY })
  }

  const endDrag = () => {
    if (!isDragging) return
    setIsDragging(false)
  }

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', endDrag)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', endDrag)
    }
  }, [isDragging])

  const handleFabClick = () => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false
      return
    }
    isOpen ? setIsOpen(false) : handleOpen()
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
      {!isHidden ? (
        <button
          ref={fabRef}
          type="button"
          className={`cb-fab ${isDragging ? 'cb-fab-dragging' : ''}`}
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          onPointerDown={startDrag}
          onPointerUp={() => {
            if (!dragStateRef.current.moved) handleFabClick()
            dragStateRef.current.moved = false
          }}
          aria-label="Mở chat hỗ trợ"
        >
        <ChatIcon />
        {unreadCount > 0 ? <span className="cb-badge">{unreadCount}</span> : null}
          <span className="cb-fab-close" onClick={handleCloseFabClick} role="button" aria-label="Đóng chat">
            ×
          </span>
        </button>
      ) : null}

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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MessageCenterPage.css';

const MOCK_CONVERSATIONS = [
    {
        id: 'c1',
        artisanId: '1',
        artisanName: 'Marco V.',
        artisanAvatar: 'https://i.pravatar.cc/150?img=12',
        unread: 1,
        lastMessage: 'I have attached the quotation for your custom rosary.',
        updatedAt: '2023-10-26T14:30:00',
        messages: [
            {
                id: 'm1',
                sender: 'customer',
                text: 'Hello, I would like to request a custom olive wood rosary with silver inlay for my wedding.',
                timestamp: '2023-10-25T09:00:00'
            },
            {
                id: 'm2',
                sender: 'artisan',
                text: 'God bless you! Congratulations on your upcoming wedding. I would be honored to craft this for you. Do you have a specific crucifix design in mind?',
                timestamp: '2023-10-25T11:30:00'
            },
            {
                id: 'm3',
                sender: 'customer',
                text: 'Yes, a traditional San Damiano cross if possible.',
                timestamp: '2023-10-25T12:15:00'
            },
            {
                id: 'm4',
                sender: 'artisan',
                text: 'That is a beautiful choice. I have attached the quotation for this custom piece. Please review it and let me know if you would like to proceed.',
                timestamp: '2023-10-26T14:30:00',
                isQuotation: true,
                quotation: {
                    id: 'q101',
                    title: 'Custom Olive Wood & Silver Rosary',
                    amount: 185.00,
                    status: 'pending', // pending, accepted, rejected
                    details: 'San Damiano cross in sterling silver, hand-turned olive wood beads from Bethlehem, silver inlay on "Our Father" beads.',
                    estimatedDelivery: '3 weeks'
                }
            }
        ]
    },
    {
        id: 'c2',
        artisanId: '3',
        artisanName: 'Clara M.',
        artisanAvatar: 'https://i.pravatar.cc/150?img=32',
        unread: 0,
        lastMessage: 'Your order is shipped!',
        updatedAt: '2023-09-15T08:20:00',
        messages: [
            {
                id: 'm1',
                sender: 'artisan',
                text: 'Hello! I wanted to let you know your order has been shipped.',
                timestamp: '2023-09-15T08:20:00'
            }
        ]
    }
];

const MessageCenterPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
    const [activeChatId, setActiveChatId] = useState(MOCK_CONVERSATIONS[0]?.id || null);
    const [newMessage, setNewMessage] = useState('');

    const activeConversation = conversations.find(c => c.id === activeChatId);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        const newMsg = {
            id: `msg-${Date.now()}`,
            sender: 'customer',
            text: newMessage,
            timestamp: new Date().toISOString()
        };

        setConversations(prev => prev.map(conv => {
            if (conv.id === activeChatId) {
                return {
                    ...conv,
                    messages: [...conv.messages, newMsg],
                    lastMessage: newMessage,
                    updatedAt: new Date().toISOString()
                };
            }
            return conv;
        }));

        setNewMessage('');
    };

    const handleAcceptQuotation = (conversationId, messageId) => {
        setConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
                const updatedMessages = conv.messages.map(msg => {
                    if (msg.id === messageId && msg.isQuotation) {
                        return {
                            ...msg,
                            quotation: { ...msg.quotation, status: 'accepted' }
                        };
                    }
                    return msg;
                });

                // Add auto-reply from system/customer
                const systemMsg = {
                    id: `msg-${Date.now()}`,
                    sender: 'customer',
                    text: 'I have accepted the quotation. Looking forward to it!',
                    timestamp: new Date().toISOString(),
                    isSystem: true
                };

                return {
                    ...conv,
                    messages: [...updatedMessages, systemMsg],
                    lastMessage: 'Quotation Accepted',
                    updatedAt: new Date().toISOString()
                };
            }
            return conv;
        }));
    };

    const handleRejectQuotation = (conversationId, messageId) => {
        setConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
                const updatedMessages = conv.messages.map(msg => {
                    if (msg.id === messageId && msg.isQuotation) {
                        return {
                            ...msg,
                            quotation: { ...msg.quotation, status: 'rejected' }
                        };
                    }
                    return msg;
                });
                return {
                    ...conv,
                    messages: updatedMessages
                };
            }
            return conv;
        }));
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="message-center-page">
            <div className="messages-container">

                {/* Conversations List */}
                <div className="conversations-sidebar">
                    <div className="sidebar-header">
                        <h2>Messages</h2>
                    </div>
                    <div className="conversations-list">
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`conversation-item ${activeChatId === conv.id ? 'active' : ''} ${conv.unread > 0 ? 'unread' : ''}`}
                                onClick={() => {
                                    setActiveChatId(conv.id);
                                    if (conv.unread > 0) {
                                        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c));
                                    }
                                }}
                            >
                                <div className="conv-avatar">
                                    <img src={conv.artisanAvatar} alt={conv.artisanName} />
                                    {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
                                </div>
                                <div className="conv-info">
                                    <div className="conv-title-row">
                                        <h4>{conv.artisanName}</h4>
                                        <span className="conv-date">{formatDate(conv.updatedAt)}</span>
                                    </div>
                                    <p className="conv-preview">{conv.lastMessage}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Chat Area */}
                <div className="chat-area">
                    {activeConversation ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-artisan-info">
                                    <img src={activeConversation.artisanAvatar} alt={activeConversation.artisanName} className="chat-avatar" />
                                    <div>
                                        <h3>{activeConversation.artisanName}</h3>
                                        <span className="artisan-status">Typical reply time: a few hours</span>
                                    </div>
                                </div>
                                <button className="btn btn-outline btn-sm">View Shop</button>
                            </div>

                            <div className="chat-messages">
                                {activeConversation.messages.map(msg => (
                                    <div key={msg.id} className={`message-wrapper ${msg.sender === 'customer' ? 'message-outgoing' : 'message-incoming'}`}>

                                        {!msg.isSystem && msg.sender === 'artisan' && (
                                            <img src={activeConversation.artisanAvatar} alt="Artisan" className="message-avatar" />
                                        )}

                                        <div className="message-content-box">
                                            {msg.isSystem ? (
                                                <div className="system-message">
                                                    <p>{msg.text}</p>
                                                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                                                </div>
                                            ) : (
                                                <div className={`message-bubble ${msg.isQuotation ? 'quotation-bubble' : ''}`}>
                                                    <p>{msg.text}</p>

                                                    {msg.isQuotation && (
                                                        <div className="quotation-card">
                                                            <div className="quotation-header">
                                                                <h4>Quotation</h4>
                                                                <span className={`status-badge status-${msg.quotation.status}`}>
                                                                    {msg.quotation.status}
                                                                </span>
                                                            </div>
                                                            <div className="quotation-body">
                                                                <p className="quote-title">{msg.quotation.title}</p>
                                                                <p className="quote-details">{msg.quotation.details}</p>
                                                                <div className="quote-meta">
                                                                    <span>Est. Delivery: {msg.quotation.estimatedDelivery}</span>
                                                                    <span className="quote-price">${msg.quotation.amount.toFixed(2)}</span>
                                                                </div>
                                                            </div>

                                                            {msg.quotation.status === 'pending' && (
                                                                <div className="quotation-actions">
                                                                    <button
                                                                        className="btn btn-outline btn-sm"
                                                                        onClick={() => handleRejectQuotation(activeConversation.id, msg.id)}
                                                                    >
                                                                        Decline
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-primary btn-sm"
                                                                        onClick={() => handleAcceptQuotation(activeConversation.id, msg.id)}
                                                                    >
                                                                        Accept & Continue to Payment
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {msg.quotation.status === 'accepted' && (
                                                                <div className="quotation-actions">
                                                                    <button
                                                                        className="btn btn-primary btn-sm btn-full"
                                                                        onClick={() => navigate('/checkout', {
                                                                            state: {
                                                                                amount: msg.quotation.amount,
                                                                                isCustom: true,
                                                                                title: msg.quotation.title
                                                                            }
                                                                        })}
                                                                    >
                                                                        Proceed to Checkout
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form className="chat-input-area" onSubmit={handleSendMessage}>
                                <button type="button" className="btn-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </button>
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    className="chat-input"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary btn-send" disabled={!newMessage.trim()}>
                                    Send
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="chat-empty">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <h3>Your Messages</h3>
                            <p>Select a conversation to start chatting.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageCenterPage;

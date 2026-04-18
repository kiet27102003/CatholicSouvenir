import React, { useMemo, useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ user, activeView, setActiveView, onLogout, isOpen = false, onClose }) => {
    const [avatarFailed, setAvatarFailed] = useState(false);
    const safeUserName = user?.name || user?.fullName || 'Artisan';
    const avatarUrl = user?.avatar || user?.avatarUrl || '';
    const initials = useMemo(() => {
        const parts = String(safeUserName).trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'AR';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
    }, [safeUserName]);

    const menuItems = [
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', badge: null },
        { id: 'commissions', icon: 'work', label: 'Commissions', badge: 3 },
        { id: 'messages', icon: 'mail', label: 'Messages', badge: 2 },
        { id: 'portfolio', icon: 'portfolio', label: 'Portfolio', badge: null },
        { id: 'templates', icon: 'templates', label: 'Mẫu thiết kế', badge: null },
        { id: 'requests', icon: 'request', label: 'Yêu cầu từ khách', badge: null },
        { id: 'customOrders', icon: 'orders', label: 'Đơn tùy chỉnh', badge: null },
        { id: 'shipments', icon: 'shipments', label: 'Vận đơn', badge: null },
        { id: 'wallet', icon: 'money', label: 'Ví của tôi', badge: null },
        { id: 'earnings', icon: 'money', label: 'Earnings', badge: null },
    ];

    return (
        <aside className={`artisan-sidebar ${isOpen ? 'open' : ''}`}>
            {onClose && <button type="button" className="sidebar-close-btn" aria-label="Đóng menu" onClick={onClose}>&times;</button>}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="logo-text">
                        <span className="logo-title">Sanctus Artifex</span>
                        <span className="logo-subtitle">Catholic Marketplace</span>
                    </div>
                </div>

            </div>

            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                        onClick={() => setActiveView(item.id)}
                        type="button"
                    >
                        <div className="nav-item-content">
                            <span className="nav-icon">{getIcon(item.icon)}</span>
                            <span className="nav-label">{item.label}</span>
                        </div>
                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    {avatarUrl && !avatarFailed ? (
                        <img src={avatarUrl} alt={safeUserName} className="user-avatar" onError={() => setAvatarFailed(true)} />
                    ) : (
                        <div className="user-avatar user-avatar-fallback" aria-hidden="true">{initials}</div>
                    )}
                    <div className="user-info">
                        <h3 className="user-name" title={safeUserName}>{safeUserName}</h3>
                        <p className="user-role">Master Woodcarver</p>
                    </div>
                    <button type="button" className="sidebar-logout" onClick={onLogout} aria-label="Đăng xuất">
                        <span className="nav-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

const getIcon = (iconName) => {
    const icons = {
        dashboard: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            </svg>
        ),
        work: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7L9 19L3.5 13.5L4.91 12.09L9 16.17L19.59 5.59L21 7Z" fill="currentColor" />
                <path d="M8 3V7M16 3V7M3 11H21M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        mail: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8L10.89 13.26C11.5417 13.6761 12.4583 13.6761 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        portfolio: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        templates: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        money: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M14.5 8.5C14.5 7.67157 13.8284 7 13 7H11C10.1716 7 9.5 7.67157 9.5 8.5C9.5 9.32843 10.1716 10 11 10H13C13.8284 10 14.5 10.6716 14.5 11.5C14.5 12.3284 13.8284 13 13 13H11C10.1716 13 9.5 12.3284 9.5 11.5M12 7V5M12 15V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        request: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V15C20 16.1046 19.1046 17 18 17H9L4 21V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        orders: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7L12 3L21 7L12 11L3 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 12L12 16L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 17L12 21L21 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        shipments: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7h13v10H3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M16 10h3l2 3v4h-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <circle cx="7.5" cy="18" r="1.5" fill="currentColor" />
                <circle cx="18.5" cy="18" r="1.5" fill="currentColor" />
            </svg>
        ),
    };
    return icons[iconName] || null;
};

export default Sidebar;

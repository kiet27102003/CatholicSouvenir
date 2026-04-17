import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiSearch, FiMenu, FiX, FiGlobe, FiBell, FiShoppingCart, FiUser, FiLogOut, FiPackage, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { getMyConversations } from '../../services/chatService';
import { getNotifications } from '../../services/notificationService';
import './Header.css';

const Header = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { cartItemsCount, openCart } = useCart();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [langMenuOpen, setLangMenuOpen] = React.useState(false);
    const [notificationsOpen, setNotificationsOpen] = React.useState(false);
    const [unreadConversations, setUnreadConversations] = React.useState(0);
    const [notifications, setNotifications] = React.useState([]);
    const [notificationsLoading, setNotificationsLoading] = React.useState(false);
    const [notificationsError, setNotificationsError] = React.useState('');

    React.useEffect(() => {
        let ignore = false;
        const loadUnread = async () => {
            const res = await getMyConversations();
            if (ignore || !res.success) return;
            const total = (res.data || []).reduce((acc, item) => acc + Number(item?.unreadCount || 0), 0);
            setUnreadConversations(total);
        };
        if (isAuthenticated) loadUnread();
        return () => {
            ignore = true;
        };
    }, [isAuthenticated]);

    React.useEffect(() => {
        if (!notificationsOpen || !isAuthenticated) return;

        let ignore = false;
        const loadNotifications = async () => {
            setNotificationsLoading(true);
            setNotificationsError('');
            const response = await getNotifications({ page: 0, size: 20 });

            if (ignore) return;

            if (response.success) {
                setNotifications(response.data?.content || []);
            } else {
                setNotifications([]);
                setNotificationsError(response.error || 'Không tải được thông báo.');
            }
            setNotificationsLoading(false);
        };

        loadNotifications();

        return () => {
            ignore = true;
        };
    }, [notificationsOpen, isAuthenticated]);

    const handleAuthAction = () => {
        if (isAuthenticated) {
            logout();
        } else {
            navigate('/login');
        }
    };

    const handleOpenCart = () => {
        openCart();
    };

    const formatNotificationTime = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('vi-VN', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    };

    const handleNotificationClick = (item) => {
        setNotificationsOpen(false);

        const actionType = String(item?.actionType || '').toUpperCase();
        const relatedEntityType = String(item?.relatedEntityType || '').toUpperCase();
        const relatedEntityId = item?.relatedEntityId;

        if (actionType === 'VIEW_CONVERSATION' && relatedEntityId) {
            navigate(`/messages?conversationId=${relatedEntityId}`);
            return;
        }

        if (actionType === 'VIEW_ORDER' && relatedEntityId) {
            navigate(`/orders/${relatedEntityId}`);
            return;
        }

        if (actionType === 'VIEW_CUSTOM_REQUEST' && relatedEntityId) {
            navigate(`/custom-requests/${relatedEntityId}`);
            return;
        }

        if (actionType === 'VIEW_PRODUCT' && relatedEntityId) {
            navigate(`/product/${relatedEntityId}`);
            return;
        }

        if (relatedEntityType === 'CONVERSATION' && relatedEntityId) {
            navigate(`/messages?conversationId=${relatedEntityId}`);
            return;
        }

        if (relatedEntityType === 'ORDER' && relatedEntityId) {
            navigate(`/orders/${relatedEntityId}`);
            return;
        }

        if (relatedEntityType === 'CUSTOM_REQUEST' && relatedEntityId) {
            navigate(`/custom-requests/${relatedEntityId}`);
        }
    };

    return (
        <header className="header">
            {mobileMenuOpen && (
                <div
                    className="mobile-nav-overlay"
                    onClick={() => setMobileMenuOpen(false)}
                    role="button"
                    tabIndex={0}
                    aria-label={t('common.closeMenu')}
                    onKeyDown={(e) => e.key === 'Escape' && setMobileMenuOpen(false)}
                />
            )}
            <div className="container">
                <div className="header-content">
                    <div className="header-left-mobile">
                        <button
                            type="button"
                            className="hamburger-btn"
                            aria-label="Menu"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                        </button>
                        <div className="header-logo" onClick={() => navigate('/')}>
                            <svg className="logo-icon-svg" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2L26 14L14 26L2 14L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M16 4L26 14L16 24L6 14L16 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18 6L26 14L18 22L10 14L18 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="logo-copy">
                                <span className="logo-brand">Sanctus</span>
                                <span className="logo-name">Artifex</span>
                                <span className="logo-tagline">Thủ công</span>
                                <span className="logo-tagline">truyền thống</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
                        <div className="nav-links">
                            <Link to="/shop" className="nav-link" onClick={() => setMobileMenuOpen(false)}>SẢN PHẨM</Link>
                            <Link to="/artisans" className="nav-link" onClick={() => setMobileMenuOpen(false)}>NGHỆ NHÂN</Link>
                            <Link to="/custom-requests" className="nav-link" onClick={() => setMobileMenuOpen(false)}>ĐẶT LÀM RIÊNG</Link>
                            <a href="#about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>VỀ CHÚNG TÔI</a>
                        </div>
                    </nav>

                    {/* Search and Actions */}
                    <div className="header-actions">
                        <button type="button" className="icon-btn" aria-label={t('common.searchPlaceholder')} onClick={() => navigate('/shop')}>
                            <FiSearch size={20} strokeWidth={2} />
                        </button>

                        <div className="lang-dropdown-wrapper header-lang-desktop">
                            <button
                                type="button"
                                className="lang-dropdown-trigger icon-only"
                                aria-label={language === 'vi' ? 'Tiếng Việt' : 'English'}
                                aria-expanded={langMenuOpen}
                                aria-haspopup="listbox"
                                onClick={() => setLangMenuOpen(!langMenuOpen)}
                            >
                                <FiGlobe size={20} strokeWidth={2} />
                            </button>
                            {langMenuOpen && (
                                <>
                                    <div className="lang-dropdown-overlay" onClick={() => setLangMenuOpen(false)} aria-hidden="true" />
                                    <div className="lang-dropdown-menu" role="listbox">
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={language === 'vi'}
                                            className={`lang-dropdown-option ${language === 'vi' ? 'active' : ''}`}
                                            onClick={() => { setLanguage('vi'); setLangMenuOpen(false); }}
                                        >
                                            Tiếng Việt
                                        </button>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={language === 'en'}
                                            className={`lang-dropdown-option ${language === 'en' ? 'active' : ''}`}
                                            onClick={() => { setLanguage('en'); setLangMenuOpen(false); }}
                                        >
                                            English
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>


                        <div className="notifications-dropdown-wrapper">
                            <button
                                type="button"
                                className="icon-btn"
                                aria-label="Notifications"
                                aria-haspopup="dialog"
                                aria-expanded={notificationsOpen}
                                onClick={() => setNotificationsOpen((prev) => !prev)}
                            >
                                <FiBell size={20} strokeWidth={2} />
                            </button>
                            {notificationsOpen && (
                                <>
                                    <div className="notifications-dropdown-overlay" onClick={() => setNotificationsOpen(false)} aria-hidden="true" />
                                    <div className="notifications-dropdown" role="dialog" aria-label="Danh sách thông báo">
                                        <div className="notifications-dropdown-header">
                                            <div>
                                                <p className="notifications-dropdown-title">Thông báo</p>
                                                <p className="notifications-dropdown-subtitle">Các cập nhật mới nhất của bạn</p>
                                            </div>
                                            <button type="button" className="notifications-dropdown-close" onClick={() => setNotificationsOpen(false)} aria-label="Đóng thông báo">
                                                <FiX size={18} strokeWidth={2} />
                                            </button>
                                        </div>
                                        <div className="notifications-dropdown-body">
                                            {notificationsLoading && <p className="notifications-state">Đang tải thông báo...</p>}
                                            {!notificationsLoading && notificationsError && <p className="notifications-state notifications-state-error">{notificationsError}</p>}
                                            {!notificationsLoading && !notificationsError && notifications.length === 0 && <p className="notifications-state">Chưa có thông báo nào.</p>}
                                            {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                                                <div className="notifications-list">
                                                    {notifications.map((item) => (
                                                        <button
                                                            key={item.notificationId}
                                                            type="button"
                                                            className={`notification-item ${item.isRead ? 'read' : 'unread'}`}
                                                            onClick={() => handleNotificationClick(item)}
                                                        >
                                                            <div className="notification-item-header">
                                                                <strong>{item.title}</strong>
                                                                <span>{formatNotificationTime(item.createdAt)}</span>
                                                            </div>
                                                            <p>{item.message}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button className="icon-btn" aria-label="Messages" onClick={() => navigate('/messages')} style={{ position: 'relative' }}>
                            <FiMessageSquare size={20} strokeWidth={2} />
                            {unreadConversations > 0 && (
                                <span className="cart-badge">{unreadConversations}</span>
                            )}
                        </button>

                        <button className="icon-btn" aria-label="Shopping cart" onClick={handleOpenCart} style={{ position: 'relative' }}>
                            <FiShoppingCart size={20} strokeWidth={2} />
                            {cartItemsCount > 0 && (
                                <span className="cart-badge">{cartItemsCount}</span>
                            )}
                        </button>

                        {/* User Profile or Login Button */}
                        {isAuthenticated ? (
                            <div className="user-profile">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="user-avatar" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="user-dropdown">
                                    <div className="user-info">
                                        <p className="user-name">{user.name || user.email}</p>
                                        <p className="user-role">{user.role}</p>
                                    </div>
                                    <div className="dropdown-divider"></div>

                                    {user.role === 'customer' && (
                                        <>
                                            <button onClick={() => navigate('/profile')} className="dropdown-item">
                                                <FiUser size={16} strokeWidth={2} />
                                                {t('common.myProfile')}
                                            </button>
                                            <button onClick={() => navigate('/orders')} className="dropdown-item">
                                                <FiShoppingCart size={16} strokeWidth={2} />
                                                {t('common.myOrders')}
                                            </button>
                                        </>
                                    )}

                                    {user.role === 'artisan' && (
                                        <button onClick={() => navigate('/artisan')} className="dropdown-item">
                                            <FiPackage size={16} strokeWidth={2} />
                                            {t('common.dashboard')}
                                        </button>
                                    )}

                                    <div className="dropdown-divider"></div>
                                    <button onClick={handleAuthAction} className="dropdown-item dropdown-logout">
                                        <FiLogOut size={16} strokeWidth={2} />
                                        {t('common.logout')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={handleAuthAction} className="btn header-login-btn header-login-btn-red">
                                {t('common.login')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

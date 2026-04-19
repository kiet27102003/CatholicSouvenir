import React from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    FiSearch,
    FiMenu,
    FiX,
    FiBell,
    FiShoppingCart,
    FiUser,
    FiLogOut,
    FiChevronDown,
    FiMessageSquare,
    FiStar,
} from 'react-icons/fi';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { getMyConversations } from '../../services/chatService';
import { getNotifications, getUnreadNotificationCount } from '../../services/notificationService';
import './Header.css';

const Header = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { cartItemsCount, openCart } = useCart();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [notificationsOpen, setNotificationsOpen] = React.useState(false);
    const [unreadConversations, setUnreadConversations] = React.useState(0);
    const [unreadNotifications, setUnreadNotifications] = React.useState(0);
    const [notifications, setNotifications] = React.useState([]);
    const [notificationsLoading, setNotificationsLoading] = React.useState(false);
    const [notificationsError, setNotificationsError] = React.useState('');
    const [userMenuOpen, setUserMenuOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);

    React.useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        handler();
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

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
        let ignore = false;
        const loadUnreadNotifications = async () => {
            if (!isAuthenticated) {
                setUnreadNotifications(0);
                return;
            }
            const res = await getUnreadNotificationCount();
            if (!ignore && res.success) setUnreadNotifications(Number(res.data) || 0);
        };
        loadUnreadNotifications();
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

    React.useEffect(() => {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
        setNotificationsOpen(false);
    }, [location.pathname]);

    const handleAuthAction = () => {
        if (isAuthenticated) {
            logout();
        } else {
            navigate('/login');
        }
    };

    const handleOpenCart = () => openCart();

    const formatNotificationTime = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    };

    const handleNotificationClick = (item) => {
        setNotificationsOpen(false);

        const actionType = String(item?.actionType || '').toUpperCase();
        const relatedEntityType = String(item?.relatedEntityType || '').toUpperCase();
        const relatedEntityId = item?.relatedEntityId;

        if (actionType === 'VIEW_CONVERSATION' && relatedEntityId) return navigate(`/messages?conversationId=${relatedEntityId}`);
        if (actionType === 'VIEW_ORDER' && relatedEntityId) return navigate(`/orders/${relatedEntityId}`);
        if (actionType === 'VIEW_CUSTOM_REQUEST' && relatedEntityId) return navigate(`/custom-requests/${relatedEntityId}`);
        if (actionType === 'VIEW_PRODUCT' && relatedEntityId) return navigate(`/product/${relatedEntityId}`);
        if (relatedEntityType === 'CONVERSATION' && relatedEntityId) return navigate(`/messages?conversationId=${relatedEntityId}`);
        if (relatedEntityType === 'ORDER' && relatedEntityId) return navigate(`/orders/${relatedEntityId}`);
        if (relatedEntityType === 'CUSTOM_REQUEST' && relatedEntityId) return navigate(`/custom-requests/${relatedEntityId}`);
    };

    const navItems = [
        { to: '/shop', label: 'Sản phẩm' },
        { to: '/artisans', label: 'Nghệ nhân' },
        { to: '/custom-order', label: 'Đặt làm riêng' },
        { to: '/templates', label: 'Cá nhân hóa' },
        { to: '/about', label: 'Về chúng tôi' },
    ];

    const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
    const userName = user?.name || user?.email || 'Người dùng';

    const badgeText = (count) => (count > 99 ? '99+' : String(count));

    return (
        <header className={`header navbar ${scrolled ? 'is-scrolled' : ''}`}>
            {mobileMenuOpen && <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />}
            <div className="header-shell">
                <div className="header-left-mobile">
                    <button
                        type="button"
                        className="hamburger-btn"
                        aria-label="Menu"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                    >
                        {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>

                    <Link to="/" className="header-logo" aria-label="Sanctus home">
                        <img src={logo} alt="Sanctus" className="logo-image header-logo-image" />
                    </Link>
                </div>

                <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`} aria-label="Main navigation">
                    <div className="nav-links">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                <div className="nav-actions">
                    <button type="button" className="icon-btn" aria-label={t('common.searchPlaceholder')} onClick={() => navigate('/shop')}>
                        <FiSearch size={18} strokeWidth={2} />
                    </button>

                    <div className="notifications-dropdown-wrapper">
                        <button
                            type="button"
                            className="icon-btn"
                            aria-label="Notifications"
                            aria-haspopup="dialog"
                            aria-expanded={notificationsOpen}
                            onClick={() => setNotificationsOpen((prev) => !prev)}
                        >
                            <FiBell size={18} strokeWidth={2} />
                            {unreadNotifications > 0 && <span className="badge">{badgeText(unreadNotifications)}</span>}
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
                                                    <button key={item.notificationId} type="button" className={`notification-item ${item.isRead ? 'read' : 'unread'}`} onClick={() => handleNotificationClick(item)}>
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

                    <button type="button" className="icon-btn" aria-label="Messages" onClick={() => navigate('/messages')}>
                        <FiMessageSquare size={18} strokeWidth={2} />
                        {unreadConversations > 0 && <span className="badge">{badgeText(unreadConversations)}</span>}
                    </button>

                    <button type="button" className="icon-btn" aria-label="Shopping cart" onClick={handleOpenCart}>
                        <FiShoppingCart size={18} strokeWidth={2} />
                        {cartItemsCount > 0 && <span className="badge">{badgeText(cartItemsCount)}</span>}
                    </button>

                    <div className="header-divider" aria-hidden="true" />

                    {isAuthenticated ? (
                        <div className="user-menu-wrapper">
                            <button type="button" className="user-pill" onClick={() => setUserMenuOpen((prev) => !prev)} aria-haspopup="menu" aria-expanded={userMenuOpen}>
                                {user.avatar ? (
                                    <img src={user.avatar} alt={userName} className="user-avatar" />
                                ) : (
                                    <span className="user-avatar user-avatar-fallback">{userInitial}</span>
                                )}
                                <span className="user-pill-name">{userName}</span>
                                <FiChevronDown size={12} />
                            </button>

                            {userMenuOpen && (
                                <>
                                    <div className="user-menu-overlay" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                                    <div className="user-dropdown" role="menu" aria-label="Tài khoản">
                                        <button type="button" className="dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}>
                                            <FiUser size={16} strokeWidth={2} />
                                            Hồ sơ cá nhân
                                        </button>
                                        {user?.role !== 'artisan' && (
                                            <>
                                                <button type="button" className="dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/orders'); }}>
                                                    <FiShoppingCart size={16} strokeWidth={2} />
                                                    Đơn hàng của tôi
                                                </button>
                                                <button type="button" className="dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/wallet'); }}>
                                                    <FiMessageSquare size={16} strokeWidth={2} />
                                                    Ví của tôi
                                                </button>
                                            </>
                                        )}
                                        {user?.role === 'artisan' && (
                                            <button type="button" className="dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/artisan'); }}>
                                                <FiStar size={16} strokeWidth={2} />
                                                Dashboard Artisan
                                            </button>
                                        )}
                                        <div className="dropdown-divider" />
                                        <button type="button" className="dropdown-item dropdown-logout" onClick={() => { setUserMenuOpen(false); handleAuthAction(); }}>
                                            <FiLogOut size={16} strokeWidth={2} />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="auth-actions">
                            <button type="button" className="btn btn-outline header-auth-btn" onClick={() => navigate('/login')}>Đăng nhập</button>
                            <button type="button" className="btn header-auth-btn header-auth-btn-solid" onClick={() => navigate('/register')}>Đăng ký</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

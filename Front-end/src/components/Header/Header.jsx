import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiSearch, FiMenu, FiX, FiGlobe, FiSun, FiMoon, FiBell, FiShoppingCart, FiUser, FiLogOut, FiPackage } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';

const Header = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { cartItemsCount, toggleCart } = useCart();
    const { language, setLanguage, t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [langMenuOpen, setLangMenuOpen] = React.useState(false);

    const handleAuthAction = () => {
        if (isAuthenticated) {
            logout();
        } else {
            navigate('/login');
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
                            <span className="logo-text">Sanctus</span>
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

                        <button
                            type="button"
                            className="icon-btn"
                            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            onClick={toggleTheme}
                        >
                            {theme === 'dark' ? <FiSun size={20} strokeWidth={2} /> : <FiMoon size={20} strokeWidth={2} />}
                        </button>

                        <button className="icon-btn" aria-label="Notifications" onClick={() => navigate('/notifications')}>
                            <FiBell size={20} strokeWidth={2} />
                        </button>

                        <button className="icon-btn" aria-label="Shopping cart" onClick={toggleCart} style={{ position: 'relative' }}>
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

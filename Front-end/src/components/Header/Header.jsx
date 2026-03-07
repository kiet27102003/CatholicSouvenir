import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
                            {mobileMenuOpen ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                            )}
                        </button>
                        <div className="header-logo" onClick={() => navigate('/')}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="logo-text">Sanctus</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
                        <div className="nav-links">
                            <Link to="/shop" className="nav-link" onClick={() => setMobileMenuOpen(false)}>{t('common.shop')}</Link>
                            <a href="#artisans" className="nav-link" onClick={() => setMobileMenuOpen(false)}>{t('common.artisans')}</a>
                            <a href="#about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>{t('common.about')}</a>
                            <a href="#blog" className="nav-link" onClick={() => setMobileMenuOpen(false)}>{t('common.blog')}</a>
                        </div>
                        <div className="nav-right">
                            <span className="nav-separator" aria-hidden="true">|</span>
                            <button
                                type="button"
                                className="nav-link nav-link-btn"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    if (user?.role === 'artisan') {
                                        navigate('/artisan');
                                    } else {
                                        navigate('/artisan-centre');
                                    }
                                }}
                            >
                                {t('common.artisanCentre')}
                            </button>
                        </div>
                    </nav>

                    {/* Search and Actions */}
                    <div className="header-actions">
                        <div className="search-bar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <input
                                type="text"
                                placeholder={t('common.searchPlaceholder')}
                                className="search-input"
                            />
                        </div>

                        <div className="lang-dropdown-wrapper">
                            <button
                                type="button"
                                className="lang-dropdown-trigger icon-only"
                                aria-label={language === 'vi' ? 'Tiếng Việt' : 'English'}
                                aria-expanded={langMenuOpen}
                                aria-haspopup="listbox"
                                onClick={() => setLangMenuOpen(!langMenuOpen)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round" />
                                </svg>
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
                            {theme === 'dark' ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>

                        <button className="icon-btn" aria-label="Notifications" onClick={() => navigate('/notifications')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        <button className="icon-btn" aria-label="Shopping cart" onClick={toggleCart} style={{ position: 'relative' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="2" />
                                <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="2" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
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
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                                {t('common.myProfile')}
                                            </button>
                                            <button onClick={() => navigate('/orders')} className="dropdown-item">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="9" cy="21" r="1"></circle>
                                                    <circle cx="20" cy="21" r="1"></circle>
                                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                                </svg>
                                                {t('common.myOrders')}
                                            </button>
                                        </>
                                    )}

                                    {user.role === 'artisan' && (
                                        <button onClick={() => navigate('/artisan')} className="dropdown-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                                <line x1="9" y1="21" x2="9" y2="9"></line>
                                            </svg>
                                            {t('common.dashboard')}
                                        </button>
                                    )}

                                    <div className="dropdown-divider"></div>
                                    <button onClick={handleAuthAction} className="dropdown-item dropdown-logout">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        {t('common.logout')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={handleAuthAction} className="btn btn-primary header-login-btn">
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

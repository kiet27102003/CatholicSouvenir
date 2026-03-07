import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './Footer.css';

const Footer = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Subscribe email:', email);
        setEmail('');
    };

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    {/* Sanctus Column */}
                    <div className="footer-column">
                        <div className="footer-logo">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Sanctus</span>
                        </div>
                        <p className="footer-description">
                            {t('footer.description')}
                        </p>
                        <div className="footer-social">
                            <a href="#instagram" className="social-link" aria-label="Instagram">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="18" cy="6" r="1" fill="currentColor" />
                                </svg>
                            </a>
                            <a href="#pinterest" className="social-link" aria-label="Pinterest">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 21C17 17 17 9 12 2 7 9 7 17 8 21z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </a>
                            <a href="#email" className="social-link" aria-label="Email">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                                    <path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Marketplace Column */}
                    <div className="footer-column">
                        <h4 className="footer-title">{t('footer.marketplace')}</h4>
                        <ul className="footer-links">
                            <li><a href="/shop">{t('footer.shopAll')}</a></li>
                            <li><a href="#artisans">{t('footer.featuredArtisans')}</a></li>
                            <li><a href="#new-arrivals">{t('footer.newArrivals')}</a></li>
                            <li><a href="#gift-cards">{t('footer.giftCards')}</a></li>
                        </ul>
                    </div>

                    {/* Community Column */}
                    <div className="footer-column">
                        <h4 className="footer-title">{t('footer.community')}</h4>
                        <ul className="footer-links">
                            <li><a href="#about">{t('footer.aboutUs')}</a></li>
                            <li><a href="#blog">{t('footer.artisanBlog')}</a></li>
                            <li><a href="#become">{t('footer.becomeArtisan')}</a></li>
                            <li><a href="#help">{t('footer.helpCenter')}</a></li>
                        </ul>
                    </div>

                    {/* Subscribe Column */}
                    <div className="footer-column footer-subscribe">
                        <h4 className="footer-title">{t('footer.subscribe')}</h4>
                        <p className="subscribe-description">
                            {t('footer.subscribeDescription')}
                        </p>
                        <form onSubmit={handleSubmit} className="subscribe-form">
                            <input
                                type="email"
                                placeholder={t('footer.emailPlaceholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="subscribe-input"
                                required
                            />
                            <button type="submit" className="btn btn-primary subscribe-btn">
                                {t('footer.join')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="footer-bottom">
                    <p className="footer-copyright">
                        {t('footer.copyright')}
                    </p>
                    <div className="footer-legal">
                        <a href="#privacy">{t('footer.privacy')}</a>
                        <span className="separator">·</span>
                        <a href="#terms">{t('footer.terms')}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

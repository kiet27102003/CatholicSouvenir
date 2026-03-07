import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './Hero.css';

const Hero = () => {
    const { t } = useLanguage();
    return (
        <section className="hero">
            <div className="hero-overlay"></div>
            <div className="container">
                <div className="hero-content">
                    <h1 className="hero-title">
                        {t('home.heroTitle')}
                    </h1>
                    <p className="hero-description">
                        {t('home.heroSubtitle')}
                    </p>
                    <button className="btn btn-primary hero-cta">
                        {t('home.heroCta')}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Hero;

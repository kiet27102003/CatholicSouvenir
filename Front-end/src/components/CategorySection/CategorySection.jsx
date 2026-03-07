import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import CategoryCard from './CategoryCard';
import './CategorySection.css';

const CategorySection = () => {
    const { t } = useLanguage();
    const categories = [
        { id: 1, image: '/src/assets/statue.png', titleKey: 'home.categoryStatues', subtitleKey: 'home.categoryStatuesSub' },
        { id: 2, image: '/src/assets/rosary.png', titleKey: 'home.categoryRosaries', subtitleKey: 'home.categoryRosariesSub' },
        { id: 3, image: '/src/assets/cross.png', titleKey: 'home.categoryCrosses', subtitleKey: 'home.categoryCrossesSub' },
        { id: 4, image: '/src/assets/textile.png', titleKey: 'home.categoryTextiles', subtitleKey: 'home.categoryTextilesSub' }
    ];

    return (
        <section className="category-section section">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">{t('home.browseByCategory')}</h2>
                    <a href="#all-categories" className="view-all-link">
                        {t('home.viewAll')}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </a>
                </div>

                <div className="category-grid">
                    {categories.map(category => (
                        <CategoryCard
                            key={category.id}
                            image={category.image}
                            title={t(category.titleKey)}
                            subtitle={t(category.subtitleKey)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategorySection;

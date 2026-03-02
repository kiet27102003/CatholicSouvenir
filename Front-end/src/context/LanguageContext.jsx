import React, { createContext, useState, useContext, useEffect } from 'react';
import viTranslations from '../locales/vi.json';
import enTranslations from '../locales/en.json';

const STORAGE_KEY = 'sanctus_language';

const LanguageContext = createContext(null);

const translations = {
    vi: viTranslations,
    en: enTranslations,
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem(STORAGE_KEY) || 'vi';
    });

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && (stored === 'vi' || stored === 'en')) {
            setLanguage(stored);
        }
    }, []);

    const setLang = (lang) => {
        if (lang === 'vi' || lang === 'en') {
            setLanguage(lang);
            localStorage.setItem(STORAGE_KEY, lang);
        }
    };

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];
        for (const k of keys) {
            value = value?.[k];
        }
        return value ?? key;
    };

    const value = {
        language,
        setLanguage: setLang,
        t,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;

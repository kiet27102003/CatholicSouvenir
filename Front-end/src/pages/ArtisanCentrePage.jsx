import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import authService from '../services/authService';
import { appToast } from '../lib/appToast';
import './ArtisanCentrePage.css';

const ArtisanCentrePage = () => {
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const REGISTER_STEPS = [
        { id: 1, title: t('artisanCentre.step1Title'), short: t('artisanCentre.step1Short') },
        { id: 2, title: t('artisanCentre.step2Title'), short: t('artisanCentre.step2Short') },
        { id: 3, title: t('artisanCentre.step3Title'), short: t('artisanCentre.step3Short') },
    ];

    const GENDER_OPTIONS = [
        { value: '', label: t('artisanCentre.genderSelect') },
        { value: 'MALE', label: t('artisanCentre.genderMale') },
        { value: 'FEMALE', label: t('artisanCentre.genderFemale') },
        { value: 'OTHER', label: t('artisanCentre.genderOther') },
    ];

    // Register form (unauthenticated)
    const [regStep, setRegStep] = useState(1);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [artisanName, setArtisanName] = useState('');
    const [bio, setBio] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [experienceYear, setExperienceYear] = useState('');
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Apply form (authenticated)
    const [artisanNameApply, setArtisanNameApply] = useState('');
    const [bioApply, setBioApply] = useState('');
    const [specializationApply, setSpecializationApply] = useState('');
    const [experienceYearApply, setExperienceYearApply] = useState('');
    const [portfolioUrlApply, setPortfolioUrlApply] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (user?.role === 'artisan') {
            navigate('/artisan', { replace: true });
        }
    }, [user?.role, navigate]);

    // Validation for register form
    const validateRegStep1 = () => {
        if (!firstName.trim()) {
            appToast.warning('Thiếu thông tin', t('artisanCentre.errors.firstNameRequired'));
            return false;
        }
        if (!lastName.trim()) {
            appToast.warning('Thiếu thông tin', t('artisanCentre.errors.lastNameRequired'));
            return false;
        }
        return true;
    };

    const validateRegStep2 = () => {
        if (!email.trim()) {
            appToast.warning('Thiếu thông tin', t('artisanCentre.errors.emailRequired'));
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            appToast.warning('Thiếu thông tin', t('artisanCentre.errors.emailInvalid'));
            return false;
        }
        return true;
    };

    const validateRegStep3 = () => {
        if (password.length < 6) {
            appToast.warning('Thiếu thông tin', t('artisanCentre.errors.passwordMin'));
            return false;
        }
        if (password !== confirmPassword) {
            appToast.warning('Thiếu thông tin', t('artisanCentre.errors.passwordMismatch'));
            return false;
        }
        const expYear = experienceYear === '' ? undefined : parseInt(experienceYear, 10);
        if (experienceYear !== '' && (isNaN(expYear) || expYear < 0)) {
            appToast.warning('Thiếu thông tin', t('artisanCentre.errors.experienceInvalid'));
            return false;
        }
        return true;
    };

    const goNextReg = (e) => {
        e.preventDefault();
        if (regStep === 1 && !validateRegStep1()) return;
        if (regStep === 2 && !validateRegStep2()) return;
        setRegStep((s) => Math.min(s + 1, REGISTER_STEPS.length));
    };

    const goBackReg = () => {
        setRegStep((s) => Math.max(s - 1, 1));
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!validateRegStep3()) return;

        const expYear = experienceYear === '' ? undefined : parseInt(experienceYear, 10);
        setLoading(true);
        try {
            const result = await authService.registerArtisan({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                confirmPassword,
                phoneNumber: phoneNumber.trim() || undefined,
                gender: gender || undefined,
                dateOfBirth: dateOfBirth || undefined,
                artisanName: artisanName.trim() || undefined,
                bio: bio.trim() || undefined,
                experienceYear: expYear,
                portfolioUrl: portfolioUrl.trim() || undefined,
                specialization: specialization.trim() || undefined,
            });
            if (result.success) {
                appToast.success('Tạo thành công', 'Đã tạo tài khoản nghệ nhân');
                navigate('/login', { state: { message: result.message } });
            } else {
                const msg = result.error != null ? String(result.error) : t('artisanCentre.errors.registerFailed');
                appToast.error('Có lỗi xảy ra', msg);
            }
        } catch {
            appToast.error('Có lỗi xảy ra', t('artisanCentre.errors.generic'));
        } finally {
            setLoading(false);
        }
    };

    const handleApplySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const expYear = experienceYearApply === '' ? undefined : parseInt(experienceYearApply, 10);
            if (experienceYearApply !== '' && (isNaN(expYear) || expYear < 0)) {
                appToast.warning('Thiếu thông tin', t('artisanCentre.errors.experienceInvalid'));
                setLoading(false);
                return;
            }
            const result = await authService.applyArtisan({
                artisanName: artisanNameApply.trim() || undefined,
                bio: bioApply.trim() || undefined,
                specialization: specializationApply.trim() || undefined,
                experienceYear: expYear,
                portfolioUrl: portfolioUrlApply.trim() || undefined,
            });
            if (result.success) {
                appToast.success('Tạo thành công', 'Đơn đăng ký đã được gửi');
                setSubmitted(true);
            } else {
                const msg = result.error != null ? String(result.error) : t('artisanCentre.errors.applyFailed');
                appToast.error('Có lỗi xảy ra', msg);
            }
        } catch {
            appToast.error('Có lỗi xảy ra', t('artisanCentre.errors.generic'));
        } finally {
            setLoading(false);
        }
    };

    if (user?.role === 'artisan') {
        return null;
    }

    return (
        <div className="artisan-centre-page">
            <Header />
            <main className="artisan-centre-main">
                <div className="artisan-centre-hero">
                    <div className="container">
                        <h1>{t('artisanCentre.heroTitle')}</h1>
                        <p>{t('artisanCentre.heroSubtitle')}</p>
                    </div>
                </div>

                <div className="container artisan-centre-content">
                    {!isAuthenticated ? (
                        <div className="artisan-centre-form-section artisan-register-form-section">
                            <div className="form-section-header">
                                <h2>{t('artisanCentre.registerTitle')}</h2>
                                <p>{t('artisanCentre.registerSubtitle')}</p>
                            </div>

                            <div className="artisan-register-steps" role="tablist" aria-label={t('artisanCentre.registerStepsLabel')}>
                                {REGISTER_STEPS.map((s, i) => (
                                    <div
                                        key={s.id}
                                        className={`register-step-dot ${regStep >= s.id ? 'active' : ''} ${regStep === s.id ? 'current' : ''}`}
                                        title={s.title}
                                    >
                                        <span className="register-step-num">{s.id}</span>
                                        {i < REGISTER_STEPS.length - 1 && <span className="register-step-line" />}
                                    </div>
                                ))}
                            </div>
                            <p className="register-step-title">{REGISTER_STEPS[regStep - 1].title}</p>

                            <form onSubmit={regStep === 3 ? handleRegisterSubmit : goNextReg} className="artisan-apply-form artisan-register-form">
                                {regStep === 1 && (
                                    <div className="register-step-panel">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="ac-firstName" className="form-label">{t('artisanCentre.firstName')} <span className="required">{t('artisanCentre.required')}</span></label>
                                                <input
                                                    type="text"
                                                    id="ac-firstName"
                                                    className="form-input"
                                                    placeholder={t('artisanCentre.firstNamePlaceholder')}
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    autoComplete="given-name"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="ac-lastName" className="form-label">{t('artisanCentre.lastName')} <span className="required">{t('artisanCentre.required')}</span></label>
                                                <input
                                                    type="text"
                                                    id="ac-lastName"
                                                    className="form-input"
                                                    placeholder={t('artisanCentre.lastNamePlaceholder')}
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    autoComplete="family-name"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="ac-artisanName" className="form-label">{t('artisanCentre.artisanName')}</label>
                                            <input
                                                type="text"
                                                id="ac-artisanName"
                                                className="form-input"
                                                placeholder={t('artisanCentre.artisanNamePlaceholder2')}
                                                value={artisanName}
                                                onChange={(e) => setArtisanName(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="ac-gender" className="form-label">{t('artisanCentre.gender')}</label>
                                                <select
                                                    id="ac-gender"
                                                    className="form-input form-select"
                                                    value={gender}
                                                    onChange={(e) => setGender(e.target.value)}
                                                >
                                                    {GENDER_OPTIONS.map((opt) => (
                                                        <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="ac-dateOfBirth" className="form-label">{t('artisanCentre.dateOfBirth')}</label>
                                                <input
                                                    type="date"
                                                    id="ac-dateOfBirth"
                                                    className="form-input"
                                                    value={dateOfBirth}
                                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                                    autoComplete="bday"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {regStep === 2 && (
                                    <div className="register-step-panel">
                                        <div className="form-group">
                                            <label htmlFor="ac-email" className="form-label">{t('artisanCentre.email')} <span className="required">{t('artisanCentre.required')}</span></label>
                                            <input
                                                type="email"
                                                id="ac-email"
                                                className="form-input"
                                                placeholder="email@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                autoComplete="email"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="ac-phoneNumber" className="form-label">{t('artisanCentre.phoneNumber')}</label>
                                            <input
                                                type="tel"
                                                id="ac-phoneNumber"
                                                className="form-input"
                                                placeholder={t('artisanCentre.phonePlaceholder')}
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                autoComplete="tel"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="ac-specialization" className="form-label">{t('artisanCentre.specialization')}</label>
                                            <input
                                                type="text"
                                                id="ac-specialization"
                                                className="form-input"
                                                placeholder={t('artisanCentre.specializationPlaceholder')}
                                                value={specialization}
                                                onChange={(e) => setSpecialization(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="ac-experienceYear" className="form-label">{t('artisanCentre.experienceYear')}</label>
                                                <input
                                                    type="number"
                                                    id="ac-experienceYear"
                                                    className="form-input"
                                                    placeholder="0"
                                                    min={0}
                                                    value={experienceYear}
                                                    onChange={(e) => setExperienceYear(e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="ac-portfolioUrl" className="form-label">{t('artisanCentre.portfolioUrl')}</label>
                                                <input
                                                    type="url"
                                                    id="ac-portfolioUrl"
                                                    className="form-input"
                                                    placeholder={t('artisanCentre.portfolioPlaceholder')}
                                                    value={portfolioUrl}
                                                    onChange={(e) => setPortfolioUrl(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="ac-bio" className="form-label">{t('artisanCentre.bio')}</label>
                                            <textarea
                                                id="ac-bio"
                                                className="form-input form-textarea"
                                                placeholder={t('artisanCentre.bioPlaceholder')}
                                                rows={3}
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {regStep === 3 && (
                                    <div className="register-step-panel">
                                        <div className="form-group">
                                            <label htmlFor="ac-password" className="form-label">{t('artisanCentre.password')} <span className="required">{t('artisanCentre.required')}</span></label>
                                            <div className="password-input-container">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="ac-password"
                                                    className="form-input"
                                                    placeholder={t('artisanCentre.passwordPlaceholder')}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    minLength={6}
                                                    autoComplete="new-password"
                                                />
                                                <button
                                                    type="button"
                                                    className="password-toggle-btn"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    aria-label={showPassword ? t('artisanCentre.hidePassword') : t('artisanCentre.showPassword')}
                                                >
                                                    {showPassword ? (
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                                    ) : (
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                            <span className="form-hint">{t('artisanCentre.requiredHint')}</span>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="ac-confirmPassword" className="form-label">{t('artisanCentre.confirmPassword')} <span className="required">{t('artisanCentre.required')}</span></label>
                                            <div className="password-input-container">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="ac-confirmPassword"
                                                    className="form-input"
                                                    placeholder={t('artisanCentre.confirmPasswordPlaceholder')}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    minLength={6}
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="register-form-actions">
                                    {regStep > 1 && (
                                        <button type="button" className="btn btn-secondary register-btn-back" onClick={goBackReg}>
                                            {t('artisanCentre.back')}
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {regStep === 3 ? (loading ? t('artisanCentre.registering') : t('artisanCentre.register')) : t('artisanCentre.next')}
                                    </button>
                                </div>
                                <p className="artisan-register-login-prompt">
                                    {t('artisanCentre.haveAccount')} <Link to="/login">{t('common.login')}</Link>
                                </p>
                            </form>
                        </div>
                    ) : submitted ? (
                        <div className="artisan-centre-success">
                            <div className="success-card">
                                <div className="success-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                </div>
                                <h2>{t('artisanCentre.successTitle')}</h2>
                                <p>{t('artisanCentre.successMessage')}</p>
                                <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
                                    {t('artisanCentre.goHome')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="artisan-centre-form-section">
                            <div className="form-section-header">
                                <h2>{t('artisanCentre.applyTitle')}</h2>
                                <p>{t('artisanCentre.applySubtitle')}</p>
                            </div>
                            <form onSubmit={handleApplySubmit} className="artisan-apply-form">
                                <div className="form-group">
                                    <label htmlFor="artisanName" className="form-label">{t('artisanCentre.artisanName')}</label>
                                    <input
                                        type="text"
                                        id="artisanName"
                                        className="form-input"
                                        placeholder={t('artisanCentre.artisanNamePlaceholder3')}
                                        value={artisanNameApply}
                                        onChange={(e) => setArtisanNameApply(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="specialization" className="form-label">{t('artisanCentre.specialization')}</label>
                                    <input
                                        type="text"
                                        id="specialization"
                                        className="form-input"
                                        placeholder={t('artisanCentre.specializationPlaceholder')}
                                        value={specializationApply}
                                        onChange={(e) => setSpecializationApply(e.target.value)}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="experienceYear" className="form-label">{t('artisanCentre.experienceYear')}</label>
                                        <input
                                            type="number"
                                            id="experienceYear"
                                            className="form-input"
                                            placeholder="0"
                                            min={0}
                                            value={experienceYearApply}
                                            onChange={(e) => setExperienceYearApply(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="portfolioUrl" className="form-label">{t('artisanCentre.portfolioUrl')}</label>
                                        <input
                                            type="url"
                                            id="portfolioUrl"
                                            className="form-input"
                                            placeholder={t('artisanCentre.portfolioPlaceholder')}
                                            value={portfolioUrlApply}
                                            onChange={(e) => setPortfolioUrlApply(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="bio" className="form-label">{t('artisanCentre.bio')}</label>
                                    <textarea
                                        id="bio"
                                        className="form-input form-textarea"
                                        placeholder={t('artisanCentre.bioPlaceholder')}
                                        rows={4}
                                        value={bioApply}
                                        onChange={(e) => setBioApply(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? t('artisanCentre.submitting') : t('artisanCentre.submitApply')}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ArtisanCentrePage;

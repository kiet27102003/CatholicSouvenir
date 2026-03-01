import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import ArtisanRegisterForm from '../ArtisanRegisterForm/ArtisanRegisterForm';
import './RegisterForm.css';

const STEPS = [
    { id: 1, title: 'Thông tin cá nhân', short: 'Cá nhân' },
    { id: 2, title: 'Thông tin liên hệ', short: 'Liên hệ' },
    { id: 3, title: 'Mật khẩu', short: 'Mật khẩu' },
];

const GENDER_OPTIONS = [
    { value: '', label: 'Chọn giới tính' },
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

const RegisterForm = () => {
    const [registerType, setRegisterType] = useState('user'); // 'user' | 'artisan'

    const [step, setStep] = useState(1);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const totalSteps = STEPS.length;
    const isFirstStep = step === 1;
    const isLastStep = step === totalSteps;

    const validateStep1 = () => {
        if (!firstName.trim()) {
            setError('Vui lòng nhập họ.');
            return false;
        }
        if (!lastName.trim()) {
            setError('Vui lòng nhập tên.');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!email.trim()) {
            setError('Vui lòng nhập email.');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('Email không hợp lệ.');
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        if (password.length < 6) {
            setError('Mật khẩu cần ít nhất 6 ký tự.');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu và xác nhận mật khẩu không khớp.');
            return false;
        }
        return true;
    };

    const goNext = (e) => {
        e.preventDefault();
        setError('');
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setStep((s) => Math.min(s + 1, totalSteps));
    };

    const goBack = () => {
        setError('');
        setStep((s) => Math.max(s - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateStep3()) return;

        setLoading(true);
        try {
            const result = await authService.register({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                confirmPassword,
                phoneNumber: phoneNumber.trim(),
                gender: gender || undefined,
                dateOfBirth: dateOfBirth || undefined,
            });

            if (result.success) {
                navigate('/login', { state: { message: result.message } });
            } else {
                setError(result.error || 'Đăng ký thất bại. Vui lòng thử lại.');
            }
        } catch {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                {/* Left - Image */}
                <div className="register-image-section">
                    <div className="register-overlay" />
                    <div className="register-image-content">
                        <Link to="/" className="register-logo">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Sanctus</span>
                        </Link>
                        <div className="register-image-text">
                            <h2>
                                {registerType === 'user' ? 'Join Our Community' : 'Become an Artisan'}
                            </h2>
                            <p>
                                {registerType === 'user'
                                    ? 'Create your account and discover sacred crafts from devoted artisans.'
                                    : 'Apply to join our network of craftspeople and share your sacred art with the community.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right - Toggle + Form */}
                <div className="register-form-section">
                    <div className="register-form-wrapper">
                        <div className="register-type-toggle">
                            <button
                                type="button"
                                className={`register-type-btn ${registerType === 'user' ? 'active' : ''}`}
                                onClick={() => setRegisterType('user')}
                            >
                                Khách hàng
                            </button>
                            <button
                                type="button"
                                className={`register-type-btn ${registerType === 'artisan' ? 'active' : ''}`}
                                onClick={() => setRegisterType('artisan')}
                            >
                                Nghệ nhân
                            </button>
                        </div>

                        {registerType === 'user' ? (
                            <>
                                <div className="register-form-container">
                                    <div className="register-form-header">
                                        <h1 className="register-title">Đăng ký</h1>
                                        <p className="register-subtitle">Tạo tài khoản Sanctus của bạn</p>
                                        <div className="register-steps" role="tablist" aria-label="Các bước đăng ký">
                                            {STEPS.map((s, i) => (
                                                <div
                                                    key={s.id}
                                                    className={`register-step-dot ${step >= s.id ? 'active' : ''} ${step === s.id ? 'current' : ''}`}
                                                    title={s.title}
                                                >
                                                    <span className="register-step-num">{s.id}</span>
                                                    {i < STEPS.length - 1 && <span className="register-step-line" />}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="register-step-title">{STEPS[step - 1].title}</p>
                                    </div>

                                    <form onSubmit={isLastStep ? handleSubmit : goNext} className="register-form">
                                        {error && (
                                            <div className="error-message" role="alert">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                                {error}
                                            </div>
                                        )}

                                        {step === 1 && (
                                            <div className="register-step-panel">
                                                <div className="register-form-row">
                                                    <div className="form-group">
                                                        <label htmlFor="firstName" className="form-label">Họ <span className="required">*</span></label>
                                                        <input
                                                            type="text"
                                                            id="firstName"
                                                            className="form-input"
                                                            placeholder="Nguyễn"
                                                            value={firstName}
                                                            onChange={(e) => setFirstName(e.target.value)}
                                                            autoComplete="given-name"
                                                            aria-required="true"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label htmlFor="lastName" className="form-label">Tên <span className="required">*</span></label>
                                                        <input
                                                            type="text"
                                                            id="lastName"
                                                            className="form-input"
                                                            placeholder="Văn A"
                                                            value={lastName}
                                                            onChange={(e) => setLastName(e.target.value)}
                                                            autoComplete="family-name"
                                                            aria-required="true"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="gender" className="form-label">Giới tính</label>
                                                    <select
                                                        id="gender"
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
                                                    <label htmlFor="dateOfBirth" className="form-label">Ngày sinh</label>
                                                    <input
                                                        type="date"
                                                        id="dateOfBirth"
                                                        className="form-input"
                                                        value={dateOfBirth}
                                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                                        autoComplete="bday"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {step === 2 && (
                                            <div className="register-step-panel">
                                                <div className="form-group">
                                                    <label htmlFor="email" className="form-label">Email <span className="required">*</span></label>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        className="form-input"
                                                        placeholder="Ví dụ: email@example.com"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        autoComplete="email"
                                                        aria-required="true"
                                                    />
                                                    <span className="form-hint">Dùng để đăng nhập và nhận thông báo</span>
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="phoneNumber" className="form-label">Số điện thoại</label>
                                                    <input
                                                        type="tel"
                                                        id="phoneNumber"
                                                        className="form-input"
                                                        placeholder="Ví dụ: 0912345678"
                                                        value={phoneNumber}
                                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                                        autoComplete="tel"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {step === 3 && (
                                            <div className="register-step-panel">
                                                <div className="form-group">
                                                    <label htmlFor="password" className="form-label">Mật khẩu <span className="required">*</span></label>
                                                    <div className="password-input-container">
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            id="password"
                                                            className="form-input"
                                                            placeholder="Ít nhất 6 ký tự"
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            minLength={6}
                                                            autoComplete="new-password"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="password-toggle-btn"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                                        >
                                                            {showPassword ? (
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                                            ) : (
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                    <span className="form-hint">Tối thiểu 6 ký tự</span>
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu <span className="required">*</span></label>
                                                    <div className="password-input-container">
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            id="confirmPassword"
                                                            className="form-input"
                                                            placeholder="Nhập lại mật khẩu"
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
                                            {!isFirstStep && (
                                                <button type="button" className="btn register-btn-back" onClick={goBack}>
                                                    Quay lại
                                                </button>
                                            )}
                                            {isLastStep ? (
                                                <button type="submit" className="btn btn-primary register-btn" disabled={loading}>
                                                    {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                                                </button>
                                            ) : (
                                                <button type="submit" className="btn btn-primary register-btn">Tiếp theo</button>
                                            )}
                                        </div>

                                        <div className="register-footer">
                                            <p>Đã có tài khoản? <Link to="/login" className="login-link">Đăng nhập</Link></p>
                                        </div>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <ArtisanRegisterForm />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;

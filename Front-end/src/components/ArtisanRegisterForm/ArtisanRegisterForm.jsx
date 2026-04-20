import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import { appToast } from '../../lib/appToast';
import '../RegisterForm/RegisterForm.css';
import './ArtisanRegisterForm.css';

const STEPS = [
    { id: 1, title: 'Thông tin cá nhân', short: 'Cá nhân' },
    { id: 2, title: 'Liên hệ & Nghề nghiệp', short: 'Nghề nghiệp' },
    { id: 3, title: 'Mật khẩu', short: 'Mật khẩu' },
];

const GENDER_OPTIONS = [
    { value: '', label: 'Chọn giới tính' },
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

const ArtisanRegisterForm = () => {
    const [step, setStep] = useState(1);
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
    const [experienceYear, setExperienceYear] = useState('');
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const totalSteps = STEPS.length;
    const isFirstStep = step === 1;
    const isLastStep = step === totalSteps;

    const validateStep1 = () => {
        if (!firstName.trim()) {
            appToast.warning('Thiếu thông tin', 'Vui lòng nhập họ.');
            return false;
        }
        if (!lastName.trim()) {
            appToast.warning('Thiếu thông tin', 'Vui lòng nhập tên.');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!email.trim()) {
            appToast.warning('Thiếu thông tin', 'Vui lòng nhập email.');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            appToast.warning('Thiếu thông tin', 'Email không hợp lệ.');
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        if (password.length < 6) {
            appToast.warning('Thiếu thông tin', 'Mật khẩu cần ít nhất 6 ký tự.');
            return false;
        }
        if (password !== confirmPassword) {
            appToast.warning('Thiếu thông tin', 'Mật khẩu và xác nhận mật khẩu không khớp.');
            return false;
        }
        const expYear = experienceYear === '' ? undefined : parseInt(experienceYear, 10);
        if (experienceYear !== '' && (isNaN(expYear) || expYear < 0)) {
            appToast.warning('Thiếu thông tin', 'Số năm kinh nghiệm không hợp lệ.');
            return false;
        }
        return true;
    };

    const goNext = (e) => {
        e.preventDefault();
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setStep((s) => Math.min(s + 1, totalSteps));
    };

    const goBack = () => {
        setStep((s) => Math.max(s - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep3()) return;

        const expYear = experienceYear === '' ? undefined : parseInt(experienceYear, 10);

        setLoading(true);
        try {
            const result = await authService.registerArtisan({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                confirmPassword,
                phoneNumber: phoneNumber.trim(),
                gender: gender || undefined,
                dateOfBirth: dateOfBirth || undefined,
                artisanName: artisanName.trim() || undefined,
                bio: bio.trim() || undefined,
                experienceYear: expYear,
                portfolioUrl: portfolioUrl.trim() || undefined,
                specialization: specialization.trim() || undefined,
            });

            if (result.success) {
                appToast.success('Tạo thành công', 'Vui lòng chờ Admin duyệt đơn');
                navigate('/login', { state: { message: result.message } });
            } else {
                appToast.error('Có lỗi xảy ra', result.error || 'Đăng ký nghệ nhân thất bại. Vui lòng thử lại.');
            }
        } catch {
            appToast.error('Có lỗi xảy ra', 'Vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-form-container artisan-register-form">
            <div className="register-form-header">
                <h1 className="register-title">Đăng ký Nghệ nhân</h1>
                <p className="register-subtitle">Đăng ký trở thành nghệ nhân trên Sanctus</p>

                <div className="register-steps" role="tablist" aria-label="Các bước đăng ký nghệ nhân">
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
                {/* Bước 1: Thông tin cá nhân */}
                {step === 1 && (
                    <div className="register-step-panel">
                        <div className="register-form-row">
                            <div className="form-group">
                                <label htmlFor="artisan-firstName" className="form-label">Họ <span className="required">*</span></label>
                                <input
                                    type="text"
                                    id="artisan-firstName"
                                    className="form-input"
                                    placeholder="Nguyễn"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    autoComplete="given-name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="artisan-lastName" className="form-label">Tên <span className="required">*</span></label>
                                <input
                                    type="text"
                                    id="artisan-lastName"
                                    className="form-input"
                                    placeholder="Văn A"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    autoComplete="family-name"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="artisan-artisanName" className="form-label">Tên nghệ nhân / Xưởng</label>
                            <input
                                type="text"
                                id="artisan-artisanName"
                                className="form-input"
                                placeholder="Xưởng gỗ Đức Anh"
                                value={artisanName}
                                onChange={(e) => setArtisanName(e.target.value)}
                            />
                        </div>
                        <div className="register-form-row">
                            <div className="form-group">
                                <label htmlFor="artisan-gender" className="form-label">Giới tính</label>
                                <select
                                    id="artisan-gender"
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
                                <label htmlFor="artisan-dateOfBirth" className="form-label">Ngày sinh</label>
                                <input
                                    type="date"
                                    id="artisan-dateOfBirth"
                                    className="form-input"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    autoComplete="bday"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Bước 2: Liên hệ & Nghề nghiệp */}
                {step === 2 && (
                    <div className="register-step-panel">
                        <div className="form-group">
                            <label htmlFor="artisan-email" className="form-label">Email <span className="required">*</span></label>
                            <input
                                type="email"
                                id="artisan-email"
                                className="form-input"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />

                        </div>
                        <div className="form-group">
                            <label htmlFor="artisan-phoneNumber" className="form-label">Số điện thoại</label>
                            <input
                                type="tel"
                                id="artisan-phoneNumber"
                                className="form-input"
                                placeholder="0912345678"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                autoComplete="tel"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="artisan-specialization" className="form-label">Chuyên môn</label>
                            <input
                                type="text"
                                id="artisan-specialization"
                                className="form-input"
                                placeholder="Đồ gỗ, gốm sứ, thêu"
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                            />
                        </div>
                        <div className="register-form-row">
                            <div className="form-group">
                                <label htmlFor="artisan-experienceYear" className="form-label">Số năm kinh nghiệm</label>
                                <input
                                    type="number"
                                    id="artisan-experienceYear"
                                    className="form-input"
                                    placeholder="0"
                                    min={0}
                                    value={experienceYear}
                                    onChange={(e) => setExperienceYear(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="artisan-portfolioUrl" className="form-label">Link portfolio</label>
                                <input
                                    type="url"
                                    id="artisan-portfolioUrl"
                                    className="form-input"
                                    placeholder="https://..."
                                    value={portfolioUrl}
                                    onChange={(e) => setPortfolioUrl(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="artisan-bio" className="form-label">Giới thiệu ngắn</label>
                            <textarea
                                id="artisan-bio"
                                className="form-input form-textarea"
                                placeholder="Giới thiệu về bạn và tác phẩm..."
                                rows={3}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Bước 3: Mật khẩu */}
                {step === 3 && (
                    <div className="register-step-panel">
                        <div className="form-group">
                            <label htmlFor="artisan-password" className="form-label">Mật khẩu <span className="required">*</span></label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="artisan-password"
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
                            <label htmlFor="artisan-confirmPassword" className="form-label">Xác nhận mật khẩu <span className="required">*</span></label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="artisan-confirmPassword"
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
                            {loading ? 'Đang gửi đăng ký...' : 'Đăng ký Nghệ nhân'}
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
    );
};

export default ArtisanRegisterForm;

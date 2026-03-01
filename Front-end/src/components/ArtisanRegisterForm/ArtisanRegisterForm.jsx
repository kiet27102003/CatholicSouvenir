import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import '../RegisterForm/RegisterForm.css';
import './ArtisanRegisterForm.css';

const GENDER_OPTIONS = [
    { value: '', label: 'Chọn giới tính' },
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

const ArtisanRegisterForm = () => {
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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Mật khẩu và xác nhận mật khẩu không khớp.');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu cần ít nhất 6 ký tự.');
            return;
        }

        const expYear = experienceYear === '' ? undefined : parseInt(experienceYear, 10);
        if (experienceYear !== '' && (isNaN(expYear) || expYear < 0)) {
            setError('Số năm kinh nghiệm không hợp lệ.');
            return;
        }

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
                navigate('/login', { state: { message: result.message } });
            } else {
                setError(result.error || 'Đăng ký artisan thất bại. Vui lòng thử lại.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-form-container artisan-register-form">
            <div className="register-form-header">
                <h1 className="register-title">Đăng ký Artisan</h1>
                <p className="register-subtitle">Đăng ký trở thành nghệ nhân trên Sanctus</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
                {error && (
                    <div className="error-message">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {error}
                    </div>
                )}

                <div className="register-form-row">
                    <div className="form-group">
                        <label htmlFor="artisan-firstName" className="form-label">Họ</label>
                        <input
                            type="text"
                            id="artisan-firstName"
                            className="form-input"
                            placeholder="Nguyễn"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            autoComplete="given-name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="artisan-lastName" className="form-label">Tên</label>
                        <input
                            type="text"
                            id="artisan-lastName"
                            className="form-input"
                            placeholder="Văn A"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
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
                        placeholder="Ví dụ: Xưởng gỗ Đức Anh"
                        value={artisanName}
                        onChange={(e) => setArtisanName(e.target.value)}
                    />
                </div>

                <div className="register-form-row">
                    <div className="form-group">
                        <label htmlFor="artisan-email" className="form-label">Email</label>
                        <input
                            type="email"
                            id="artisan-email"
                            className="form-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="artisan-phoneNumber" className="form-label">SĐT</label>
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

                <div className="form-group">
                    <label htmlFor="artisan-specialization" className="form-label">Chuyên môn</label>
                    <input
                        type="text"
                        id="artisan-specialization"
                        className="form-input"
                        placeholder="Ví dụ: Đồ gỗ, gốm sứ, thêu"
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
                        rows={2}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="artisan-password" className="form-label">Mật khẩu</label>
                    <div className="password-input-container">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="artisan-password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
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
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="artisan-confirmPassword" className="form-label">Xác nhận mật khẩu</label>
                    <div className="password-input-container">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="artisan-confirmPassword"
                            className="form-input"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary register-btn"
                    disabled={loading}
                >
                    {loading ? 'Đang gửi đăng ký...' : 'Đăng ký Artisan'}
                </button>

                <div className="register-footer">
                    <p>Đã có tài khoản? <Link to="/login" className="login-link">Đăng nhập</Link></p>
                </div>
            </form>
        </div>
    );
};

export default ArtisanRegisterForm;

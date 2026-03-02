import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import './ArtisanCentrePage.css';

const ArtisanCentrePage = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [artisanName, setArtisanName] = useState('');
    const [bio, setBio] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [experienceYear, setExperienceYear] = useState('');
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (user?.role === 'artisan') {
            navigate('/artisan', { replace: true });
        }
    }, [user?.role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const expYear = experienceYear === '' ? undefined : parseInt(experienceYear, 10);
            if (experienceYear !== '' && (isNaN(expYear) || expYear < 0)) {
                setError('Số năm kinh nghiệm không hợp lệ.');
                setLoading(false);
                return;
            }
            const result = await authService.applyArtisan({
                artisanName: artisanName.trim() || undefined,
                bio: bio.trim() || undefined,
                specialization: specialization.trim() || undefined,
                experienceYear: expYear,
                portfolioUrl: portfolioUrl.trim() || undefined,
            });
            if (result.success) {
                setSubmitted(true);
            } else {
                setError(result.error || 'Gửi đơn thất bại. Vui lòng thử lại.');
            }
        } catch {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
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
                        <h1>Artisan Centre</h1>
                        <p>Trung tâm dành cho nghệ nhân – đăng ký trở thành nghệ nhân hoặc quản lý cửa hàng của bạn.</p>
                    </div>
                </div>

                <div className="container artisan-centre-content">
                    {!isAuthenticated ? (
                        <div className="artisan-centre-login-prompt">
                            <div className="login-prompt-card">
                                <h2>Đăng nhập để tiếp tục</h2>
                                <p>Bạn cần đăng nhập để đăng ký trở thành nghệ nhân trên Sanctus.</p>
                                <Link to="/login" className="btn btn-primary">
                                    Đăng nhập
                                </Link>
                                <p className="login-prompt-register">
                                    Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                                </p>
                            </div>
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
                                <h2>Đơn đăng ký đã được gửi</h2>
                                <p>Chúng tôi đã nhận đơn đăng ký trở thành nghệ nhân của bạn. Admin sẽ xem xét và phản hồi trong thời gian sớm nhất.</p>
                                <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
                                    Về trang chủ
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="artisan-centre-form-section">
                            <div className="form-section-header">
                                <h2>Đăng ký trở thành Nghệ nhân</h2>
                                <p>Điền thông tin bên dưới để gửi đơn đăng ký. Admin sẽ duyệt và liên hệ với bạn.</p>
                            </div>
                            <form onSubmit={handleSubmit} className="artisan-apply-form">
                                {error && (
                                    <div className="error-message">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                                        </svg>
                                        {error}
                                    </div>
                                )}
                                <div className="form-group">
                                    <label htmlFor="artisanName" className="form-label">Tên nghệ nhân / Xưởng</label>
                                    <input
                                        type="text"
                                        id="artisanName"
                                        className="form-input"
                                        placeholder="Ví dụ: Xưởng gỗ Đức Anh"
                                        value={artisanName}
                                        onChange={(e) => setArtisanName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="specialization" className="form-label">Chuyên môn</label>
                                    <input
                                        type="text"
                                        id="specialization"
                                        className="form-input"
                                        placeholder="Ví dụ: Đồ gỗ, gốm sứ, thêu"
                                        value={specialization}
                                        onChange={(e) => setSpecialization(e.target.value)}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="experienceYear" className="form-label">Số năm kinh nghiệm</label>
                                        <input
                                            type="number"
                                            id="experienceYear"
                                            className="form-input"
                                            placeholder="0"
                                            min={0}
                                            value={experienceYear}
                                            onChange={(e) => setExperienceYear(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="portfolioUrl" className="form-label">Link portfolio</label>
                                        <input
                                            type="url"
                                            id="portfolioUrl"
                                            className="form-input"
                                            placeholder="https://..."
                                            value={portfolioUrl}
                                            onChange={(e) => setPortfolioUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="bio" className="form-label">Giới thiệu ngắn</label>
                                    <textarea
                                        id="bio"
                                        className="form-input form-textarea"
                                        placeholder="Giới thiệu về bạn và tác phẩm..."
                                        rows={4}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
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

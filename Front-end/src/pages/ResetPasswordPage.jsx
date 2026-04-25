import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import { appToast } from '../lib/appToast';
import './ResetPasswordPage.css';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            appToast.error('Token không hợp lệ', 'Vui lòng mở lại liên kết trong email.');
            return;
        }

        if (newPassword !== confirmPassword) {
            appToast.error('Mật khẩu không khớp', 'Mật khẩu xác nhận phải trùng với mật khẩu mới.');
            return;
        }

        if (!passwordRegex.test(newPassword)) {
            appToast.error(
                'Mật khẩu chưa đủ mạnh',
                'Mật khẩu phải có ít nhất 6 ký tự, gồm chữ hoa, chữ thường và số.'
            );
            return;
        }

        setLoading(true);
        try {
            const result = await authService.resetPassword({
                token,
                newPassword,
                confirmPassword,
            });

            if (result.success) {
                appToast.success('Đặt lại mật khẩu thành công', result.message || 'Bạn có thể đăng nhập với mật khẩu mới.');
                navigate('/login');
            } else {
                appToast.error('Không thể đặt lại mật khẩu', result.error || 'Vui lòng thử lại.');
            }
        } catch {
            appToast.error('Có lỗi xảy ra', 'Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-page">
            <div className="reset-card">
                <div className="reset-header">
                    <h1>Đặt lại mật khẩu</h1>
                    <p>Nhập mật khẩu mới để hoàn tất quá trình khôi phục tài khoản.</p>
                </div>

                <form className="reset-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="newPassword" className="form-label">Mật khẩu mới</label>
                        <input
                            id="newPassword"
                            type="password"
                            className="form-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nhập mật khẩu mới"
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới"
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="reset-note">
                        Mật khẩu phải có ít nhất 6 ký tự, gồm chữ hoa, chữ thường và số.
                    </div>

                    <button type="submit" className="btn btn-primary reset-btn" disabled={loading || !token}>
                        {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                    </button>

                    <div className="reset-footer">
                        <Link to="/login" className="reset-back-link">Quay lại đăng nhập</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;

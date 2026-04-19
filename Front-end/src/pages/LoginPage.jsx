import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { appToast } from '../lib/appToast';
import LoginForm from '../components/LoginForm/LoginForm';
import logo from '../assets/logo.png';
import './LoginPage.css';

const LoginPage = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const verified = searchParams.get('verified');
        const message = searchParams.get('message');

        if (!verified) return;

        if (verified === 'success') {
            appToast.success('Xác minh email thành công', message || 'Tài khoản của bạn đã được xác minh. Bạn có thể đăng nhập ngay bây giờ.');
            return;
        }

        appToast.error('Xác minh email thất bại', message || 'Không thể xác minh email. Vui lòng thử lại.');
    }, [searchParams]);

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Left Side - Image */}
                <div className="login-image-section">
                    <div className="login-overlay"></div>
                    <div className="login-image-content">
                        <Link to="/" className="login-logo">
                            <img src={logo} alt="Sanctus logo" className="login-logo-image" />
                            <span>Sanctus</span>
                        </Link>
                        <div className="login-image-text">
                            <h2>Connect with Sacred Artisans</h2>
                            <p>Join our community of faithful craftspeople creating beautiful works imbued with prayer and devotion.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="login-form-section">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

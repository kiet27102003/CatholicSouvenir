import React, { useState } from 'react';
import RegisterForm from '../components/RegisterForm/RegisterForm';
import ArtisanRegisterForm from '../components/ArtisanRegisterForm/ArtisanRegisterForm';
import './RegisterPage.css';

const RegisterPage = () => {
    const [registerType, setRegisterType] = useState('user'); // 'user' | 'artisan'

    return (
        <div className="register-page">
            <div className="register-container">
                {/* Left Side - Image */}
                <div className="register-image-section">
                    <div className="register-overlay"></div>
                    <div className="register-image-content">
                        <div className="register-logo">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Sanctus</span>
                        </div>
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

                {/* Right Side - Toggle + Form */}
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
                        {registerType === 'user' ? <RegisterForm /> : <ArtisanRegisterForm />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;

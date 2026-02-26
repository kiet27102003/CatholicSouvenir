import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPasswordForm.css';

const ForgotPasswordForm = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call to send reset link
        setTimeout(() => {
            setLoading(false);
            setIsSubmitted(true);
        }, 1500);
    };

    if (isSubmitted) {
        return (
            <div className="forgot-form-container">
                <div className="forgot-form-header">
                    <div className="success-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h1 className="forgot-title">Check your email</h1>
                    <p className="forgot-subtitle">
                        We have sent a password reset link to <br />
                        <strong>{email}</strong>
                    </p>
                </div>

                <div className="forgot-footer" style={{ marginTop: '2rem' }}>
                    <Link to="/login" className="back-to-login-btn">
                        Return to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="forgot-form-container">
            <div className="forgot-form-header">
                <h1 className="forgot-title">Reset Password</h1>
                <p className="forgot-subtitle">Enter your email and we'll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleSubmit} className="forgot-form">
                <div className="form-group">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        className="form-input"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary forgot-btn"
                    disabled={loading || !email}
                >
                    {loading ? 'Sending link...' : 'Send reset link'}
                </button>

                <div className="forgot-footer">
                    <Link to="/login" className="back-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to sign in
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default ForgotPasswordForm;

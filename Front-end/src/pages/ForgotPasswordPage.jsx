import React from 'react';
import ForgotPasswordForm from '../components/ForgotPasswordForm/ForgotPasswordForm';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
    return (
        <div className="forgot-page">
            <div className="forgot-container">
                <ForgotPasswordForm />
            </div>
        </div>
    );
};

export default ForgotPasswordPage;

import React from 'react';
import RegisterForm from '../components/RegisterForm/RegisterForm';
import './RegisterPage.css';

const RegisterPage = () => {
    return (
        <div className="register-page">
            <div className="register-container">
                <RegisterForm />
            </div>
        </div>
    );
};

export default RegisterPage;

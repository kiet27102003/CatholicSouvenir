import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../cofig/api';
import { appToast } from '../lib/appToast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage or sessionStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('sanctus_user') || sessionStorage.getItem('sanctus_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                appToast.warning('Phiên hết hạn', 'Vui lòng đăng nhập lại');
                localStorage.removeItem('sanctus_user');
                sessionStorage.removeItem('sanctus_user');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData, rememberMe = false) => {
        setUser(userData);
        if (rememberMe) {
            localStorage.setItem('sanctus_user', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('sanctus_user', JSON.stringify(userData));
        }
    };

    const clearSession = () => {
        setUser(null);
        localStorage.removeItem('sanctus_user');
        sessionStorage.removeItem('sanctus_user');
    };

    const logout = async () => {
        try {
            await api.post('/authen/logout');
        } catch {
            // Always clear the client session even if the server logout fails.
        } finally {
            clearSession();
            if (typeof window !== 'undefined') {
                window.location.replace('/');
            }
        }
    };

    const updateUser = (newUserData) => {
        const updatedUser = { ...user, ...newUserData };
        setUser(updatedUser);
        if (localStorage.getItem('sanctus_user')) {
            localStorage.setItem('sanctus_user', JSON.stringify(updatedUser));
        } else if (sessionStorage.getItem('sanctus_user')) {
            sessionStorage.setItem('sanctus_user', JSON.stringify(updatedUser));
        }
    };

    const value = {
        user,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;

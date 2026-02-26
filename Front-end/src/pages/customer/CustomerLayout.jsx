import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './CustomerLayout.css';

const CustomerLayout = () => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated || user?.role !== 'customer') {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="customer-layout">
            <Header />
            <div className="customer-main-container">
                <aside className="customer-sidebar">
                    <div className="sidebar-profile">
                        {user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="sidebar-avatar" />
                        ) : (
                            <div className="sidebar-avatar-placeholder">
                                {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                            </div>
                        )}
                        <h3 className="sidebar-name">{user.name || 'Customer'}</h3>
                        <p className="sidebar-email">{user.email}</p>
                    </div>

                    <nav className="sidebar-nav">
                        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            My Profile
                        </NavLink>

                        <NavLink to="/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            Order History
                        </NavLink>

                        <NavLink to="/custom-requests" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Custom Requests
                        </NavLink>

                        <NavLink to="/messages" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            Messages
                        </NavLink>
                    </nav>
                </aside>

                <main className="customer-content">
                    <Outlet />
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default CustomerLayout;

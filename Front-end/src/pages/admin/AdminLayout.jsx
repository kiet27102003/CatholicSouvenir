import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';
import {
    FiSettings,
    FiUsers,
    FiMenu,
    FiBell,
    FiSearch,
    FiLogOut,
    FiFileText
} from 'react-icons/fi';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const menuItems = [
        { path: '/admin/settings', name: 'Cấu hình hệ thống', icon: <FiSettings /> },
        { path: '/admin/users', name: 'Quản lý người dùng', icon: <FiUsers /> },
        { path: '/admin/artisan-applications', name: 'Artisan Application', icon: <FiFileText /> },
    ];

    // Derive page title from path
    const getPageTitle = () => {
        const item = menuItems.find(item => location.pathname.includes(item.path));
        return item ? item.name : 'Trang quản trị';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo">Sanctus<span>Admin</span></div>
                    <button className="mobile-close-btn" onClick={toggleSidebar}>&times;</button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-title">Menu chính</div>
                    <ul>
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-text">{item.name}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <FiLogOut className="nav-icon" />
                        <span className="nav-text">Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className={`admin-main-wrapper ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
                {/* Topbar */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <button className="toggle-sidebar-btn" onClick={toggleSidebar} aria-label="Toggle menu">
                            <FiMenu />
                        </button>
                        <div>
                            <div className="admin-breadcrumb">Admin / <span>{getPageTitle()}</span></div>
                            <h1 className="page-title">{getPageTitle()}</h1>
                        </div>
                    </div>

                    <div className="topbar-right">
                        <div className="search-bar hidden-mobile">
                            <FiSearch className="search-icon" />
                            <input type="text" placeholder="Tìm kiếm..." />
                        </div>

                        <button className="icon-btn">
                            <FiBell />
                            <span className="notification-badge">3</span>
                        </button>

                        <div className="admin-profile">
                            <div className="profile-info hidden-mobile">
                                <span className="profile-name">{user?.name || 'Admin'}</span>
                                <span className="profile-role">{user?.role === 'admin' ? 'System Administrator' : user?.role || 'Admin'}</span>
                            </div>
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=1e3a8a&color=fff`}
                                alt="Profile"
                                className="profile-avatar"
                            />
                        </div>
                    </div>
                </header>

                {/* Dynamic Content */}
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

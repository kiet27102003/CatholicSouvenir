import React, { useState, useMemo, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminLayoutContext } from './AdminLayoutContext';
import './AdminLayout.css';
import { FiSettings, FiUsers, FiUser, FiAward, FiLogOut, FiFileText, FiPackage } from 'react-icons/fi';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuth();

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen((open) => !open);
    }, []);

    const layoutValue = useMemo(() => ({ toggleSidebar }), [toggleSidebar]);

    const menuItems = [
        { path: '/admin/settings', name: 'Cấu hình hệ thống', icon: <FiSettings /> },
        { path: '/admin/users', name: 'Quản lý người dùng', icon: <FiUsers /> },
        { path: '/admin/customers', name: 'Quản lý khách hàng', icon: <FiUser /> },
        { path: '/admin/artisans', name: 'Quản lý nghệ nhân', icon: <FiAward /> },
        { path: '/admin/products', name: 'Quản lý sản phẩm', icon: <FiPackage /> },
        { path: '/admin/artisan-applications', name: 'Artisan Application', icon: <FiFileText /> },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <AdminLayoutContext.Provider value={layoutValue}>
            <div className="admin-container">
                <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-header">
                        <div className="logo">
                            Sanctus<span>Admin</span>
                        </div>
                        <button type="button" className="mobile-close-btn" onClick={toggleSidebar}>
                            &times;
                        </button>
                    </div>

                    <nav className="sidebar-nav">
                        <div className="nav-section-title">Menu chính</div>
                        <ul>
                            {menuItems.map((item) => (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                                    >
                                        <span className="nav-icon">{item.icon}</span>
                                        <span className="nav-text">{item.name}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="sidebar-footer">
                        <button type="button" className="logout-btn" onClick={handleLogout}>
                            <FiLogOut className="nav-icon" />
                            <span className="nav-text">Đăng xuất</span>
                        </button>
                    </div>
                </aside>

                <div className={`admin-main-wrapper ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
                    <main className="admin-content">
                        <Outlet />
                    </main>
                </div>
            </div>
        </AdminLayoutContext.Provider>
    );
};

export default AdminLayout;

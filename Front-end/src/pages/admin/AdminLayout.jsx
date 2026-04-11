import React, { useState, useMemo, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminLayoutContext } from './AdminLayoutContext';
import './AdminLayout.css';
import {
    FiUsers,
    FiUser,
    FiAward,
    FiLogOut,
    FiFileText,
    FiPackage,
    FiGrid,
    FiHome,
    FiClipboard,
    FiDollarSign,
    FiActivity,
    FiGift,
    FiCreditCard,
} from 'react-icons/fi';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const { isAuthenticated, logout, user } = useAuth();

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen((open) => !open);
    }, []);

    const layoutValue = useMemo(() => ({ toggleSidebar }), [toggleSidebar]);

    const menuItems = [
        { path: '/admin/dashboard', name: 'Bảng điều khiển', icon: <FiHome /> },
        { path: '/admin/users', name: 'Tài khoản', icon: <FiUsers /> },
        { path: '/admin/artisan-applications', name: 'Đơn đăng ký Nghệ nhân', icon: <FiFileText /> },
        { path: '/admin/products', name: 'Duyệt sản phẩm', icon: <FiPackage /> },
        { path: '/admin/orders', name: 'Đơn hàng', icon: <FiClipboard /> },
        { path: '/admin/payments', name: 'Thanh toán', icon: <FiDollarSign /> },
        { path: '/admin/wallets', name: 'Quản lý ví', icon: <FiCreditCard /> },
        { path: '/admin/settings', name: 'Giám sát hệ thống', icon: <FiActivity /> },
        { path: '/admin/customers', name: 'Khách hàng', icon: <FiUser /> },
        { path: '/admin/artisans', name: 'Nghệ nhân', icon: <FiAward /> },
        { path: '/admin/categories', name: 'Danh mục', icon: <FiGrid /> },
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
                            <span className="logo-icon"><FiGift /></span>
                            <div>
                                <strong>Catholic Market</strong>
                                <p>CÔNG QUẢN TRỊ</p>
                            </div>
                        </div>
                        <button type="button" className="mobile-close-btn" onClick={toggleSidebar}>
                            &times;
                        </button>
                    </div>

                    <nav className="sidebar-nav">
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
                        <div className="admin-user-card">
                            <img
                                src={
                                    user?.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Quản trị viên')}&background=fff7ed&color=9a3412`
                                }
                                alt="Quản trị viên"
                                className="admin-user-avatar"
                            />
                            <div className="admin-user-info">
                                <strong>{user?.name || 'Quản trị viên'}</strong>
                                <p>Quản trị hệ thống</p>
                            </div>
                            <button type="button" className="logout-btn" onClick={handleLogout} title="Đăng xuất">
                                <FiLogOut className="nav-icon" />
                            </button>
                        </div>
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

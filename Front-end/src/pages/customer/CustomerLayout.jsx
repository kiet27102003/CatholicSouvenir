import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { FiUser, FiShield, FiBell, FiCreditCard, FiTruck, FiLogOut, FiEdit2, FiInbox, FiDollarSign } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './CustomerLayout.css';

const CustomerLayout = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated || user?.role !== 'customer') {
        return <Navigate to="/login" replace />;
    }

    const isProfile = location.pathname === '/profile';
    const activeTab = isProfile ? new URLSearchParams(location.search).get('tab') || 'profile' : '';
    const isProfileNoHash = isProfile && activeTab === 'profile';
    const isSecurityActive = isProfile && activeTab === 'security';
    const isNotificationsActive = isProfile && activeTab === 'notifications';
    const isPaymentActive = isProfile && activeTab === 'payment';
    const isWalletActive = location.pathname === '/wallet';

    return (
        <div className="customer-layout">
            <Header />
            <div className="customer-main-container">
                <aside className="customer-sidebar">
                    <nav className="sidebar-nav">
                        <NavLink to="/profile" className={`sidebar-link ${isProfileNoHash ? 'active' : ''}`} end>
                            <FiUser size={20} strokeWidth={2} />
                            Hồ sơ cá nhân
                        </NavLink>
                        <NavLink to="/profile?tab=security" className={`sidebar-link ${isSecurityActive ? 'active' : ''}`}>
                            <FiShield size={20} strokeWidth={2} />
                            Bảo mật
                        </NavLink>
                        <NavLink to="/profile?tab=notifications" className={`sidebar-link ${isNotificationsActive ? 'active' : ''}`}>
                            <FiBell size={20} strokeWidth={2} />
                            Thông báo
                        </NavLink>
                        <NavLink to="/profile?tab=payment" className={`sidebar-link ${isPaymentActive ? 'active' : ''}`}>
                            <FiCreditCard size={20} strokeWidth={2} />
                            Thanh toán
                        </NavLink>
                        <NavLink to="/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <FiTruck size={20} strokeWidth={2} />
                            Đơn hàng của tôi
                        </NavLink>
                        <NavLink to="/wallet" className={`sidebar-link ${isWalletActive ? 'active' : ''}`}>
                            <FiDollarSign size={20} strokeWidth={2} />
                            Ví của tôi
                        </NavLink>
                        <NavLink to="/custom-requests" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <FiEdit2 size={20} strokeWidth={2} />
                            Yêu cầu đặt riêng
                        </NavLink>
                        <NavLink to="/my-custom-requests" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <FiInbox size={20} strokeWidth={2} />
                            Quản lý yêu cầu
                        </NavLink>
                        <NavLink to="/messages" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <FiBell size={20} strokeWidth={2} />
                            Tin nhắn
                        </NavLink>
                        <div className="sidebar-divider" role="separator" aria-hidden="true" />
                        <button type="button" className="sidebar-link sidebar-logout" onClick={logout}>
                            <FiLogOut size={20} strokeWidth={2} />
                            Đăng xuất
                        </button>
                    </nav>

                    <div className="sidebar-support">
                        <h4 className="sidebar-support-title">Cần hỗ trợ?</h4>
                        <p className="sidebar-support-desc">Liên hệ với đội ngũ CSKH của chúng tôi 24/7.</p>
                        <button type="button" className="btn sidebar-support-btn">Gửi yêu cầu</button>
                    </div>
                </aside>

                <main className="customer-content-wrapper">
                    <Outlet />
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default CustomerLayout;

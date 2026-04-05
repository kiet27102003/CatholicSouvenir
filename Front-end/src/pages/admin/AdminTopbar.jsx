import React, { useState } from 'react';
import { FiMenu, FiBell, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useAdminLayout } from './AdminLayoutContext';

/**
 * Single admin header: toggle, breadcrumb, title, search, notifications, profile.
 * Render once at the top of each admin page (layout does not render a second header).
 */
const AdminTopbar = ({ title, breadcrumb }) => {
    const { toggleSidebar } = useAdminLayout();
    const { user } = useAuth();
    const [search, setSearch] = useState('');

    const crumb = breadcrumb ?? (
        <>
            Admin / <span>{title}</span>
        </>
    );

    return (
        <header className="admin-topbar">
            <div className="topbar-left">
                <button type="button" className="toggle-sidebar-btn" onClick={toggleSidebar} aria-label="Toggle menu">
                    <FiMenu />
                </button>
                <div>
                    <div className="admin-breadcrumb">{crumb}</div>
                    <h1 className="page-title">{title}</h1>
                </div>
            </div>

            <div className="topbar-right">
                <div className="search-bar hidden-mobile">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <button type="button" className="icon-btn" aria-label="Thông báo">
                    <FiBell />
                    <span className="notification-badge">3</span>
                </button>

                <div className="admin-profile">
                    <div className="profile-info hidden-mobile">
                        <span className="profile-name">{user?.name || 'Admin'}</span>
                        <span className="profile-role">
                            {user?.role === 'admin' ? 'System Administrator' : user?.role || 'Admin'}
                        </span>
                    </div>
                    <img
                        src={
                            user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=1e3a8a&color=fff`
                        }
                        alt="Profile"
                        className="profile-avatar"
                    />
                </div>
            </div>
        </header>
    );
};

export default AdminTopbar;

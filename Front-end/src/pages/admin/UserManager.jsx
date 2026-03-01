import React, { useState } from 'react';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiPlus, FiMoreVertical, FiUsers } from 'react-icons/fi';
import './admin-common.css';
import './UserManager.css';

// Mock Data
const MOCK_USERS = [
    { id: 1, name: 'Alice Smith', email: 'alice@sanctus.com', role: 'Admin', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=Alice+Smith&background=0D8ABC&color=fff' },
    { id: 2, name: 'Bob Jones', email: 'bob@example.com', role: 'Artisan', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=Bob+Jones&background=8B5A2B&color=fff' },
    { id: 3, name: 'Charlie Dave', email: 'charlie@demo.com', role: 'User', status: 'Inactive', avatar: 'https://ui-avatars.com/api/?name=Charlie+Dave&background=555&color=fff' },
    { id: 4, name: 'Diana King', email: 'diana@test.com', role: 'User', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=Diana+King&background=F3A530&color=fff' },
    { id: 5, name: 'Evan Wright', email: 'evan@sanctus.com', role: 'Artisan', status: 'Pending', avatar: 'https://ui-avatars.com/api/?name=Evan+Wright&background=6C7A89&color=fff' },
];

const UserManager = () => {
    const [users, setUsers] = useState(MOCK_USERS);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');

    // Filtering Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Active': return 'badge-success';
            case 'Inactive': return 'badge-danger';
            case 'Pending': return 'badge-warning';
            default: return 'badge-secondary';
        }
    };

    return (
        <div className="admin-page user-manager-page">
            <div className="admin-page-header user-manager-header">
                <div>
                    <h2>Quản lý người dùng</h2>
                    <p className="admin-page-subtitle">Quản lý tài khoản, vai trò và quyền hạn.</p>
                </div>
                <button type="button" className="btn btn-primary btn-icon">
                    <FiPlus />
                    Thêm người dùng
                </button>
            </div>

            <div className="controls-bar">
                <div className="search-box">
                    <FiSearch className="control-icon" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoặc email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <FiFilter className="control-icon" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="All">Tất cả vai trò</option>
                        <option value="Admin">Admin</option>
                        <option value="Artisan">Thợ thủ công</option>
                        <option value="User">Người dùng</option>
                    </select>
                </div>
            </div>

            <div className="admin-card table-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th width="50">#</th>
                                <th width="300">Người dùng</th>
                                <th width="150">Vai trò</th>
                                <th width="150">Trạng thái</th>
                                <th width="120" className="text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user, index) => (
                                    <tr key={user.id} className="animate-fade-in row-delay">
                                        <td className="text-muted">{index + 1}</td>
                                        <td>
                                            <div className="table-user-cell">
                                                <img src={user.avatar} alt={user.name} className="table-avatar" />
                                                <div className="table-user-info">
                                                    <span className="user-name">{user.name}</span>
                                                    <span className="user-email">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="role-tag">{user.role}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadgeClass(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons">
                                                <button className="btn-action edit" title="Edit User">
                                                    <FiEdit2 />
                                                </button>
                                                <button className="btn-action delete" title="Delete User">
                                                    <FiTrash2 />
                                                </button>
                                                <button className="btn-action more" title="More Options">
                                                    <FiMoreVertical />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="empty-state">
                                        <div className="admin-empty-state">
                                            <FiUsers style={{ fontSize: '2.5rem', color: 'var(--admin-border)' }} />
                                            <h4>Không tìm thấy người dùng</h4>
                                            <p>Thử thay đổi từ khóa hoặc bộ lọc.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination stub */}
                <div className="table-footer">
                    <span className="showing-text">
                        Hiển thị {filteredUsers.length} / {users.length} người dùng
                    </span>
                    <div className="pagination">
                        <button type="button" className="btn-page" disabled>Trước</button>
                        <button type="button" className="btn-page active">1</button>
                        <button type="button" className="btn-page">Sau</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManager;
